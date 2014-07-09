/** @module Channel */

var mongoose = require('mongoose'),
    _ = require('lodash'),
    async = require('async'),
    assert = require('assert');

var Episode = require('./Episode');

var ChannelSchema = mongoose.Schema( {
    title: { type: String, required: true },
    episodes: [ { type: String, ref: 'Episode' } ]
});

/**
 * Returns a unique identifier for the current Channel
 * @return {String} Unique ID for the Channel
 */
ChannelSchema.methods.getID = function() {
    return this.title;
};

ChannelSchema.methods.getUpdatedEpisodes = function() {
    return this._updatedEpisodes || [];
};

ChannelSchema.methods.getAddedEpisodes = function() {
    return this._addedEpisodes || [];
};

/**
 * Adds an Episode to the list of Episode objects for the current Channel. Also keeps track of the Episode objects added to the Channel since being 
 * created or retrieved, whichever action happened last.
 * @param {Episode} episode Episode to be added to the current Channel
 */
ChannelSchema.methods.addEpisode = function(episode) {
    if (!(episode instanceof Episode.model)) {
        throw new TypeError("Passed episode not of type Episode");
    }

    //getID also sets the _id for the episode, which is needed to be able
    //to search episodes by id if you don't save before searching.
    //TODO: do something about this call to make it not look so odd
    episode.getID();
    this.episodes.push(episode);

    this._addedEpisodes = this._addedEpisodes || [];
    this._addedEpisodes.push(episode);
};

ChannelSchema.methods.updateEpisode = function(episode) {
    if (!(episode instanceof Episode.model)) {
        throw new TypeError("Passed episode not of type Episode");
    }

    if ( ! this.containsEpisode( episode.getID() ) ) {
        throw new Error("Passed episode not already in channel");
    }

    this._updatedEpisodes = this._updatedEpisodes || [];
    this._updatedEpisodes.push(episode);
};

ChannelSchema.methods.containsEpisode = function(id) {
    return this.episodes.indexOf( id ) > -1;
};

ChannelSchema.methods.saveChannelAndEpisodes = function(callback) {
    
    //This would be a nice place to use a bulk insert operation, mongoose doesn't have that though

    function channelDetails(channel) {
        return {
            channel: channel._id,
            channelTitle: channel.title
        };
    }

    var channel = this;

    this.save(function(err, savedChannel) {

        if (err) return callback(err);

        async.parallel(
            [
                function saveAddedEpisodes(done) {
                    async.each(
                        channel._addedEpisodes || [],
                        function saveEpisode(episode, next) {
                            _.extend( episode, channelDetails(savedChannel) );

                            episode.save(next);
                        },
                        function doneSaving(err) {
                            done(err);
                        }
                    );
                },
                function saveUpdatedEpisodes(done) {
                    async.each(
                        channel._updatedEpisodes || [],
                        function updateEpisode(episode, next) {
                            Episode.model.findOne( {_id : episode.getID() } )
                                .exec(
                                    function(err, episodeFromDB) {
                                        if (err) return next(err);
                                        assert( !channel.isNew );

                                        var updatedEpisode = _.extend(episodeFromDB, episode._doc );
                                        updatedEpisode.save(next);
                                    }
                                );
                        },
                        function doneUpdating(err) {
                            done(err);
                        }
                    );
                }
            ],
            function done(err) {
                callback(err);
            }
        );
    });
};

ChannelSchema.statics.getEpisodes = function(callingOptions, callback) {

    if ('function' === typeof callingOptions) {
        callback = callingOptions;
        callingOptions = null;
    }

    var defaultOptions = {
        limit: 50
    };

    var options = _.extend(defaultOptions, callingOptions);

    var aggregate = Episode.model.find();

    if (options.sort) {
        aggregate = aggregate.sort(
            options.sort
        );
    }

    if ( typeof options.limit !== 'undefined' ) {
        aggregate = aggregate.limit( options.limit );
    }

    aggregate.exec(callback);
};

var Channel = mongoose.model('Channel', ChannelSchema);

module.exports = {
    schema: ChannelSchema,
    model: Channel
};