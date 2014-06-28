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


function readXMLFile(fileName, callback) {
    fs.readFile( fileName, callback );
}

function requestRSS(feedURL, callback) {
    request(feedURL,
        function(err, response, body){
            if (!err && response.statusCode == 200) {
                callback(err, body);
            } else if (err) {
                throw err;
            } else {
                throw new Error("who knows what happened here");
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
      console.log('Could not connect to mongo server!');
      console.log(err);
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

