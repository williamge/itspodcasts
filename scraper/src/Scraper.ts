
/// <reference path="../../typings/lodash/lodash.d.ts" />
/// <reference path="../../typings/winston/winston.d.ts" />
/// <reference path="../../typings/async/async.d.ts" />
/// <reference path="../../typings/node/node.d.ts" />
/// <reference path="../../typings/minimist/minimist.d.ts" />
/// <reference path="../../typings/request/request.d.ts" />
/// <reference path="../../typings/cheerio/cheerio.d.ts" />
/// <reference path="../../typings/mongodb/mongodb.d.ts" />

/// <reference path="../../typings/string/string.d.ts" />


import PodcastSource = require('../../models/PodcastSource');
import path = require('path');
import fs = require('fs');
import async = require('async');
import _ = require('lodash');
import request = require('request');
import winston = require('winston');

import mongodb = require('mongodb');
import mongoose = require('mongoose');
import cheerio = require('cheerio');
import Str = require('string');

import PImage = require('../../models/PImage');
import Channel = require('../../models/Channel');
import Episode = require('../../models/Episode');

var defaultOptions: {
    softUpdate: boolean;
} = {
    /**
     * Determines whether the function should update the existing value of channel and episode
     * if they are set. 'true' will update existing object, 'false' will skip updating object (but
     * will still process sub-documents).
     * @type {Boolean}
     */
    softUpdate: false
};

function addIfExists(toAddTo, propertyToAddTo, toAdd) {
    callIfNotEmpty(toAdd, function() {
        toAddTo[propertyToAddTo] = toAdd;
    });
}

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

function callIfExists(object, fn) {
    if (object != undefined) { // jshint ignore:line
        return fn(object);
    }
}

function callIfNotEmpty(object, fn) {
    callIfExists(object,
        function() {
            if (object !== '') {
                return fn(object);
            }
        });
}

function isStringTruthy(input) {
    var matchingRegex = /^\s*(yes|true)\s*$/i;
    return matchingRegex.test(input);
}

function durationToSeconds(duration) {
    var durationSplit = duration.split(":");
    var durationInSeconds = 0;

    //We only care about at most the first 3 items because that is how iTunes says to do it.
    for (var i = Math.min(durationSplit.length, 3) - 1; i >= 0; i--) {
        var secondsFactor = Math.pow(60, (durationSplit.length - 1) - i);
        durationInSeconds += parseInt(durationSplit[i], 10) * secondsFactor;
    }

    return durationInSeconds;
}

class Scraper {
    options;
    hasRun = false;
    channelImage;
    channel;
    xml;
    channelImageURL: string;

    constructor(options) {
        this.options = _.extend(defaultOptions, options);
    }

    run(xml, callback) {
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
    }

    /**
     * Returns an object with the scraped values of an 'episode' from an item XML tag from a podcast RSS feed
     * @param  element An XML-DOM object corresponding to an 'item' element from an RSS feed
     * @return {Object} An object with the scraped values of the episode in element
     */
    static scrapeEpisode(elementXML) {
        var $element = castAsCheerioXML(elementXML);

        var episode = {
            title: $element('title').text(),
            link: $element('link').text(),
            description: Str($element('description').text()).stripTags().s
        };

        addIfExists(episode, 'pubDate', $element('pubDate').text());
        addIfExists(episode, 'guid', $element('guid').text());

        var explicitString = $element('itunes\\:explicit').text();
        if (explicitString) {
            addIfExists(episode, 'explicit', callIfNotEmpty(explicitString, isStringTruthy));
        }

        addIfExists(episode, 'duration', callIfNotEmpty($element('itunes\\:duration').text(), durationToSeconds));

        return episode;
    }

    static scrapeEpisodes(episodesXML) {
        var seenEpisodeCount = 0,
            episodes = [];

        episodesXML.each(function(i, episodeXML) {
            var episode = new Episode.model(Scraper.scrapeEpisode(episodeXML));
            episodes.push(episode);
            seenEpisodeCount++;
        });

        winston.log('info', 'saw [%d] episodes in feed', seenEpisodeCount);

        return episodes;
    }

    addScrapedEpisodes(episodes, storedEpisodeIDs) {
        var self = this;

        _.each(episodes, function(episode: Episode.IEpisodeModel) {
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
    }

    scrapeChannel(channelXML, callback) {
        var self = this;

        var $channel = castAsCheerioXML(channelXML);
        var newChannel = false;

        Channel.model.findOne({
            title: $channel('channel > title').text()
        }, function elementResult(err, channel) {
            if (!channel) {
                var ChannelModel = Channel.model.bind(Channel);
                channel = new ChannelModel();
                winston.info('Channel: [' + channel.title + '] was not found in the database');
                newChannel = true;
            }

            if (newChannel || self.options.softUpdate) {
                addIfExists(channel, 'title', $channel('channel > title').text());

                var explicitString = $channel('channel > itunes\\:explicit').text();
                addIfExists(channel, 'explicit', callIfExists(explicitString, isStringTruthy));

                addIfExists(channel, 'description', $channel('channel > description').text());
            }

            self.channel = channel;

            self.channel.retrieveEpisodeCustomIDs(
                function(err, storedEpisodes) {
                    if (err) {
                        return callback(err);
                    }

                    var episodes = Scraper.scrapeEpisodes($channel('item'));
                    self.addScrapedEpisodes(episodes, storedEpisodes);

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
    }

    scrapeImage(callback) {
        var self = this;

        var lastImage = self.channel.getLastImage();
        if (!self.options.softUpdate && lastImage && lastImage.originalURL === self.channelImageURL) {
            winston.info("Not updating image for channel [" + self.channel.title + "], already at the latest (soft update is off)");
            return callback(null, self);
        } else {

            //TODO: put this as a static method for PImage
            requestImage(self.channelImageURL,
                function(err, imageResponse ?: Buffer) {
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
    }

    static scrapeImageURL(channelXML) {
        var $channel = castAsCheerioXML(channelXML);

        if ($channel('image').length === 0) {
            return null;
        } else {
            return $channel('image > url').text();
        }
    }
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
                    //TODO(wg): verify if this can be outright removed, it looks like the Channel model already does this with a PImage model
                    //var grid = new (<any> mongodb).Grid(mongoose.connection.db, 'channel_images');
                    return callback(err, body);
                default:
                    return callback(err);
            }
        }
    );
}


export = Scraper;
