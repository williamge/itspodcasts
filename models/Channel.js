/** @module Channel */

var mongoose = require('mongoose'),
    _ = require('lodash'),
    async = require('async'),
    assert = require('assert');

var Episode = require('./Episode'),
    PImage = require('./PImage');

var ChannelSchema = mongoose.Schema( {
    title: { type: String, required: true },
    /* TODO: rename this to episodeRefs or something along those lines, these aren't
     * really episodes, just a reference to their index */
    episodes: [ { type: String, ref: 'Episode' } ],
    images: [PImage.schema]
});

ChannelSchema.post('init', function (doc) {
        doc._updatedEpisodes = doc._updatedEpisodes || [];
        doc._addedEpisodes = doc._addedEpisodes || [];
});

ChannelSchema.pre('save', function (nextMiddleware) {
    //This would be a nice place to use a bulk insert operation, mongoose doesn't have that though

    function channelDetails(channel) {
        return {
            channel: channel._id,
            channelTitle: channel.title
        };
    }

    var selfChannel = this;

    return async.parallel(
        [
            function saveAddedEpisodes(done) {
                async.each(
                        selfChannel._addedEpisodes || [],
                    function saveEpisode(episode, next) {
                        _.extend(episode, channelDetails(selfChannel));

                        episode.save(next);
                    },
                    function doneSaving(err) {
                        done(err);
                    }
                );
            },
            function saveUpdatedEpisodes(done) {
                async.each(
                        selfChannel._updatedEpisodes || [],
                    function updateEpisode(episode, next) {
                        Episode.model.findOne({customID: episode.getCustomID() })
                            .exec(
                            function (err, episodeFromDB) {
                                if (err) {
                                    return next(err);
                                }
                                if (!episodeFromDB) {
                                    return next(new ReferenceError("Episode[" + episode.getCustomID() + "] was not found in the database"));
                                }
                                assert(!selfChannel.isNew);

                                delete episode._doc._id;
                                var updatedEpisode = _.extend(episodeFromDB, episode.toObject());
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
            nextMiddleware(err);
        }
    );
});

ChannelSchema.methods.retrieveEpisodeCustomIDs = function(callback) {
    Episode.model
        .find({
            channel: this._id
        })
        .exec(
            function(err, storedEpisodes) {
                if (err) {
                    return callback(err);
                }

                var storedCustomIDs = _.map(storedEpisodes,
                    function (episode) {
                        return episode.customID;
                    });
                return callback(null, storedCustomIDs);
            }
        );
};

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

    this.episodes.push(episode._id);

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

    this._updatedEpisodes = this._updatedEpisodes || [];
    this._updatedEpisodes.push(episode);
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