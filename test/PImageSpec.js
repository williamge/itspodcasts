/*jshint expr: true*/

var expect = require('chai').expect;

var mongoose = require('mongoose'),
    _ = require('lodash'),
    async = require('async');

var testHelpers = require('./testHelpers');

var PImage = require('../models/PImage');

var Channel,
    db;

beforeEach(function(done) {
    mongoose.connection.db.dropDatabase();
    done();
});

after(function(done) {
    mongoose.connection.db.dropDatabase();
    done();
});

describe( 'PImage', function() {
    describe( '#new', function() {
        it( 'should set up a PImage object' ,
            function() {
                var pimage = new PImage.model({
                    originalURL : 'url'
                });
                expect(pimage).to.have.property('originalURL')
                    .equal('url');
            }
        );
    } );
    describe( '#find()', function() {

        describe('should propagate errors', function() {

            if ( testHelpers.mongoTestCommandsEnabled() ) {
                it('database error', function(done) {

                    mongoose.connection.db.admin().command( testHelpers.socketExceptionCommand(1), function(err, commandInfo)  {
                        expect(err.message,
                            'Cannot execute configureFailPoint, set enableTestCommands to 1 in MongoDB'
                        ).to.have.string("connection closed");
                    } );

                    Channel.model.find("title returns error",
                        function(err, data ){
                            expect(err).to.be.ok;
                            done();
                        }
                    );
                });
            } else {
                it('skipped database error check - enableTestCommands not set for MongoDB instance');
            }
        });

        it( 'should return a PImage when it is in the db' ,
            function(done) {
                ( new PImage.model( {originalURL : 'url'}) ).save( function(err, data) {
                    PImage.model.findOne( {originalURL : 'url'}, function( err, data ) {
                        expect(data).to.be.ok;

                        //we should be fine in this case but sometimes this might backfire since instanceOf can bug out if the constructors exist
                        //in different 'realms' (think like having the same object in two different iframes)
                        expect(data).to.be.an.instanceOf(PImage.model);
                        done();
                    } );
                } );
            }
        );
        it( 'should return nothing when it is not in the db' ,
            function(done) {
                PImage.model.findOne( {originalURL : 'no url here'}, function(err, data) {
                    if (err) throw err;
                    expect(data).to.not.be.ok;
                    done();
                } );

            }
        );

    });
    describe( '#save()', function() {


        describe('should propagate errors', function() {
            if ( testHelpers.mongoTestCommandsEnabled() ) {
                it('database error', function(done) {
                    mongoose.connection.db.admin().command( testHelpers.socketExceptionCommand(1), function(err, commandInfo)  {
                        expect(err.message,
                            'Cannot execute configureFailPoint, set enableTestCommands to 1 in MongoDB'
                        ).to.have.string("connection closed");
                    } );

                    ( new PImage.model( { title : "title returns error" } ) ).save(
                        function(err, data ){
                            expect(err).to.be.ok;
                            done();
                        }
                    );
                });
            } else {
                it('skipped database error check - enableTestCommands not set for MongoDB instance');
            }
        });

        it( 'should save a PImage' ,
            function(done) {
                var test_pimage= new PImage.model( {originalURL : 'url'} );
                test_pimage.save( function(err) {
                    PImage.model.findOne( {originalURL : 'url'} , function(err, result) {
                        expect(result).to.be.ok;
                        expect(result).to.have.property('originalURL').equal('url');
                        done();
                    } );
                } );
            }
        );
    });

    describe('#saveImage()', function() {

        var test_pimage,
            image_data = new Buffer('my pretend image data');

        beforeEach(function () {
            test_pimage = new PImage.model({ originalURL: 'url' });
        });

        it('should save an image',
            function (done) {
                test_pimage.saveImage(image_data,
                    function (err, test_pimage) {
                        expect(err).to.not.be.ok;
                        expect(test_pimage).to.have.property('originalURL').equal('url');
                        done();
                    });
            }
        );
    });

    describe('#getImage()', function() {

        var test_pimage,
            image_data = new Buffer('my pretend image data');

        beforeEach(function () {
            test_pimage = new PImage.model({ originalURL: 'url' });
        });

        it('should get an image if one exists in the database',
            function(done) {
                test_pimage.saveImage(image_data,
                    function(err, test_pimage) {
                        expect(err).to.not.be.ok;
                        expect(test_pimage).to.have.property('originalURL').equal('url');
                        PImage.model.getImage(test_pimage._id,
                            function(err, data) {
                                expect(err).to.not.be.ok;
                                expect(data.toString('base64')).to.equal(image_data.toString('base64'));
                                done();
                            }
                        );
                    });
            }
        );
    });

});
