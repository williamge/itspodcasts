/*jshint expr: true*/

var expect = require('chai').expect;

var xml2js = require('xml2js'),
    parseString = xml2js.parseString,
    fs = require('fs');

var mongoose = require('mongoose');

var Channel = require('../models/Channel'),
    Episode = require('../models/Episode');

var scrapePackage = require('../scraper/src/scrape');
var scrape = scrapePackage(Channel, Episode);

beforeEach(function(done) {
    mongoose.connection.db.dropDatabase(done);
});

after(function(done) {
    mongoose.connection.db.dropDatabase(done);
});

describe('scrape', function() {

    var xml, xml_channel, xml_episode;

    before( function( done ) {

        fs.readFile(__dirname + '/data/simpleXMLFeed.xml', function(err, xmlFS) {
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
        });
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
                expect(channel).to.have.property("title").equal("test channel title");
                done();
            } );
        });
        
        it( 'should return the correct Channel if there are more than one in the database', function(done) {
            (new Channel.model( {title: "not the same title as below, different channel"} )).save(
                function(err, data) {
                    scrape.scrapeChannel( xml_channel, function(err, channel) {
                        expect(channel).to.have.property("title").equal("test channel title");
                        done();
                    } );
                }
            );

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
