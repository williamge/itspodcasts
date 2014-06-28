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
            if (err) {
                callback(err, data, channel);
            }
            saveCount--;
            if ( !(err || saveCount) ) {
                return callback();
            }
        });
    };
}


function readXMLFile(fileName, callback) {
    fs.readFile( fileName, 
        function(err, fileContents) {
            if (err.code == "ENOENT") {
                console.error("Aborting scraping source, could not open file: " + fileName);
            } else {
                return callback(err, fileContents);
            }
        }
    ); 
}

function requestRSS(feedURL, callback) {
    request(feedURL,
        function(err, response, body){
            if (err) {
                throw err;
            }
            switch (response.statusCode) {
                case 200:
                    return callback(err, body);
                case 404:
                    console.error("Aborting scraping source, RSS feed could not be found (404): " + feedURL);
                    break;
                default:
                    throw new Error("Unhandled requestRSS statusCode: " + response.statusCode);
            }
        }
    );
}

function saveChannels(callback) {
    return function(err, channelList){
        channelList.forEach( saveChannelWrapper(callback) );
    };
}

function main(config) {

    var workingSourcesCounter = 0;

    function scrapingComplete (err) {
        workingSourcesCounter--;
        if (!workingSourcesCounter) {
            process.exit();
        }    
    }
    function scrapeXML (err, data) {
        scrape.scrapeSource(data, saveChannels(scrapingComplete) );
    }


    mongoose.connect(config.mongoURL);
    
    mongoose.connection.on('error', function (err) {
      console.error('Could not connect to mongo server!');
      console.error(err);
      throw err;
    });

    config.XMLSource.forEach(
        function(source) {
            workingSourcesCounter++;
            console.log(source);
            switch (source.type) {
                case "file":
                    readXMLFile( source.source, scrapeXML );
                    break;
                case "rss":
                    requestRSS( source.source, scrapeXML );
                    break;
                default:
                    throw new Error("Unrecognized input source.");
            }
        }
    );
}

module.exports = {
    saveChannelWrapper: saveChannelWrapper,
    saveChannels : saveChannels,
    readXMLFile: readXMLFile,
    requestRSS: requestRSS,
    main: main
};

