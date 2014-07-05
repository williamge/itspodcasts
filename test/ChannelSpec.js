/*jshint expr: true*/

var expect = require('chai').expect;

var mongoose = require('mongoose'),
    _ = require('lodash');

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
                    expect(data).to.not.be.ok; 
                    expect(err).to.not.be.ok;
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
                expect(test_channel.episodes.length).to.equal(1); 
                expect(test_channel.episodes[0].title).to.equal('title');
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
                expect(testChannel.episodes.length).to.equal(1); 
                expect(testChannel.episodes[0].description).to.equal('updated description');
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

    describe( '#getEpisodes()', function() {
        describe( 'should retrieve', function() {


            beforeEach( function(done) {

                var getEpisodesTestChannel1 = new Channel.model( {
                    title: "test channel"
                } );

                var getEpisodesTestChannel2 = new Channel.model( {
                    title: "test channel2"
                } );


                _.chain(_.range(1, 35)).shuffle().forEach( function(i) {
                    getEpisodesTestChannel1.addEpisode( new Episode.model( {
                        title: i, 
                        link:'link', 
                        description:'description',
                        guid: i,
                        pubDate: i
                    } ) );
                } );

                _.chain(_.range(35, 71)).shuffle().forEach( function(i) {
                    getEpisodesTestChannel2.addEpisode( new Episode.model( {
                        title: i, 
                        link:'link', 
                        description:'description',
                        guid: i,
                        pubDate: i
                    } ) );
                } );

                getEpisodesTestChannel1.save( function(err) {
                    if (err) done(err);
                    getEpisodesTestChannel2.save(done);
                });

            });

            it('with no options set, 50 of all of the episodes in all channels', 
                function(done) {
                    Channel.model.getEpisodes( 
                        {},
                        function(err, episodes) {
                            if (err) return done(err);

                            var titles = _.map(episodes, function(episode) {
                                    return _.parseInt(episode.title) ;
                                });

                            expect(_.range(1,71)).to.include.members(titles);
                            expect(titles).to.be.length(50);
                            done();
                        }
                    );
                }
            );
            
            it('as many of all episodes in all of the channels as the limit option is set to',
                function(done) {
                    Channel.model.getEpisodes( 
                        { limit: 5 },
                        function(err, episodes) {
                            if (err) return done(err);

                            var titles = _.map(episodes, function(episode) {
                                    return _.parseInt(episode.title) ;
                                });

                            expect(_.range(1,71)).to.include.members(titles);
                            expect(titles).to.be.length(5);
                            done();
                        }
                    );
                }
            );

            it('all episodes in all channels sorted by the field defined in the sort option',
                function(done) {
                    Channel.model.getEpisodes( 
                        { 
                            sort: {
                                title: -1
                            } 
                        },
                        function(err, episodes) {
                            if (err) return done(err);

                            expect(
                                _.every(episodes, function(value, index, array) {
                                  // either it is the first element, or otherwise this element should 
                                  // not be smaller than the previous element.
                                  return index === 0 || array[index - 1].title >= value.title;
                                })
                            ).to.be.ok;
                            done();
                        }
                    );
                }
            );

            it('65 of all of the episodes in all of the channels, sorted descending by pubDate, if the proper options are set', 
                function(done) {
                    Channel.model.getEpisodes( 
                        { 
                            limit: 65,
                            sort: {
                                pubDate: -1
                            } 
                        },
                        function(err, episodes) {
                            if (err) return done(err);

                            var titles = _.map(episodes, function(episode) {
                                    return _.parseInt(episode.title) ;
                                });

                            //There are 70 episodes in our test, with dates starting lowest with episode 1 and
                            //reaching the maximum date in episode 70.
                            //Since the sorting is going descending and we're limited to 65 episodes, our result
                            //should be:
                            //  [70, 69, 68, ..., 8, 7, 6]
                            //which is returned by _.range(70, 6-1, -1)
                            expect(_.range(70,5, -1)).to.eql(titles);
                            done();
                        }
                    );
                }
            );
        } );
    } );
});
