/** @module Channel */

var mongoose = require('mongoose'),
    _ = require('lodash'),
    winston = require('winston');

var PodcastSource = require('../models/PodcastSource');

var configFromFile = require('./src/config');

if (require.main === module) {
    scraper(configFromFile).main();
}

function scraper(config) {

    var processing = require('./src/processing.js')(createOptions(config));

    /**
     * Creates an object with options for the processing module.
     * @param  {Object} config source of options to construct new options from
     * @return {Object}        object with options ready for consumption by the processing module
     */
    function createOptions(config) {
        var returnOptions = {
            softUpdate: config.softUpdate
        };
        winston.log('debug', 'Config in scraper/index.js', returnOptions);
        return returnOptions;
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


    /**
     * Sets up required state for running application:
     *     - Connects mongoose to database
     * @param {String} mongoURL URI to MongoDB database(s) to connect to
     */
    function setUp(mongoURL) {
        mongoose.connect(mongoURL);

        mongoose.connection.on('error', function(err) {
            winston.error('Could not connect to mongo server!', err);
            throw err;
        });
    }

    /**
     * Tears down the state of the application and exits the process.
     */
    function tearDown() {
        winston.info('Exiting gracefully');
        process.exit();
    }

    /**
     * Does everything. Gets the sources, runs setUp for the application,
     * retrieves the sources, and runs the processing. Mostly just a function to glue
     * together the processing operations inside an application.
     */
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
                        sourceModel.save(
                            function(err) {
                                //intentionally not using a callback from here, 
                                //we only care enough about the write to log an error
                                if (err) {
                                    winston.error('Error saving source to database. [' + sourceEntry.source + ']', err);
                                }
                            }
                        );
                        winston.info('Saving source to database: ' + sourceEntry.source);
                    }
                    return sourceModel;
                }
            );
            startRunning(null, sourcesList);
        }

        function startRunning(err, sourcesList) {
            if (err) {
                winston.error(err);
                throw err;
            }

            if (!sourcesList.length) {
                winston.warn("No sources defined, exiting program." + "\n" +
                    config.cmdline_help_text);
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
