/** @module Channel */

var mongoose = require('mongoose'),
    _ = require('lodash'),
    async = require('async'),
    assert = require('assert');

var Episode = require('./Episode'),
    PImage = require('./PImage');

var ChannelSchema = mongoose.Schema( {
    title: { type: String, required: true },
    episodes: [ { type: String, ref: 'Episode' } ],
    images: [PImage.schema]
});

/**
 * Returns a unique identifier for the current Channel
 * @return {String} Unique ID for the Channel
 */
ChannelSchema.methods.getID = function() {
    return this.title;
};

/**
 * Returns a list of episodes that have been updated during this model's
 * lifetime.
 * @return {Array} List of updated Episode models
 */
ChannelSchema.methods.getUpdatedEpisodes = function() {
    return this._updatedEpisodes || [];
};

/**
 * Returns a list of episodes that have been added during this model's lifetime.
 * @return {Array} List of added Episode models
 */
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

/**
 * Updates an Episode for the current channel and keeps track of the updated Episodes
 * @param  {Episode} episode Episode to be updated for the current Channel
 */
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

/**
 * Returns whether this channel has an episode with the given id
 * @param  {String} id id to look up an episode in this channel
 * @return {Boolean}    True when this channel has that episode id
 */
ChannelSchema.methods.containsEpisode = function(id) {
    return this.episodes.indexOf( id ) > -1;
};

/**
 * Saves the channel and it's episodes (added and updated) to the database.
 * @param  {Function} callback callback to be called on error or when the channel and episodes have been saved
 */
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

        if (err) {
            return callback(err);
        }

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
                                        if (err) {
                                            return next(err);
                                        }
                                        if (!episodeFromDB) {
                                            return next(new ReferenceError("Episode[" + episode.getID() + "] was not found in the database"));
                                        }
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

ChannelSchema.methods.getLastImage = function() {
    if (this.images.length > 0) {
        return this.images[this.images.length-1];
    } else {
        return null;
    }
};

var Channel = mongoose.model('Channel', ChannelSchema);

module.exports = {
    schema: ChannelSchema,
    model: Channel
};