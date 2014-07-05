/** @module scrape */

var xml2js = require('xml2js'),
    async = require('async'),
    parseString = xml2js.parseString,
    _ = require('lodash');

var selectiveLog = require('./logging'),
    logLevel = selectiveLog.logLevels;

module.exports = function(Channel, Episode) {

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

        if (element.pubDate) episode.pubDate = element.pubDate;

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
    function scrapeChannel(channelXML, callingOptions, callback) {
        if (typeof callingOptions === 'function') {
            callback = callingOptions;
            callingOptions = null;
        }

        var options =
            _.extend({
                    /**
                     * Determines whether the function should update the existing value of channel and episode
                     * if they are set. 'true' will update existing object, 'false' will skip updating object (but
                     * will still process sub-documents).
                     * @type {Boolean}
                     */
                    softUpdate: false
                },
                callingOptions
            );

        Channel.model.findOne({
            title: channelXML.title[0]
        }, function elementResult(err, channel) {
            if (!channel) {
                channel = new Channel.model({
                    title: channelXML.title[0]
                });
            }

            var episodes = channelXML.item;

            episodes.forEach(function(episodeXML, index, array) {
                var episode = new Episode.model(scrapeEpisode(episodeXML));

                if (!channel.episodes.id(episode.getID())) {
                    selectiveLog("adding episode to channel", logLevel.informational);
                    channel.addEpisode(
                        episode
                    );
                } else if (options.softUpdate) {
                    selectiveLog("updating existing episode (soft-flush enabled)", logLevel.informational);
                    channel.updateEpisode(episode);
                } else {
                    selectiveLog("episode already in db, not updating (soft-flush not enabled)", logLevel.informational);
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
    function scrapeSource(data, options, callback) {

        if (typeof options === 'function') {
            callback = options;
            options = null;
        }

        var channelList = [];
        var channelScrapers = 0;
        xml2js.parseString(data, function(err, result) {
            if (err) {
                return callback(err);
            } else {
                async.each(
                    result.rss.channel,
                    function eachIterator(channel, done) {
                        scrapeChannel(channel,
                            options,
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
