/** @module Channel */

var fs = require('fs'),
    async = require('async'),
    request = require('request'),
    xml2js = require('xml2js'),
    parseString = xml2js.parseString,
    mongoose = require('mongoose');

var configFromFile = require('./src/config'),
    selectiveLog = require('./src/logging'),
    logLevel = selectiveLog.logLevels;

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

        if (!config.XMLSource.length) {
            console.warn("No sources defined, exiting program.");
        } else {
            setUp(config.mongoURL);
            processing.runOnSource(
                config.XMLSource,
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
