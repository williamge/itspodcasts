/*jshint expr: true*/

var expect = require('chai').expect;

var mongoose = require('mongoose'),
    _ = require('lodash'),
    async = require('async');

var testHelpers = require('./testHelpers');

var Channel = require('../models/Channel'),
    Episode = require('../models/Episode');

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

describe( 'Channel', function() {
    describe( '#new', function() {
        it( 'should set up a Channel object' ,
            function() {
                var channel = new Channel.model({
                    title: 'test channel' 
                });
                expect(channel).to.have.property('title')
                    .equal('test channel');
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

        it( 'should return a Channel when it is in the db' , 
            function(done) {
                ( new Channel.model( {title :'test channel'}) ).save( function(err, data) {
                    Channel.model.findOne( { title:'test channel'}, function( err, data ) {
                        expect(data).to.be.ok; 

                        //we should be fine in this case but sometimes this might backfire since instanceOf can bug out if the constructors exist
                        //in different 'realms' (think like having the same object in two different iframes)
                        expect(data).to.be.an.instanceOf(Channel.model);
                        done(); 
                    } );    
                } );
            }
        );
        it( 'should return nothing when it is not in the db' , 
            function(done) {
                Channel.model.findOne( {title : "not in a collection, nope" }, function(err, data) {
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

                    ( new Channel.model( { title : "title returns error" } ) ).save( 
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

        it( 'should save a Channel' , 
            function(done) {
                var test_channel = new Channel.model( {title: 'test channel' } );
                test_channel.save( function(err) {
                    Channel.model.findOne( {title: test_channel.getID()} , function(err, result) {
                        expect(result).to.be.ok;
                        expect(result).to.have.property('title').equal('test channel');
                        done();
                    } );
                } ); 
            }
        );
    });
    describe( '#addEpisode()', function() {

        it( 'should add an episode to the Channel', 
            function() {
                var testChannel = new Channel.model( { title: 'test channel' } );
                var testEpisode =  new Episode.model( {
                    title: 'title', 
                    link:'link', 
                    description:'description',
                    guid: 'guid'
                } ) ;
                testChannel.addEpisode(testEpisode);
                expect(testChannel).to.have.property('episodes').length(1); 
                expect(testChannel.episodes.indexOf( testEpisode.getID() )).to.equal(0);
            }
        );

        it( 'should throw an error if a non-episode object is passed', 
            function() {
                expect(
                    function addNonEpisode() {
                        var test_channel = new Channel.model( { title: 'test channel' } );
                        test_channel.addEpisode(  {
                            title: 'title', 
                            link:'link', 
                            description:'description',
                            guid: 'guid'
                        } );
                    }
                ).to.throw(TypeError);
            }
        );
    });

    describe( '#updateEpisode()', function() {

        var testChannel;

        beforeEach( function() {
                testChannel = new Channel.model( { title: 'test channel' } );
                testChannel.addEpisode( new Episode.model( {
                    title: 'title', 
                    link:'link', 
                    description:'description',
                    guid: 'guid'
                } ) );
        });

        it( 'should update an existing episode in the Channel', 
            function() {
                testChannel.updateEpisode( new Episode.model( {
                    title: 'title', 
                    link:'link', 
                    description:'updated description',
                    guid: 'guid'
                } ) );

                var updatedEpisodes = testChannel.getUpdatedEpisodes();
                expect(updatedEpisodes).to.have.length(1);
                expect(updatedEpisodes[0]).to.have.property('description').equal('updated description');
            }
        );

        it( 'should update an existing episode in the Channel in the database', 
            function(done) {
                async.series(
                    [
                        function(next) {
                            testChannel.saveChannelAndEpisodes(next);
                        },                       
                        function(next) {
                            testChannel.updateEpisode( new Episode.model( {
                                title: 'title', 
                                link:'link', 
                                description:'updated description',
                                guid: 'guid'
                            } ) );
                            next();
                        },
                        function(next) {
                            testChannel.saveChannelAndEpisodes(next);
                        },
                        function(next) {
                            Episode.model.findOne( {title: 'title'}, 
                                function(err, result) {
                                    if (err) throw err;
                                    expect(result).to.be.ok;
                                    
                                    expect(result).to.have.property('description').equal('updated description');
                                    next(err);
                                }  
                            );
                        }
                    ],
                    function(err) {
                        if (err) throw err;
                        done();
                    }
                );
            }
        );

        it( 'should throw an error if a non-episode object is passed', 
            function() {
                expect(
                    function addNonEpisode() {
                        var testChannel = new Channel.model( { title: 'test channel' } );
                        testChannel.updateEpisode(  {
                            title: 'title', 
                            link:'link', 
                            description:'updated description',
                            guid: 'guid'
                        } );
                    }
                ).to.throw(TypeError);
            }
        );
    });
});
