/*jshint expr: true*/

var expect = require('chai').expect;

var mongoose = require('mongoose'),
    xml2js = require('xml2js');

//var testHelpers = require('./testHelpers');

var main = require('../main'),
    Channel = require('../Channel');
   // Episode = require('../Episode');


module.exports.run = function() {

    beforeEach(function(done) {
        mongoose.connection.db.dropDatabase();
        done();
    });

    after(function(done) {
        mongoose.connection.db.dropDatabase();
        done();
    });

    describe( 'main', function() {
        describe( '#saveChannel and #saveChannelWrapper', function() {
            it( 'should save a channel provided to the database', 
                function(done) {
                    //this doesn't really check the database
                    main.saveChannelWrapper(
                        function() {
                            Channel.model.count(
                                function(err, channelCount){
                                    expect(channelCount).to.equal(1);
                                    done();
                                }
                            );
                        }

                    )(
                        new Channel.model( {
                            title: "test title"
                        })
                    );
                } 
            );
            it( 'should only call the callback when all channels have been saved', 
                function(done) {

                    var verifyAllSaved = 
                        function() {
                            Channel.model.count( 
                                function(err, channelCount) {
                                    expect(channelCount).to.equal(3);
                                    done();
                                }
                            );
                        };

                    var saveChannel = main.saveChannelWrapper( verifyAllSaved );
                    saveChannel( new Channel.model( { title: "test title1" }));
                    saveChannel( new Channel.model( { title: "test title2" }));
                    saveChannel( new Channel.model( { title: "test title3" }));
                } 
            );
            it( 'should allow the callback to handle errors' );
        } );

        function _verifyXMLData(done) {
           return function verifyXMLData (err, XML) {
                xml2js.parseString( XML, function( err, result ) {
                    expect(err).to.not.be.ok;
                    expect(result).to.have.property('rss');
                    done();
                });
            };    
        }

        describe( '#readXMLFile', function() {
            it( 'should scrape an XML file read from disk', 
                function(done) {
                    main.readXMLFile(
                        (require('path')).resolve("test.xml"),
                        function verifyXMLData (err, XML) {
                                console.log(err);
                                        xml2js.parseString( XML, function( err, result ) {
                                            expect(err).to.not.be.ok;
                                            expect(result).to.have.property('rss');
                                            done();
                                        });
                                    }    
                    );
                } 
            );
            it( 'should allow the callback to handle errors' );
        } );
        describe( '#requestRSS', function() {
            it( 'should scrape an XML file requested via http', 
                function(done) {
                    main.requestRSS(
                        "http://feeds.feedburner.com/comedydeathrayradio?format=xml",
                        _verifyXMLData(done)
                    );
                } 
            );
            it( 'should allow the callback to handle errors' );
        } );
        describe( '#saveChannels should return a function that', function() {
            it( 'saves channels when given a list of them', 
                function(done) {
                    main.saveChannels(
                        function() {
                            Channel.model.count( 
                                function(err, channelCount) {
                                    expect(channelCount).to.equal(3);
                                    done();
                                }
                            );
                        }
                    )(
                        null,
                        [
                            new Channel.model( { title: "test title1" }),
                            new Channel.model( { title: "test title1" }),
                            new Channel.model( { title: "test title1" })
                        ]
                    );
                } 
            );
            it( 'should allow the callback to handle errors' );
        } );
    });
};
