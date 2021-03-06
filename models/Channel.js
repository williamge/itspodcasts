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
    images: [PImage.schema],
    explicit: Boolean,
    description: String,
    category: [String]
});

ChannelSchema.virtual('updatedEpisodes').get(function() {
    return this._updatedEpisodes || [];
});

ChannelSchema.virtual('addedEpisodes').get(function() {
    return this._addedEpisodes || [];
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
            },
            function saveUnsavedImages(done){
                    async.each(
                        selfChannel.unsavedImages || [],
                        function saveImage(image, next) {
                            selfChannel.saveImage(image, next);
                        },
                        function doneSavingImages(err) {
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

ChannelSchema.methods.addImage = function(pimage) {
    var self = this;
    self.images.push(pimage);
    self.images[[self.images.length-1]].saved = false;
    self.unsavedImages = self.unsavedImages || [];
    //Note: when the PImage instance is added to self.images, since self.images is an array
    //handled by mongoose, non-schema properties will be dropped apparently, such as one we are
    //relying on later called 'imageBuffer', hence we need to add the original pimage argument
    //to unsavedImages to ensure we have access to imageBuffer later.
    //
    //I wish mongoose had better support for GridFS to make this a lot cleaner but unfortunately it doesn't.
    self.unsavedImages.push(pimage);
};

ChannelSchema.methods.saveImage = function(image, callback) {
    var self = this;

    var original_imageID = image._id;

    image.saveImage(image.imageBuffer,
        function imageSaved (err, savedImage) {
            if (err) {
                return callback(null, self);
            }


            var matchingUnsavedImages = _.filter(self.unsavedImages, function(filter_image) {
                return filter_image.originalURL === image.originalURL;
            });

            if (matchingUnsavedImages.length === 0) {
                self.images.push(savedImage);
            } else {
                self.unsavedImages = _.filter(self.unsavedImages,
                    function filterImage(filter_image) {
                        return filter_image.originalURL !== image.originalURL;
                    });

                //TODO: clear up the below process, it seems fishy to do so much work because something was changing inside a function

                //If the image was already added to the 'channel.images' array then
                //it's _id will be different from what it should be, if so then we
                //just update that image to be the one we saved, which will have a new id
                self.images = _.map(self.images, function(imageFromImages) {
                    if (imageFromImages._id || imageFromImages === original_imageID) {
                        return savedImage;
                    } else {
                        return imageFromImages;
                    }
                });
            }

            return callback(null, self);
        }
    );
};

var Channel = mongoose.model('Channel', ChannelSchema);

module.exports = {
    schema: ChannelSchema,
    model: Channel
};