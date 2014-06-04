/*jshint expr: true*/

var expect = require('chai').expect;

var mockgodb = require('./mocks/mongodb.js');

var EpisodeFactory = require('../Episode');

var db, 
    Episode;


module.exports.run = function() {
    describe( 'Episode', function() {
        describe( '#new', function() {
            it( 'should set up an Episode object' );
        } );
        describe( '#find()', function() {
            it('should retrieve an Episode object');
        });

        describe( '#save()', function() {

            beforeEach(function() {
                db = new mockgodb();
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
