/** @module PodcastSource */

/// <reference path="../typings/mongoose/mongoose.d.ts" />

import mongoose = require('mongoose');


interface IPodcastSourceSchema {
    source: String;
    type: String;
    saveToDb: Boolean;
}

export interface IPodcastSourceModel extends IPodcastSourceSchema, mongoose.Document {}

var PodcastSourceSchema = new mongoose.Schema( {
    source: {type: String, unique: true},
    type: String
});

PodcastSourceSchema.virtual('saveToDB').set(function (saveFlag) {
   this._saveToDB = saveFlag ;
});

PodcastSourceSchema.virtual('saveToDB').get(function () {
    return this._saveToDB || false;
});

var PodcastSource = mongoose.model<IPodcastSourceModel>('PodcastSource', PodcastSourceSchema);

/**
 * Retrieves a list of PodcastSources from the database and passes them to the callback.
 * @param  {Function} callback callback that will be called with an error or the list of sources.
 */
export function getFromDatabase(callback) {
    PodcastSource.find(
        function(err, sources) {
            if (err) {
                return callback(err, sources);
            }

            return callback(null, sources);
        }
    );
}

export var schema = PodcastSourceSchema;
export var model = PodcastSource;
