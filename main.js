var fs = require('fs'),
    xml2js = require('xml2js'),
    parseString = xml2js.parseString,
    mongoose = require('mongoose');

var config = require('./config'),
    selectiveLog = require('./logging'),
    logLevel = selectiveLog.logLevels;

var Channel = require('./Channel'),
    Episode = require('./Episode'),
    scrape = require('./scrape')(Channel, Episode);

if (require.main === module) {
    main();
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


function doneScrapingSource(err, channelList, callback) {
    if (err) {
        throw err;
    }
    var saveChannelInstance = saveChannelWrapper(callback);
    channelList.forEach( saveChannelInstance );
}

function scrapeXML( err, data, callback ){
    if (err) {
        console.log("oops");
    } else {
        return scrape.scrapeSource(data, 
            function mainDoneScrapingWrapper(err, data) {
                doneScrapingSource(err, data, 
                    function doneSaving() {
                        return callback();
                    }
                );
            }
        );
    }
}

function requestRSS(feedURL, callback) {
    var request = require('request');
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

function doneScrapingAll (err, data) {
    process.exit();
}

function main() {

    mongoose.connect(config.mongoURL);
    
    mongoose.connection.on('error', function (err) {
      console.log('Could not connect to mongo server!');
      console.log(err);
      throw err;
    });

    //working on one source at a time in the prototype stage, 
    //throw this in to a foreach loop when we're past prototyping
    var prototypeXMLSource = config.XMLSource[0];

    if (prototypeXMLSource.type == "file") {
        fs.readFile( __dirname + '/test.xml', 
            function( err, data ) {
                scrapeXML(err, data, 
                    doneScrapingAll
                );
            }
        );
    } else if (prototypeXMLSource.type == "rss") {
        requestRSS(prototypeXMLSource.source,  
                    doneScrapingAll
            );
    } else {
        throw new Error("Unrecognized input source.");
    }
}

