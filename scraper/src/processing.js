/** @module Channel */

var fs = require('fs'),
    path = require('path'),
    async = require('async'),
    request = require('request'),
    winston = require('winston');

var Channel = require('../../models/Channel'),
    Episode = require('../../models/Episode');

module.exports = function(options) {
    options = options || {};
    var scrape = require('./scrape')(Channel, Episode, options);

    /**
     * Saves a {Channel} object and calls the 'done' callback when the Channel object has been saved or there has
     * been an error.
     * @param  {Channel}   channel Channel to be saved
     * @param  {doneCallback} done    Callback to be called when the Channel is saved or on an error
     */
    function saveChannel(channel, done) {
        channel.saveChannelAndEpisodes(function(err) {
            if (err) {
                return done(err);
            }
            winston.info('Saved channel: ' + channel.title);
            winston.info('   Saved added episodes: ' + channel.getAddedEpisodes().length);
            if (options.softUpdate) {
                winston.info('   Saved updated episodes: ' + channel.getUpdatedEpisodes().length);
            } else {
                winston.info('   No updated episodes (reason: soft-update not enabled)');
            }

            return done();
        });
    }

    /**
     * Reads an XML file from disk and passes the contents and 'done' in to callback
     * @param  {string}   fileName Path of the file to be loaded
     * @param  {Function} callback callback to be called on the file being loaded or on error
     * @param  {doneCallback} done     'done' callback that will be passed on to the callback
     */
    function readXMLFile(fileName, callback, done) {
        fs.readFile(
            path.resolve(fileName),
            function(err, fileContents) {
                if (err && err.code == "ENOENT") {
                    return callback(
                        new Error("Aborting scraping source, could not open file: " + fileName),
                        null,
                        done
                    );
                } else {
                    return callback(err, fileContents, done);
                }
            }
        );
    }

    /**
     * Requests an XML feed from through HTTP and passes the contents and the 'done' callback in to callback
     * @param  {string}   feedURL URL of the feed to be retrieved
     * @param  {Function} callback callback to be called on the feed being loaded or on error
     * @param  {doneCallback} done     'done' callback that will be passed on to the callback
     */
    function requestRSS(feedURL, callback, done) {
        request.get(feedURL,
            function(err, response, body) {
                if (err) {
                    return callback(err, null, done);
                }
                switch (response.statusCode) {
                    case 200:
                        return callback(err, body, done);
                    case 404:
                        return callback(
                            new Error("Aborting scraping source, RSS feed could not be found (404): " + feedURL),
                            null,
                            done
                        );
                    default:
                        throw new Error("Unhandled requestRSS statusCode: " + response.statusCode);
                }
            }
        );
    }

    /**
     * Callback to be called when scraping is complete
     * @callback doneCallback
     * @param  {Function} err Error on scraping if there were any
     */
    function scrapingComplete(err) {
        if (err) {
            throw err;
        }
        process.exit();
    }

    /**
     * Scrapes an RSS feed passed in as a string and calls the channelFunction on the
     * scraped channels. After the channelFunction has finished running on all channels
     * the callback is called.
     * @param  {string}   data  XML data in a string to be scraped
     * @param  {eachCallback}   channelFunction callback to be run on each scraped channel
     * @param  {doneCallback} callback        callback to be run after all channelFunction instances have finished running
     */
    function scrapeXML(data, channelFunction, callback) {
        scrape.scrapeSource(data,
            function(err, channelList) {
                async.each(
                    channelList,
                    channelFunction,
                    callback
                );
            }
        );
    }

    /**
     * Function that controls actual operation of scraping, handling errors and delegating scraping tasks.
     * @param  {Error}   err      Error that has been encountered, if any
     * @param  {string}   data     XML data in a string to be scraped
     * @param  {doneCallback} callback callback to be called after scraping is complete
     */
    function scrapeController(err, data, callback) {
        if (err) {
            winston.error(err);
            callback(err);
        } else {
            scrapeXML(data, saveChannel, callback);
        }
    }

    /**
     * Retrieves the given sources and runs #scrapeXML() on each one, finally calling
     * the given callback when the sources have been parsed and saved.
     * @param  {[PodcastSource]}   sources  List of sources to scrape
     * @param  {Function} callback callback to run after given soures have been scraped and saved
     */
    function runOnSource(sources, callback) {
        async.each(
            sources,
            /**
             * Called for each source provided as input to scrape.
             * @param  source   A source object to scrape
             * @param  {doneCallback} done   Callback that is called when scraping is complete, or on an error.
             */
            function mainIterator(source, done) {
                winston.info("Working on source: ", {
                    source: source.source,
                    type: source.type
                });
                switch (source.type) {
                    case "file":
                        readXMLFile(source.source, scrapeController, done);
                        break;
                    case "rss":
                        requestRSS(source.source, scrapeController, done);
                        break;
                    default:
                        throw new Error("Unrecognized input source.");
                }
            },
            callback
        );
    }

    return {
        saveChannel: saveChannel,
        readXMLFile: readXMLFile,
        requestRSS: requestRSS,
        scrapingComplete: scrapingComplete,
        scrapeXML: scrapeXML,
        runOnSource: runOnSource
    };
};
