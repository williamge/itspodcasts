var mongoose = require('mongoose'),
    _ = require('lodash'),
    PImage = require('../../models/PImage'),
    winston = require('winston');

var fs = require('fs');


/*
 * GET home page.
 */

exports.channel_images = function(req, res) {

    PImage.model.getImage(req.params.image_id,
        function(err, image) {
            if (err) {
                winston.error(err);
                return res.send(404);
            }

            res.type('jpeg');
            res.send(image);
        });
};
