var fs = require('fs'),
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

function saveChannelWrapper(callback) {
    var saveCount = 0;
    return function saveChannel( channel ) {
        saveCount++;
        channel.save(function(err, data) {
            if (err) throw err;
            saveCount--;
            if (!saveCount) {
                return callback();
            }
        });
    };
}


function finishScrapingSource(err, channelList, callback) {
    if (err) {
        throw err;
    }
    var saveChannel = saveChannelWrapper(callback);
    channelList.forEach( saveChannel );
}

function scrapeXML( err, data, callback ){
    if (err) {
        console.log("oops");
    } else {
        return scrape.scrapeSource(data, 
            function mainDoneScrapingWrapper(err, data) {
                finishScrapingSource(err, data, 
                    function doneSaving() {
                        return callback();
                    }
                );
            }
        );
    }
}

function readXMLFile(fileName, callback) {
    fs.readFile( fileName, 
        function( err, data ) {
            scrapeXML(err, data, 
               callback
            );
        }
    );
}

function requestRSS(feedURL, callback) {
    request(feedURL,
        function(err, response, body){
            if (!err && response.statusCode == 200) {
                scrapeXML(err, body, callback);
            } else if (err) {
                throw err;
            } else {
                throw new Error("who knows what happened here");
            }
        }
    );
}

function scrapingComplete (err) {
    process.exit();
}

function main(config) {

    mongoose.connect(config.mongoURL);
    
    mongoose.connection.on('error', function (err) {
      console.log('Could not connect to mongo server!');
      console.log(err);
      throw err;
    });

    config.XMLSource.forEach(
        function(source) {
            switch (source.type) {
                case "file":
                    readXMLFile( source.source, scrapingComplete );
                    break;
                case "rss":
                    requestRSS( source.source, scrapingComplete );
                    break;
                default:
                    throw new Error("Unrecognized input source.");
            }
        }
    );
}

