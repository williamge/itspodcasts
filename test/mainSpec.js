/*jshint expr: true*/

var expect = require('chai').expect;

var mongoose = require('mongoose'),
    xml2js = require('xml2js');

var testHelpers = require('./testHelpers');

var main = require('../src/main'),
    Channel = require('../src/Channel');


beforeEach(function(done) {
    mongoose.connection.db.dropDatabase();
    done();
});

after(function(done) {
    mongoose.connection.db.dropDatabase();
    done();
});

describe( 'main', function() {
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
                main.readXMLFile(
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
                main.requestRSS(
                    "http://feeds.feedburner.com/comedydeathrayradio?format=xml",
                    _verifyXMLData(done)
                );
            } 
        );
        it( 'should allow the callback to handle errors',
            function(done) {
                main.requestRSS(
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
                main.saveChannel(new Channel.model( { title: "test title1" }),
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

                main.saveChannel(new Channel.model( { title: "test title1" }),
                    function(err) {
                        expect(err).to.be.ok;
                        done();
                    }
                );
            } 
         );
    } );
});

