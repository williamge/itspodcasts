var fs = require('fs'),
    async = require('async'),
    request = require('request'),
    xml2js = require('xml2js'),
    parseString = xml2js.parseString,
    mongoose = require('mongoose');

var configFromFile = require('./config'),
    selectiveLog = require('./logging'),
    logLevel = selectiveLog.logLevels;

var Channel = require('./Channel'),
    Episode = require('./Episode'),
    scrape = require('./scrape')(Channel, Episode);

if (require.main === module) {
    main(configFromFile);
}

function saveChannel( channel, done ) {
    channel.save(function(err, data) {
        if (err) {
            return done(err);
        }
        return done();
    });
}

function readXMLFile(fileName, callback, done) {
    fs.readFile( fileName, 
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

function requestRSS(feedURL, callback, done) {
    request(feedURL,
        function(err, response, body){
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

function scrapingComplete (err) {
    if (err) throw err;
    process.exit(); 
}

function scrapeXML (data, callback) {
    scrape.scrapeSource(data, 
        function(err, channelList) {
            async.each(
                channelList,
                saveChannel,
                callback
            );
        }
    );
}

function scrapeController(err, data, callback) {
    if (err) {
        console.error(err);
    } else {
        scrapeXML(data, callback);
    }
}

function main(config) {

    mongoose.connect(config.mongoURL);
    
    mongoose.connection.on('error', function (err) {
      console.error('Could not connect to mongo server!');
      console.error(err);
      throw err;
    });
    async.each(
        config.XMLSource,
        function mainIterator (source, done) {
            console.log(source);
            switch (source.type) {
                case "file":
                    readXMLFile( source.source, scrapeController, done );
                    break;
                case "rss":
                    requestRSS( source.source, scrapeController, done );
                    break;
                default:
                    throw new Error("Unrecognized input source.");
            }
        },
        function mainComplete(err){
            if (err) {
                throw err;
            } else {
                scrapingComplete();
            }
        }
    );
}

module.exports = {
    saveChannel: saveChannel,
    readXMLFile: readXMLFile,
    requestRSS: requestRSS,
    scrapingComplete: scrapingComplete,
    scrapeXML: scrapeXML,
    main: main
};

