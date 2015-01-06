/** @module PImage */

var mongoose = require('mongoose'),
    _ = require('lodash'),
    async = require('async'),
    assert = require('assert');

var PImageSchema = mongoose.Schema( {
    originalURL: { type: String }
});

PImageSchema.virtual('imageBuffer').set(function (buffer) {
    this._imageBuffer = buffer;
});

PImageSchema.virtual('imageBuffer').get(function () {
    return this._imageBuffer;
});

PImageSchema.methods.saveImage = function(image, callback) {
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
};

PImageSchema.statics.getImage = function(image_id, callback) {
    var grid = new mongoose.mongo.Grid(mongoose.connection.db, 'channel_images');
    return grid.get(mongoose.Types.ObjectId(image_id), callback);
};

var PImage = mongoose.model('PImage', PImageSchema);

module.exports = {
    schema: PImageSchema,
    model: PImage
};