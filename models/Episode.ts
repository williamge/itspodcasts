/** @module Channel */

/// <reference path="../typings/mongoose/mongoose.d.ts" />
/// <reference path="../typings/lodash/lodash.d.ts" />

import mongoose = require('mongoose');
import _ = require('lodash');

var EpisodeSchema = new mongoose.Schema( {

    customID: { type: String, index: true },
    title: String,
    link: String,
    description: String,
    pubDate: Date,
    guid: String,
    channel : { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Channel',
        required: true
    },
    channelTitle: String,
    explicit: Boolean,
    duration: Number
});

/**
 * Pre-save hook for Episode objects, makes sure that the '_id' attribute is set if it is not already set.
 */
EpisodeSchema.pre('save', function(next) {
    if (!this.customID) {
        this.customID = this.getCustomID();
    }
    next();
});

/**
 * Returns a unique identifier for the current Episode
 * @return {String} Unique ID for the Episode
 */
EpisodeSchema.method('getCustomID', function() {
    if (!this.customID) {
        this.customID = this.guid || this.link;
    }
    return this.customID;
});

EpisodeSchema.virtual('URLsafeID').get(function () {
    return this._id;
});

/**
 * Retrieves a list of all episode objects, with a limit of 50 by default. Limit and 
 * sorting behaviour is defined in callingOptions using the equivalent MongoDB expected objects.
 * @param  {Object}   callingOptions optional object with options for the query to be run
 * @param  {Function} callback       callback that will be called with any errors and with the list of retrieved episodes
 */
EpisodeSchema.static('getEpisodes', function(callingOptions: any, callback) {

    if ('function' === typeof callingOptions) {
        callback = callingOptions;
        callingOptions = null;
    }

    var defaultOptions = {
        limit: 50
    };

    var options: any = _.extend(defaultOptions, callingOptions);

    var aggregate = this.find();

    if (options.sort) {
        aggregate = aggregate.sort(
            options.sort
        );
    }

    if (options.select) {
        aggregate = aggregate.select(
            options.select
        );
    }

    if ( typeof options.limit !== 'undefined' ) {
        aggregate = aggregate.limit( options.limit );
    }

    return aggregate;
});

EpisodeSchema.static('getEpisodesNow', function(callingOptions, callback) {
    this.getEpisodes(callingOptions).exec(callback);
});

export var Episode = mongoose.model('Episode', EpisodeSchema);

export var schema = EpisodeSchema;
export var model = Episode;
