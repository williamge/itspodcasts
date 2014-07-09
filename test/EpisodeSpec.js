/*jshint expr: true*/

var expect = require('chai').expect;

var mongoose = require('mongoose');

var testHelpers = require('./testHelpers');

var Episode = require('../models/Episode'),
    Channel = require('../models/Channel');


beforeEach(function(done) {
    mongoose.connection.db.dropDatabase(done);
});

after(function(done) {
    mongoose.connection.db.dropDatabase(done);
});

describe( 'Episode', function() {

    var testChannel;

    before(function(done) {
        testChannel = new Channel.model( { title : "test channel title" } );
        testChannel.save(done);
    });

    describe( '#new', function() {
        it( 'should set up an Episode object' , 
            function() {
                var episode = new Episode.model({
                    title : 'test title', 
                    link : 'link',
                    description : 'description',
                    guid : 'guid',
                    channel: testChannel._id
                });
                expect(episode).to.have.property('title').equal('test title');
            }
        );
    } );
    describe( '#find()', function() {

        it('should retrieve an Episode object when it is in the db', 
            function(done) {

                var episode =  new Episode.model({
                    title : 'test title', 
                    link : 'link',
                    description : 'description',
                    guid : 'guid',
                    channel: testChannel._id
                } );

                episode.save( function(err) {
                    if (err) throw err;
                    Episode.model.findOne(episode.getID(),  
                        function( err, data ){
                            if (err) throw err;

                            expect(data).to.be.an.instanceOf(Episode.model);
                            done();
                        }
                    );
                } );
            }
        );

        describe('should propagate errors', function() {
            if ( testHelpers.mongoTestCommandsEnabled() ) {
                it('database error', function(done) {
                    mongoose.connection.db.admin().command( testHelpers.socketExceptionCommand(1), function(err, commandInfo)  {
                        expect(err.message, 
                            'Cannot execute configureFailPoint, set enableTestCommands to 1 in MongoDB'
                            ).to.have.string("connection closed");
                    } );
                    
                    Episode.model.find( { _id :'anything' },  function( err, data ){
                        expect(err).to.be.ok;
                        done();
                    });
                });
            } else {
                it('skipped database error check - enableTestCommands not set for MongoDB instance');
            }
        });

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

                    ( new Episode.model({
                        title: "title returns error",
                        guid: "guid",
                        channel: testChannel._id
                    }))
                    .save( 
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

        it( 'should save an Episode' , 
            function(done) {
                var episode =  new Episode.model({
                    title : 'test title', 
                    link : 'link',
                    description : 'description',
                    guid : 'guid',
                    channel: testChannel._id
                } );

                episode.save( function(err) {
                    Episode.model.findOne( {_id: episode.getID()} , function(err, result) {
                        expect(result).to.have.property('title').equal('test title');
                        done();
                    } );
                } );
            }
        );
    });
});

