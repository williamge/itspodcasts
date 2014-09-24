/*jshint expr: true*/

var expect = require('chai').expect;

var mongoose = require('mongoose'),
    _ = require('lodash');

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

                getEpisodesTestChannel1.saveChannelAndEpisodes( function(err) {
                    if (err) done(err);
                    getEpisodesTestChannel2.saveChannelAndEpisodes(done);
                });

            });

            it('with no options set, 50 of all of the episodes in all channels', 
                function(done) {
                    Episode.model.getEpisodesNow(
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
                    Episode.model.getEpisodesNow(
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
                    Episode.model.getEpisodesNow(
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
                    Episode.model.getEpisodesNow(
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

