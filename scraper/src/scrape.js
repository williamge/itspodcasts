/** @module scrape */

var xml2js = require('xml2js'),
    async = require('async'),
    _ = require('lodash'),
    winston = require('winston');

var selectiveLog = require('./logging'),
    logLevel = selectiveLog.logLevels;

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
        var episode = {
            title: element.title[0],
            link: element.link[0],
            description: (element.description[0]._ || element.description[0])
        };

        if (element.pubDate) {
            episode.pubDate = element.pubDate;
        }

        if (element.guid) {
            episode.guid = element.guid[0]._ || element.guid[0];
        }

        return episode;
    }

    /**
     * Scrapes a Channel object and passes it in to callback
     * @param  element XML-DOM object corresponding to a 'channel' element from an RSS feed
     * @param  {scrapedChannelCallback} callback Called after element is turned in to a Channel or with an error
     */
    function scrapeChannel(channelXML, callback) {

        Channel.model.findOne({
            title: channelXML.title[0]
        }, function elementResult(err, channel) {
            if (!channel) {
                channel = new Channel.model({
                    title: channelXML.title[0]
                });
                winston.info('Channel: [' + channel.title + '] was not found in the database');
            }

            var episodes = channelXML.item;

            episodes.forEach(function(episodeXML) {
                var episode = new Episode.model(scrapeEpisode(episodeXML));
                if (!channel.containsEpisode(episode.getID())) {
                    winston.log('info', 'adding episode to channel');
                    channel.addEpisode(
                        episode
                    );
                } else if (options.softUpdate) {
                    winston.log('info', 'updating existing episode (soft-update enabled)');
                    channel.updateEpisode(episode);
                } else {
                    winston.log('info', 'episode already in db, not updating (soft-update not enabled)');
                }
            });

            return callback(err, channel);
        });
    }

    /**
     * Scrapes an RSS XML document and passes a list of scraped Channels to a callback or any errors
     * @param  element XML-DOM object corresponding to a 'channel' element from an RSS feed
     * @param  {scrapedSourceCallback} callback Called after a source is scraped and a list of Channel objects is populated
     */
    function scrapeSource(data, callback) {

        var channelList = [];
        xml2js.parseString(data, function(err, result) {
            if (err) {
                return callback(err);
            } else {
                async.each(
                    result.rss.channel,
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
        });
    }

    return {
        scrapeEpisode: scrapeEpisode,
        scrapeChannel: scrapeChannel,
        scrapeSource: scrapeSource
    };
};
