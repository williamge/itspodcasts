var mongoose = require('mongoose'),
    _ = require('lodash'),
    PImage = require('../../models/PImage'),
    winston = require('winston');

var fs = require('fs');


/*
 * GET home page.
 */

exports.channel_images = function(req, res) {

    var image_id = req.params.image_id.replace(".jpg", "");

    PImage.model.getImage(image_id,
        function(err, image) {
            if (err) {
                winston.error(err);
                return res.send(404);
            }

            res.type('jpeg');
            res.send(image);
        });
};
