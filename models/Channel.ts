/** @module Channel */

/// <reference path="../typings/mongoose/mongoose.d.ts" />
/// <reference path="../typings/lodash/lodash.d.ts" />
/// <reference path="../typings/winston/winston.d.ts" />
/// <reference path="../typings/async/async.d.ts" />

import mongoose = require('mongoose');
import _ = require('lodash');
import Episode = require('./Episode');
import winston = require('winston');
import async = require('async');
import assert = require('assert');
import PImage = require('./PImage');

interface IChannel {
    title: String;
    episodes: String[];
    images: PImage.IPImageModel[];
    explicit: Boolean;
    description: String;
    category: String[];
    retrieveEpisodeCustomIDs: (err: Error, results: any) => void;
    getID: () => string;
    getUpdatedEpisodes: () => any[];
    getAddedEpisodes: () => any[];
    addEpisode: (episode: Episode.IEpisodeModel) => void;
}

export interface IChannelModel extends IChannel, mongoose.Document {}

var ChannelSchema = new mongoose.Schema( {
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

    return async.parallel<void>(
        [
            function saveAddedEpisodes(done: ErrorCallback) {
                async.each(
                    selfChannel._addedEpisodes || [],
                    function saveEpisode(episode: Episode.IEpisodeModel, next) {
                        _.extend(episode, channelDetails(selfChannel));

                        episode.save(next);
                    },
                    function doneSaving(err) {
                        done(err);
                    }
                );
            },
            function saveUpdatedEpisodes(done: ErrorCallback) {
                async.each(
                    selfChannel._updatedEpisodes || [],
                    function updateEpisode(episode: Episode.IEpisodeModel, next) {
                        Episode.model.findOne({customID: episode.getCustomID() })
                            .exec(
                            function (err, episodeFromDB: Episode.IEpisodeModel) {
                                if (err) {
                                    return next(err);
                                }
                                if (!episodeFromDB) {
                                    return next(new ReferenceError("Episode[" + episode.getCustomID() + "] was not found in the database"));
                                }
                                assert(!selfChannel.isNew);

                                //TODO(wg): Two bad things in one: delete keyword, and ._doc which appears to be an undocumented property on mongoose models
                                delete (<any> episode)._doc._id;
                                var updatedEpisode = <Episode.IEpisodeModel> _.extend(episodeFromDB, episode.toObject());
                                updatedEpisode.save(next);
                            }
                        );
                    },
                    function doneUpdating(err) {
                        done(err);
                    }
                );
            },
            function saveUnsavedImages(done: ErrorCallback){
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

ChannelSchema.method('retrieveEpisodeCustomIDs', function(callback) {
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
                    function (episode: Episode.IEpisodeModel) {
                        return episode.customID;
                    });
                return callback(null, storedCustomIDs);
            }
        );
});

/**
 * Returns a unique identifier for the current Channel
 * @return {String} Unique ID for the Channel
 */
ChannelSchema.method('getID', function() {
    return this.title;
});

/**
 * Returns a list of episodes that have been updated during this model's
 * lifetime.
 * @return {Array} List of updated Episode models
 */
ChannelSchema.method('getUpdatedEpisodes', function() {
    return this._updatedEpisodes || [];
});

/**
 * Returns a list of episodes that have been added during this model's lifetime.
 * @return {Array} List of added Episode models
 */
ChannelSchema.method('getAddedEpisodes', function() {
    return this._addedEpisodes || [];
});

/**
 * Adds an Episode to the list of Episode objects for the current Channel. Also keeps track of the Episode objects added to the Channel since being 
 * created or retrieved, whichever action happened last.
 * @param {Episode} episode Episode to be added to the current Channel
 */
ChannelSchema.method('addEpisode', function(episode: Episode.IEpisodeModel) {
    if (!(episode instanceof Episode.model)) {
        throw new TypeError("Passed episode not of type Episode");
    }

    this.episodes.push(episode._id);

    this._addedEpisodes = this._addedEpisodes || [];
    this._addedEpisodes.push(episode);
});

/**
 * Updates an Episode for the current channel and keeps track of the updated Episodes
 * @param  {Episode} episode Episode to be updated for the current Channel
 */
ChannelSchema.method('updateEpisode', function(episode: Episode.IEpisodeModel) {
    if (!(episode instanceof Episode.model)) {
        throw new TypeError("Passed episode not of type Episode");
    }

    this._updatedEpisodes = this._updatedEpisodes || [];
    this._updatedEpisodes.push(episode);
});

ChannelSchema.method('getLastImage', function() {
    if (this.images.length > 0) {
        return this.images[this.images.length-1];
    } else {
        return null;
    }
});

ChannelSchema.method('addImage', function(pimage: PImage.IPImageModel) {
    var self = this;
    self.images.push(pimage);
    self.images[self.images.length-1].saved = false;
    self.unsavedImages = self.unsavedImages || [];
    //Note: when the PImage instance is added to self.images, since self.images is an array
    //handled by mongoose, non-schema properties will be dropped apparently, such as one we are
    //relying on later called 'imageBuffer', hence we need to add the original pimage argument
    //to unsavedImages to ensure we have access to imageBuffer later.
    //
    //I wish mongoose had better support for GridFS to make this a lot cleaner but unfortunately it doesn't.
    self.unsavedImages.push(pimage);
});

ChannelSchema.method('saveImage', function(image, callback) {
    var self = this;

    var original_imageID = image._id;

    image.saveImage(image.imageBuffer,
        function imageSaved (err, savedImage) {
            if (err) {
                return callback(null, self);
            }


            var matchingUnsavedImages = _.filter(self.unsavedImages, function(filter_image: PImage.IPImageModel) {
                return filter_image.originalURL === image.originalURL;
            });

            if (matchingUnsavedImages.length === 0) {
                self.images.push(savedImage);
            } else {
                self.unsavedImages = _.filter(self.unsavedImages,
                    function filterImage(filter_image: PImage.IPImageModel) {
                        return filter_image.originalURL !== image.originalURL;
                    });

                //TODO: clear up the below process, it seems fishy to do so much work because something was changing inside a function

                //If the image was already added to the 'channel.images' array then
                //it's _id will be different from what it should be, if so then we
                //just update that image to be the one we saved, which will have a new id
                self.images = _.map(self.images, function(imageFromImages: PImage.IPImageModel) {
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
});

var Channel = mongoose.model<IChannelModel>('Channel', ChannelSchema);

export var schema = ChannelSchema;
export var model = Channel;
