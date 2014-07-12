/** @module Channel */

var mongoose = require('mongoose'),
    _ = require('lodash');

var PodcastSource = require('../models/PodcastSource');

var configFromFile = require('./src/config');

if (require.main === module) {
    scraper(configFromFile).main();
}

function scraper(config) {

    var processing = require('./src/processing.js')(createOptions());

    function createOptions() {
        return {
            softUpdate: config.softUpdate
        };
    }

    /**
     * Callback that is run at the end of a series of operations
     * @callback doneCallback
     * @param {Error} err Error encountered during operation, if any
     */

    /**
     * Callback that is run on each item in a list, expected as the second
     * argument of async.each
     * @callback eachCallback
     * @param item item to perform an operation on
     * @param {doneCallback} done callback to call when operations are done, or on error
     */

    function setUp(mongoURL) {
        mongoose.connect(mongoURL);

        mongoose.connection.on('error', function(err) {
            console.error('Could not connect to mongo server!');
            console.error(err);
            throw err;
        });
    }

    function tearDown() {
        process.exit();
    }

    function main() {

        setUp(config.mongoURL);

        var sourcesList = [];

        if (config.getSourcesFromDB) {
            PodcastSource.getFromDatabase(startRunning);
        } else {
            sourcesList = _.map(
                config.XMLSource,
                function(sourceEntry) {
                    var sourceModel = new PodcastSource.model(sourceEntry);
                    if (sourceEntry.saveToDB) {
                        sourceModel.save();
                    }
                    return sourceModel;
                }
            );
            startRunning(null, sourcesList);
        }

        function startRunning(err, sourcesList) {
            if (err) {
                console.error(err);
                throw err;
            }

            if (!sourcesList.length) {
                console.warn("No sources defined, exiting program.");
                return tearDown();
            }

            processing.runOnSource(
                sourcesList,
                /**
                 * Called when each source has completed scraping, or on an error.
                 * @param  {Error} err   Error encountered, if any
                 */
                function mainComplete(err) {
                    if (err) {
                        throw err;
                    } else {
                        tearDown();
                    }
                }
            );
        }
    }

    return {
        setUp: setUp,
        tearDown: tearDown,
        main: main
    };
}
