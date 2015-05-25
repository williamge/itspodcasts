/// <reference path="../../typings/mongoose/mongoose.d.ts" />
/// <reference path="../../typings/lodash/lodash.d.ts" />
/// <reference path="../../typings/winston/winston.d.ts" />

import mongoose = require('mongoose');
import     _ = require('lodash');
import    PImage = require('../../models/PImage');
import    winston = require('winston');

import fs = require('fs');


/*
 * GET home page.
 */

export var channel_images = function(req, res) {

    var image_id = req.params.image_id.replace(".jpg", "");

    (<any> PImage.model).getImage(image_id,
        function(err, image) {
            if (err) {
                winston.error(err);
                return res.send(404);
            }

            res.type('jpeg');
            res.send(image);
        });
};
