/*jshint expr: true*/

var expect = require('chai').expect;

var Q = require('q');

var xml2js = require('xml2js'),
    parseString = xml2js.parseString;

var mongoose = require('mongoose');

var Channel = require('../Channel'),
    Episode = require('../Episode');

var scrapePackage = require('../scrape');
var scrape = scrapePackage(Channel, Episode);

var test_xml_channel = Q.nfcall( 
    require('fs').readFile,
    __dirname + '/data/test_channel.xml'
);

module.exports.run = function(dbURL) {

    beforeEach(function(done) {
        mongoose.connection.db.dropDatabase(done);
    });

    after(function(done) {
        mongoose.connection.db.dropDatabase(done);
    });

    describe('scrape', function() {

        var xml, xml_channel, xml_episode;

        before( function( done ) {

            test_xml_channel.then( function( xmlFS ) {
              

                xml2js.parseString( xmlFS, function( err, xmlDom ) {

                    if (err) {
                        console.error("Error in parsing XML");
                        console.error( err );
                    } else {
                        try {
                            xml = xmlFS;
                            xml_channel = xmlDom.rss.channel[0];
                            xml_episode = xml_channel.item[0];
                            done();
                        }
                        catch (e) {
                            console.error("Error while accesing XML DOM");
                            console.error( e );
                        }
                    }
                });
            } )
            .catch( function( err ) {
                console.error("Error loading test data from file.");
                console.error(err);
            } );
        } );

        describe( '#scrapeEpisode()', function() {
            it( 'should return an episode object', function() {
                var episode = scrape.scrapeEpisode( xml_episode );
                expect(episode).to.have.property("title");
            });
        });

        describe( '#scrapeChannel()', function() {
            it( 'should return a Channel object', function(done) {
                scrape.scrapeChannel( xml_channel, function(err, channel) {
                    expect(channel).to.have.property("title").equal("test title");
                    done();
                } );
            });
        });

        describe( '#scrapeSource()', function() {
            it( 'should return a list of channels', function( done ) {
                
                scrape.scrapeSource( xml, function(err, channelList) {
                    expect(channelList).to.have.length(1);
                    channelList.forEach( function(element, index, array) {
                        expect(element).to.have.property("title");
                        expect(element).to.be.an.instanceOf(Channel.model);
                    } );
                    done();
                } );
            });
        });
    });
};