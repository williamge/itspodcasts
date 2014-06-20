/*jshint expr: true*/

var expect = require('chai').expect;

var MongoClient = require('mongodb').MongoClient;

var testHelpers = require('./testHelpers');

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

    beforeEach(function(done) {
        db.dropDatabase(done);
    });

    after(function(done) {
        db.dropDatabase(done);
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

                    var episode =  new Episode(
                        'channelID',
                        'test title', 
                        'link', 
                        'description', 
                        'guid'  
                    ) ;

                    Episode.save( episode );

                    Episode.find(episode.getID,  function( err, data ){
                        expect(data).to.be.an.instanceOf(Episode);
                        done();
                    });
                }
            );
        });

        describe( '#save()', function() {

            beforeEach(function() {
                Episode = EpisodeFactory(db);
            });

            describe('should propagate errors', function() {
                it('not an Episode object', function(done) {
                    Episode.save( [], 
                        function(err, data ){
                            expect(err).to.be.instanceOf(TypeError);
                            done(); 
                        }
                    );
                });
                it('database error', function(done) {
                    db.admin().command( testHelpers.socketExceptionCommand(2) );

                    Episode.save( new Episode("channel", "title returns error"), 
                        function(err, data ){
                            expect(err).to.be.ok;
                            done(); 
                        }
                    );
                });
            });

            it( 'should save an Episode' , 
                function(done) {
                    var episode =  new Episode(
                        'channelID',
                        'test title', 
                        'link', 
                        'description', 
                        'guid'  
                    ) ;

                    Episode.save( episode );

                    db.collection('episodes').findOne( {_id: episode.getID} , function(err, result) {
                        expect(result).to.be.ok;
                        done();
                    } );
                }
            );
        });
    });
};
