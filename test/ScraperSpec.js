/*jshint expr: true*/

var expect = require('chai').expect;

var mongoose = require('mongoose'),
    _ = require('lodash');

var testHelpers = require('./testHelpers');

var Channel = require('../models/Channel'),
    Episode = require('../models/Episode'),
    Scraper = require('../scraper/src/Scraper.js');

var testXMLs = testHelpers.testXML,
    scraper;

beforeEach(function(done) {
    mongoose.connection.db.dropDatabase(done);
});

after(function(done) {
    mongoose.connection.db.dropDatabase(done);
});

describe('Scraper (parts testing)', function() {
    describe('channel images', function() {
        it( '#scrapeImageURL should return a the image URL when called', function() {
            expect(Scraper.scrapeImageURL(testXMLs.channel)).to.equal('http://test.com/channelimage.png');
        });
    });
    describe( '#scrapeEpisode()', function() {
        it( 'should return an episode object', function() {
            var episode = Scraper.scrapeEpisode( testXMLs.episode );
            expect(episode).to.have.property("title").equal("test episode title 1");
        });
    });
});

describe('Scraper (whole testing)', function() {

    beforeEach(function(done) {
        scraper = new Scraper();
        scraper.run(testXMLs.feed, function(err, result) {
            scraper = result;
            done();
        });
    });

    describe( 'Scraper', function() {
        it( 'should return a Scraper object when called', function() {
            expect(scraper).to.be.instanceOf(Scraper);
        });

        it( 'should return the channel from a podcast', function() {
            expect(scraper.channel).to.have.property("title").equal('test channel title');
        });

        it( 'should return the episodes from a podcast', function() {
            expect(scraper.channel.episodes).to.have.length(2);
            var episodeDescriptions = _.map(scraper.channel.getAddedEpisodes(), 'description');
            expect(episodeDescriptions).to.contain('test episode description 1');
        });

        it( 'should return the channel image from a podcast if one exists', function() {
            expect(scraper).to.have.property('channelImageURL').equal('http://test.com/channelimage.png');
        });

        it( 'should return falsey if no channel image from a podcast exists', function(done) {
            scraper = new Scraper();
            scraper.run(testXMLs.feedNoImage, function(err, result) {
                scraper = result;
                expect(scraper).to.have.property('channelImageURL').not.be.ok;
                done();
            });
        });

        it( 'should return the correct Channel if there are more than one in the database', function(done) {
            (new Channel.model( {title: "not the same title as below, different channel"} )).save(
                function(err, data) {
                    scraper.scrapeChannel( testXMLs.channel, function(err, result) {
                        expect(scraper.channel).to.have.property("title").equal("test channel title");
                        done();
                    } );
                }
            );
        });

        var updatedXMLChannel;

        before(function(done) {
            updatedXMLChannel = testXMLs.feed.replace(
                "test episode description 1",
                "test episode description 1 updated"
            );
            done();
        });

        it( 'should update the Channel and Episodes if the update option is set', function(done) {
            scraper = new Scraper({softUpdate: true});
            scraper.run( testXMLs.feed, function(err, result) {
                expect(result.channel).to.have.property("title").equal("test channel title");
                result.channel.save(function(err) {
                    if (err) throw err;

                    scraper.run(updatedXMLChannel, function(err, result) {
                        expect(result.channel._updatedEpisodes).to.have.property('length').equal(2);
                        var updatedEpisodeDescriptions = _.map(result.channel.getUpdatedEpisodes(), 'description');
                        expect(updatedEpisodeDescriptions).to.contain("test episode description 1 updated");
                        done();
                    });
                });
            } );
        });

        it( 'should update the Channel and Episodes if the update option is set', function(done) {
            scraper = new Scraper({softUpdate: false});
            scraper.run( testXMLs.feed, function(err, result) {
                expect(result.channel).to.have.property("title").equal("test channel title");
                result.channel.save(function(err) {
                    if (err) throw err;

                    scraper.run(updatedXMLChannel, function(err, result) {
                        expect(result.channel._updatedEpisodes).to.have.property('length').equal(0);
                        var updatedEpisodeDescriptions = _.map(result.channel.getUpdatedEpisodes(), 'description');
                        expect(updatedEpisodeDescriptions).to.not.contain("test episode description 1 updated");
                        done();
                    });
                });
            } );
        });
    });
});
