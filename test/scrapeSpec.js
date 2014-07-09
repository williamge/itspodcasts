/*jshint expr: true*/

var expect = require('chai').expect;

var xml2js = require('xml2js'),
    parseString = xml2js.parseString,
    fs = require('fs'),
    mongoose = require('mongoose');

var testHelpers = require('./testHelpers');

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

    var xmlAsString, xml, xml_channel, xml_episode;

    before( function( done ) {
        testHelpers.loadXML( 
            __dirname + '/data/simpleXMLFeed.xml', 
            function(err, data) {
                expect(err).to.not.be.ok;
                xmlAsString = data.xmlAsString,
                xml = data.xml;
                xml_channel = data.xmlChannel;
                xml_episode = data.xmlEpisode;
                done();
            }
        );
    } );

    describe( '#scrapeEpisode()', function() {
        it( 'should return an episode object', function() {
            var episode = scrape.scrapeEpisode( xml_episode );
            expect(episode).to.have.property("title").equal("test episode title 1");
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

        var updatedXMLAsStrin, updatedXMLChannel;

        before(function(done) {
            updatedXMLAsString = xml.replace(
                "test episode description 1", 
                "test episode description 1 updated"
            );

            testHelpers.parseXML(updatedXMLAsString, 
                function(err, data) {
                    if (err) throw err;

                    updatedXMLChannel = data.xmlChannel;
                    done();
                });
        });

        it( 'should update the Channel and Episodes if the update option is set', function(done) {
            scrape.scrapeChannel( xml_channel, function(err, channel) {
                expect(channel).to.have.property("title").equal("test channel title");
                channel.save(function(err) {
                    if (err) throw err;

                    scrapePackage(Channel, Episode, {softUpdate: true}).scrapeChannel(updatedXMLChannel, function(err, channel) {
                        expect(channel.getUpdatedEpisodes()[0]).to.have.property("description").equal("test episode description 1 updated");
                        done();
                    });
                });
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
