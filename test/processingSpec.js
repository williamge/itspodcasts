/*jshint expr: true*/

var expect = require('chai').expect;

var mongoose = require('mongoose'),
    xml2js = require('xml2js');

var testHelpers = require('./testHelpers');

var processing = require('../scraper/src/processing');

var Channel = require('../models/Channel');


beforeEach(function(done) {
    mongoose.connection.db.dropDatabase();
    done();
});

after(function(done) {
    mongoose.connection.db.dropDatabase();
    done();
});

describe( 'processing', function() {
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
                processing.readXMLFile(
                    (require('path')).resolve("test/test.xml"),
                    function verifyXMLData (err, XML) {
                        xml2js.parseString( XML, function( err, result ) {
                            expect(err).to.not.be.ok;
                            expect(result).to.have.property('rss');
                            done();
                        });
                    }    
                );
            } 
        );
        it( 'should allow the callback to handle errors', 
            function(done) {
                processing.readXMLFile(
                    (require('path')).resolve("testHOPETHISFILEDOESNTEXIST.xml"),
                    function verifyError(err, XML, doneFlag) {
                        expect(err).to.have.property('message')
                            .that.has.string('could not open file');
                        expect(doneFlag).to.have.string("done");
                        done();
                    },
                    "done" 
                );
            } 
        );
    } );
    describe( '#requestRSS', function() {
        it( 'should scrape an XML file requested via http', 
            function(done) {
                processing.requestRSS(
                    "http://feeds.feedburner.com/comedydeathrayradio?format=xml",
                    _verifyXMLData(done)
                );
            } 
        );
        it( 'should allow the callback to handle errors',
            function(done) {
                processing.requestRSS(
                    "http://google.com/googlepleasedontmakethisapage",
                    function verifyError(err, XML, doneFlag) {
                        expect(err).to.have.property('message')
                            .that.has.string('could not be found');
                        expect(doneFlag).to.have.string("done");
                        done();
                    },
                    "done"
                );
            }  
        );
    } );
    describe( '#saveChannel ', function() {
        it( 'should save a channel when given one', 
            function(done) {
                processing.saveChannel(new Channel.model( { title: "test title1" }),
                    function() {
                        Channel.model.count( 
                            function(err, channelCount) {
                                expect(channelCount).to.equal(1);
                                done();
                            }
                        );
                    }
                );
            } 
        );

        if ( testHelpers.mongoTestCommandsEnabled() ) {
            it( 'should allow the callback to handle errors',
                function(done) {

                    testHelpers.runCommand(
                        mongoose,
                        testHelpers.socketExceptionCommand(1),
                        function(err, commandInfo) {
                            expect(
                                err.message, 
                                'Cannot execute configureFailPoint, set enableTestCommands to 1 in MongoDB'
                            ).to.have.string("connection closed");
                        }
                    );

                    processing.saveChannel(new Channel.model( { title: "test title1" }),
                        function(err) {
                            expect(err).to.be.ok;
                            done();
                        }
                    );
                } 
             );
        } else {
            it('skipped database error check - enableTestCommands not set for MongoDB instance');
        }
    } );
});

