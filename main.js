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


function doneScraping(err, channelList, callback) {
    if (err) {
        throw err;
    }
    channelList.forEach( saveChannelWrapper(callback) );
}

function main() {

    mongoose.connect(config.mongoURL);
    
    mongoose.connection.on('error', function (err) {
      console.log('Could not connect to mongo server!');
      console.log(err);
      throw err;
    });

    fs.readFile( __dirname + '/test.xml', function( err, data ) {
        if (err) {
            console.log("oops");
        } else {
            return scrape.scrapeSource(data, 
                function mainDoneScrapingWrapper(err, data) {
                    doneScraping(err, data, function doneSaving() {
                        process.exit();
                    });
                }
            );
        }
    } );
}

