var async = require('async'),
    _ = require('lodash'),
    winston = require('winston'),
    request = require('request'),
    mongodb = require('mongodb'),
    mongoose = require('mongoose'),
    cheerio = require('cheerio'),
    Str = require('string');

var PImage = require('../../models/PImage'),
    Channel = require('../../models/Channel'),
    Episode = require('../../models/Episode');

var defaultOptions = {
    /**
     * Determines whether the function should update the existing value of channel and episode
     * if they are set. 'true' will update existing object, 'false' will skip updating object (but
     * will still process sub-documents).
     * @type {Boolean}
     */
    softUpdate: false
};

function castAsCheerioXML(xml) {

    if (!xml) {
        throw new Error("Given xml was null or undefined");
        /* #root() is a function in cheerio objects that is unlikely to be a property on
         * other types, such as strings or buffers.
         */
    } else if (xml.root) {
        return xml;
    } else {
        return cheerio.load(xml, {
            xmlMode: true
        });
    }
}

function Scraper(options) {
    this.options = _.extend(defaultOptions, options);
    this.hasRun = false;
    this.channelImage = null;
    this.channel = null;
}

Scraper.prototype.run = function(xml, callback) {
    var self = this;
    self.xml = xml;

    var $ = castAsCheerioXML(xml);

    var channelXML = $('rss > channel').get(0);

    self.scrapeChannel(channelXML,
        function withChannel(err) {
            if (err) {
                return callback(err);
            } else {
                return callback(null, self);
            }
        }
    );
};

/**
 * Returns an object with the scraped values of an 'episode' from an item XML tag from a podcast RSS feed
 * @param  element An XML-DOM object corresponding to an 'item' element from an RSS feed
 * @return {Object} An object with the scraped values of the episode in element
 */
Scraper.scrapeEpisode = function(elementXML) {
    var $element = castAsCheerioXML(elementXML);

    var episode = {
        title: $element('title').text(),
        link: $element('link').text(),
        description: Str($element('description').text()).stripTags().s
    };

    if ($element('pubDate')) {
        episode.pubDate = $element('pubDate').text();
    }

    if ($element('guid')) {
        episode.guid = $element('guid').text();
    }

    return episode;
};

Scraper.scrapeEpisodes = function(episodesXML) {
    var seenEpisodeCount = 0,
        episodes = [];

    episodesXML.each(function(i, episodeXML) {
        var episode = new Episode.model(Scraper.scrapeEpisode(episodeXML));
        episodes.push(episode);
        seenEpisodeCount++;
    });

    winston.log('info', 'saw [%d] episodes in feed', seenEpisodeCount);

    return episodes;
};

Scraper.prototype.addScrapedEpisodes = function(episodes, storedEpisodeIDs) {
    var self = this;

    _.each(episodes, function(episode) {
        if (storedEpisodeIDs.indexOf(episode.getCustomID()) === -1) {
            winston.log('debug', 'adding episode to channel');
            self.channel.addEpisode(
                episode
            );
            //TODO: these were not caught by tests, channel was used instead of self.channel
        } else if (self.options.softUpdate) {
            winston.log('debug', 'updating existing episode (soft-update enabled) [%s] [%s]', episode.title, self.channel.title);
            self.channel.updateEpisode(episode);
        } else {
            winston.log('debug', 'episode already in channel, not updating (soft-update not enabled) [%s] [%s]', episode.title, self.channel.title);
        }
    });
};

Scraper.scrapeImageURL = function(channelXML) {
    var $channel = castAsCheerioXML(channelXML);

    if ($channel('image').length === 0) {
        return null;
    } else {
        return $channel('image > url').text();
    }
};

Scraper.prototype.scrapeChannel = function(channelXML, callback) {
    var self = this;

    var $channel = castAsCheerioXML(channelXML);

    Channel.model.findOne({
        title: $channel('channel > title').text()
    }, function elementResult(err, channel) {
        if (!channel) {
            channel = new Channel.model({
                title: $channel('channel > title').text()
            });
            winston.info('Channel: [' + channel.title + '] was not found in the database');
        }
        self.channel = channel;

        self.channel.retrieveEpisodeCustomIDs(
            function(err, storedEpisodes) {
                if (err) {
                    return callback(err);
                }

                var episodes = Scraper.scrapeEpisodes($channel('item'));
                self.addScrapedEpisodes(episodes, storedEpisodes);

                //this makes no sense, use pimage in channel
                self.channelImageURL = Scraper.scrapeImageURL($channel);

                if (!self.channelImageURL) {
                    return callback(null, self);
                } else {
                    self.scrapeImage(
                        function doneScrapingImage() {
                            return callback(null, self);
                        }
                    );
                }

            });
    });
};

Scraper.prototype.scrapeImage = function(callback) {
    var self = this;

    var lastImage = self.channel.getLastImage();
    if (!self.options.softUpdate && lastImage && lastImage.originalURL === self.channelImageURL) {
        winston.info("Not updating image for channel [" + self.channel.title + "], already at the latest (soft update is off)");
        return callback(null, self);
    } else {

        //TODO: put this as a static method for PImage
        requestImage(self.channelImageURL,
            function(err, imageResponse) {
                if (err) {
                    winston.error("Error scraping image at URL [" + self.channelImageURL + "], channel [" + self.channel.title + "]: " + err.toString());
                    return callback(err, self);
                }

                var scrapedImage = new PImage.model({
                    originalURL: self.channelImageURL
                });

                scrapedImage.imageBuffer = imageResponse;

                self.channel.addImage(scrapedImage);

                return callback(null, self);

            }
        );
    }
};

function requestImage(url, callback) {
    request.get(url, {
            encoding: null
        },
        function(err, response, body) {
            if (err) {
                return callback(err);
            }
            switch (response.statusCode) {
                case 200:
                    var grid = new mongodb.Grid(mongoose.connection.db, 'channel_images');
                    return callback(err, body);
                default:
                    return callback(err);
            }
        }
    );
}


module.exports = Scraper;
