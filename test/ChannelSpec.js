/*jshint expr: true*/

var expect = require('chai').expect;

var mongoose = require('mongoose');

var testHelpers = require('./testHelpers');

var Channel = require('../Channel'),
    Episode = require('../Episode');

var Channel,
    db;


module.exports.run = function() {

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
                        expect(data).to.not.be.ok; 
                        expect(err).to.not.be.ok;
                        done(); 
                    } );
                                  
                }
            );

        });
        describe( '#save()', function() {


            describe('should propagate errors', function() {
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
            });

            it( 'should save a Channel' , 
                function(done) {
                    var test_channel = new Channel.model( {title: 'test channel' } );
                    test_channel.save( function(err) {
                        Channel.model.findOne( {title: test_channel.getID()} , function(err, result) {
                            expect(result).to.be.ok;
                            done();
                        } );
                    } ); 
                }
            );
        });
        describe( '#addEpisode()', function() {

            it( 'should add an episode to the Channel', 
                function() {
                    var test_channel = new Channel.model( { title: 'test channel' } );
                    test_channel.addEpisode( new Episode.model( {
                        title: 'title', 
                        link:'link', 
                        description:'description',
                        guid: 'guid'
                    } ) );
                    expect(test_channel.episodes.length).to.be.ok; 
                    expect(test_channel.episodes[0].title).to.equal('title');
                }
            );
        });
    });
};
