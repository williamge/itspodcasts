/*jshint expr: true*/

var expect = require('chai').expect;

var MongoClient = require('mongodb').MongoClient;

var EpisodeFactory = require('../Episode');

var Episode,
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

    describe( 'Episode', function() {
        describe( '#new', function() {
            it( 'should set up an Episode object' );
        } );
        describe( '#find()', function() {

            beforeEach(function() {
                Episode = EpisodeFactory(db);
            });

            it('should retrieve an Episode object when it is in the db', 
                function(done) {
                    Episode.find("in collection",  function( err, data ){
                        expect(data).to.be.ok;
                        console.log("here2");

                        expect(data).to.be.an.instanceOf(Episode);
                        done();
                    });
                }
            );
            it('should retrieve an Episode object', 
                function(){
                    expect(false).to.equal("no unit test defined");
                });
        });

        describe( '#save()', function() {

            beforeEach(function() {
                Episode = EpisodeFactory(db);
            });

            describe('should propagate errors', function() {
                it('not an Episode object', function(done) {
                    Episode.save( [], 
                        function(err, data ){
                            expect(err).to.be.ok;
                            expect(err).to.be.instanceOf(TypeError);
                            done(); 
                        }
                    );
                });
                it('database error', function(done) {
                    Episode.save( new Episode("channel", "title returns error"), 
                        function(err, data ){
                            expect(err).to.be.ok;
                            done(); 
                        }
                    );
                });
            });

            it( 'should save an Episode' , 
                function() {
                    var test_episode = new Episode( 'test episode', 'link', 'description', 'guid' );
                    Episode.save( test_episode );
                    expect(db.collections.episodes.saved.length).to.be.ok;   
                    expect(db.collections.episodes.saved[0]._id).to.equal( test_episode.getID() );    
                }
            );
        });
    });
};
