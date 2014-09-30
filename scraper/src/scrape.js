/** @module scrape */

var async = require('async'),
    _ = require('lodash'),
    winston = require('winston'),
    request = require('request'),
    mongodb = require('mongodb'),
    mongoose = require('mongoose'),
    cheerio = require('cheerio'),
    Str = require('string');

var PImage = require('../../models/PImage');

module.exports = function(Channel, Episode, options) {

    options =
        _.extend({
                /**
                 * Determines whether the function should update the existing value of channel and episode
                 * if they are set. 'true' will update existing object, 'false' will skip updating object (but
                 * will still process sub-documents).
                 * @type {Boolean}
                 */
                softUpdate: false
            },
            options
    );
    /**
     * Returns an object with the scraped values of an 'episode' from an item XML tag from a podcast RSS feed
     * @param  element An XML-DOM object corresponding to an 'item' element from an RSS feed
     * @return {Object} An object with the scraped values of the episode in element
     */
    function scrapeEpisode(element) {
        element = cheerio.load(element, {
            xmlMode: true
        });
        var episode = {
            title: element('title').text(),
            link: element('link').text(),
            description: Str(element('description').text()).stripTags().s
        };

        if (element('pubDate')) {
            episode.pubDate = element('pubDate').text();
        }

        if (element('guid')) {
            episode.guid = element('guid').text();
        }

        return episode;
    }

    /**
     * Scrapes a Channel object and passes it in to callback
     * @param  element XML-DOM object corresponding to a 'channel' element from an RSS feed
     * @param  {scrapedChannelCallback} callback Called after element is turned in to a Channel or with an error
     */
    function scrapeChannel(channelXML, callback) {

        channelXML = cheerio.load(channelXML, {
            xmlMode: true
        });
        Channel.model.findOne({
            title: channelXML('channel > title').text()
        }, function elementResult(err, channel) {
            if (!channel) {
                channel = new Channel.model({
                    title: channelXML('channel > title').text()
                });
                winston.info('Channel: [' + channel.title + '] was not found in the database');
            }

            var episodes = channelXML('item'),
                seenEpisodeCount = 0;

            episodes.each(function(i, episodeXML) {
                var episode = new Episode.model(scrapeEpisode(episodeXML));
                seenEpisodeCount++;
                if (!channel.containsEpisode(episode.getID())) {
                    winston.log('debug', 'adding episode to channel');
                    channel.addEpisode(
                        episode
                    );
                } else if (options.softUpdate) {
                    winston.log('debug', 'updating existing episode (soft-update enabled) [%s] [%s]', episode.title, channel.title);
                    channel.updateEpisode(episode);
                } else {
                    winston.log('debug', 'episode already in db, not updating (soft-update not enabled) [%s] [%s]', episode.title, channel.title);
                }
            });

            winston.log('info', 'saw [%d] episodes in feed', seenEpisodeCount);

            if (channelXML('image').length === 0) {
                return callback(null, channel);
            } else {
                var imageURL = channelXML('image > url').text();

                var lastImage = channel.getLastImage();

                if (!options.softUpdate && lastImage && lastImage.originalURL === imageURL) {
                    winston.info("Not updating image for channel [" + channel.title + "], already at the latest (soft update is off)");
                    return callback(null, channel);
                } else {
                    requestImage(imageURL,
                        function(err, imageResponse) {
                            if (err) {
                                winston.error("Error scraping image at URL [" + imageURL + "], channel [" + channel.title + "]: " + err.toString());
                                return callback(null, channel);
                            }

                            var scrapedImage = new PImage.model({
                                originalURL: imageURL
                            });

                            scrapedImage.saveImage(imageResponse,
                                function(err, savedImage) {
                                    if (err) {
                                        winston.error("Error saving image [" + imageURL + "] for channel [" + channel.title + "]: " + err);
                                        return callback(null, channel);
                                    }
                                    winston.info("Saved image for channel [" + channel.title + "] (soft update: " + options.softUpdate + ")");
                                    channel.images.push(savedImage);
                                    return callback(null, channel);
                                });
                        }
                    );
                }
            }
        });
    }

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

    /**
     * Scrapes an RSS XML document and passes a list of scraped Channels to a callback or any errors
     * @param  element XML-DOM object corresponding to a 'channel' element from an RSS feed
     * @param  {scrapedSourceCallback} callback Called after a source is scraped and a list of Channel objects is populated
     */
    function scrapeSource(data, callback) {

        var channelList = [];
        var $ = cheerio.load(data, {
            xmlMode: true
        });
        async.each(
            $('rss > channel'),
            function eachIterator(channel, done) {
                scrapeChannel(channel,
                    function withChannel(err, channel) {
                        if (err) {
                            return done(err);
                        } else {
                            channelList.push(channel);
                            return done();
                        }
                    }
                );
            },
            function eachFinally(err) {
                if (err) {
                    return callback(err);
                } else {
                    return callback(null, channelList);
                }
            }
        );
    }

    return {
        scrapeEpisode: scrapeEpisode,
        scrapeChannel: scrapeChannel,
        scrapeSource: scrapeSource
    };
};
