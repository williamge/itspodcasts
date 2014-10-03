/*jshint expr: true*/

var expect = require('chai').expect;

var mongoose = require('mongoose'),
    _ = require('lodash');

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

    var testXML = testHelpers.testXML;

    describe( '#scrapeEpisode()', function() {
        it( 'should return an episode object', function() {
            var episode = scrape.scrapeEpisode( testXML.episode );
            expect(episode).to.have.property("title").equal("test episode title 1");
        });
    });

    describe( '#scrapeChannel()', function() {
        it( 'should return a Channel object', function(done) {
            scrape.scrapeChannel( testXML.channel, function(err, channel) {
                expect(channel).to.have.property("title").equal("test channel title");
                done();
            } );
        });
        
        it( 'should return the correct Channel if there are more than one in the database', function(done) {
            (new Channel.model( {title: "not the same title as below, different channel"} )).save(
                function(err, data) {
                    scrape.scrapeChannel( testXML.channel, function(err, channel) {
                        expect(channel).to.have.property("title").equal("test channel title");
                        done();
                    } );
                }
            );
        });

        var updatedXMLChannel;

        before(function(done) {
            updatedXMLChannel = testXML.feed.replace(
                "test episode description 1", 
                "test episode description 1 updated"
            );
            done();
        });

        it( 'should update the Channel and Episodes if the update option is set', function(done) {
            scrape.scrapeChannel( testXML.feed, function(err, channel) {
                expect(channel).to.have.property("title").equal("test channel title");
                channel.saveChannelAndEpisodes(function(err) {
                    if (err) throw err;

                    scrapePackage(Channel, Episode, {softUpdate: true}).scrapeChannel(updatedXMLChannel, function(err, channel) {
                        expect(channel._updatedEpisodes).to.have.property('length').equal(2);
                        var updatedEpisodeDescriptions = _.map(channel.getUpdatedEpisodes(), 'description');
                        expect(updatedEpisodeDescriptions).to.contain("test episode description 1 updated");
                        done();
                    });
                });
            } );
        });
    });

    describe( '#scrapeSource()', function() {
        it( 'should return a list of channels', function( done ) {
            
            scrape.scrapeSource( testXML.feed, function(err, channelList) {
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
