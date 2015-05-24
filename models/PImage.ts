/** @module PImage */

/// <reference path="../typings/mongoose/mongoose.d.ts" />
/// <reference path="../typings/lodash/lodash.d.ts" />
/// <reference path="../typings/winston/winston.d.ts" />
/// <reference path="../typings/async/async.d.ts" />

import mongoose = require('mongoose');
import _ = require('lodash');
import async = require('async');
import assert = require('assert');

var PImageSchema = new mongoose.Schema( {
    originalURL: { type: String }
});

PImageSchema.virtual('imageBuffer').set(function (buffer) {
    this._imageBuffer = buffer;
});

PImageSchema.virtual('imageBuffer').get(function () {
    return this._imageBuffer;
});

PImageSchema.method('saveImage', function(image, callback) {
    var this_pimage = this;
    var grid = new mongoose.mongo.Grid(mongoose.connection.db, 'channel_images');
    return grid.put(image,
        function(err, fileInfo) {
            if (err) {
                return callback(err);
            }
            this_pimage._id = fileInfo._id;
            return callback(err, this_pimage);
        });
});

PImageSchema.static('getImage',  function(image_id, callback) {
    var grid = new mongoose.mongo.Grid(mongoose.connection.db, 'channel_images');
    return grid.get(new mongoose.Types.ObjectId(image_id), callback);
});

var PImage = mongoose.model('PImage', PImageSchema);

export var schema = PImageSchema;
export var model = PImage;
