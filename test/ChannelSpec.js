/*jshint expr: true*/

var expect = require('chai').expect;

var MongoClient = require('mongodb').MongoClient;

var ChannelFactory = require('../Channel'),
    EpisodeFactory = require('../Episode');

var Channel,
    db;


module.exports.run = function(dbURL) {

    before(function(done) {
        MongoClient.connect( dbURL, function(err, connectedDb) {
            if (err) {
                throw err;
            }
            db = connectedDb;
            done();
        } );
    });

    describe( 'Channel', function() {
        describe( '#new', function() {
            it( 'should set up a Channel object' );
        } );
        describe( '#find()', function() {

            beforeEach(function() {
                //db = new mockgodb();
                Channel = ChannelFactory(db);
            });

            describe('should propagate errors', function() {
                
                it('title undefined', function(done) {
                    Channel.find(undefined, 
                        function(err, data ){
                            expect(err).to.be.ok;
                            expect(err).to.be.instanceOf(TypeError);
                            done(); 
                        }
                    );
                });
                it('database error', function(done) {
                    Channel.find("title returns error", 
                        function(err, data ){
                            expect(err).to.be.ok;
                            done(); 
                        }
                    );
                });
            });

            it( 'should return a Channel when it is in the db' , 
                function(done) {
                    Channel.find( "in collection", function( err, data ) {
                        expect(data).to.be.ok; 

                        //we should be fine in this case but sometimes this might backfire since instanceOf can bug out if the constructors exist
                        //in different 'realms' (think like having the same object in two different iframes)
                        expect(data).to.be.an.instanceOf(Channel);
                        done(); 
                    } );                 
                }
            );
            it( 'should return nothing when it is not in the db' , 
                function(done) {
                    Channel.find( "not in a collection, nope", function(err, data) {
                        expect(data).to.not.be.ok; 
                        done(); 
                    } );
                                  
                }
            );

        });
        describe( '#save()', function() {

            beforeEach(function() {
                //db = new mockgodb();
                Channel = ChannelFactory(db);
            });

            describe('should propagate errors', function() {
                it('not a Channel object', function(done) {
                    Channel.save( [], 
                        function(err, data ){
                            expect(err).to.be.ok;
                            expect(err).to.be.instanceOf(TypeError);
                            done(); 
                        }
                    );
                });
                it('database error', function(done) {
                    Channel.save( new Channel("title returns error"), 
                        function(err, data ){
                            expect(err).to.be.ok;
                            done(); 
                        }
                    );
                });
            });

            it( 'should save a Channel' , 
                function() {
                    var test_channel = new Channel( 'test channel' );
                    Channel.save( test_channel );
                    expect(db.collections.channels.saved.length).to.be.ok;   
                    expect(db.collections.channels.saved[0]._id).to.equal( test_channel.getID() );    
                }
            );
        });
        describe( '#addEpisode()', function() {

            beforeEach(function() {
                //db = new mockgodb();
                Channel = ChannelFactory(db);
                Episode = EpisodeFactory(db);
            });

            it( 'should add an episode to the Channel', 
                function() {
                    var test_channel = new Channel( 'test channel' );
                    test_channel.addEpisode( new Episode('channelID', 'title', 'link', 'description', 'guid') );
                    expect(test_channel.localEpisodes.length).to.be.ok; 
                    expect(test_channel.localEpisodes[0].title).to.equal('title');
                }
            );
        });
    });
};
