var fs = require('fs'),
    xml2js = require('xml2js'),
    parseString = xml2js.parseString,
    MongoClient = require('mongodb').MongoClient;

var config = require('./config'),
    selectiveLog = require('./logging'),
    logLevel = selectiveLog.logLevels;

var ChannelFactory = require('./Channel'),
    EpisodeFactory = require('./Episode'),
    scrapeFactory = require('./scrape');

main();

function main() {
    MongoClient.connect( config.mongoURL, function(err,db) {
        if (err) {
            console.error("Error connecting to database");
            throw err;
        }

        var Channel = ChannelFactory(db);
        var Episode = EpisodeFactory(db);
        var scrape = scrapeFactory(Channel);

        function saveScraping( channel ) {

            selectiveLog("channel ids: " + channel.episodeIDs, 2);
            
            channel.localEpisodes.forEach( function( episode, index, array ) {
                //episodeCallbacks++;
                selectiveLog("saving Episode", logLevel.informational);
                Episode.save(episode, 
                    //don't expect this to be called when no errors, I think the docs are lying to me
                    function(err, data) {
                        if (err) {
                            console.warn(err);
                            throw err;
                        }
                    }
                );

                channel.episodeIDs.push( episode.getID( ) );

                selectiveLog("saving channel", logLevel.informational);
                
                //don't expect this to be called when no errors, I think the docs are lying to me
                return Channel.save(channel, function(err) {
                    if (err) {
                        console.warn(err);
                        throw err;
                    } 
                });
            });
        }

        fs.readFile( __dirname + '/test.xml', function( err, data ) {
            if (err) {
                console.log("oops");
            } else {
                return scrape.scrapeSource(data, 
                    function doneScraping(err, channelList) {
                        if (err) {
                            throw err;
                        }
                        channelList.forEach( saveScraping );
                        process.exit();
                    }
                );
            }
        } );

    } );
}

