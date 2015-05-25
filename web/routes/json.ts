/// <reference path="../../typings/mongoose/mongoose.d.ts" />
/// <reference path="../../typings/lodash/lodash.d.ts" />
/// <reference path="../../typings/winston/winston.d.ts" />

import mongoose = require('mongoose');
import _ = require('lodash');
import Channel = require('../../models/Channel');
import Episode = require('../../models/Episode');
import winston = require('winston');

export var recentEpisodes = function(req, res) {
    //TODO(wg): Having an 'any' type is not good, yet there is no way for the mongoose typings to expose the interface
    // for the static methods we assigned to Episode, so the <any> is necessary here. In the future just get rid of the
    // object creation through mongoose and use mongoose internally in an Episode class to sidestep all of this.
    (<any> Episode.model).getEpisodes({
        sort: {
            pubDate: -1
        },
        select: 'title description link pubDate channel explicit duration'
    }).populate({
        path: 'channel',
        select: 'images title description explicit'
    })
        .exec(
            function(err, episodes) {
                if (err) {
                    winston.error("recent episodes page json#recentEpisodes error: " +
                        err);
                }

                res.json(episodes);
            }
    );
};

export var channel = function(req, res) {
    Channel.model.find({
        _id: req.params.id
    })
        .exec(
            function(err, channel) {
                if (err) {
                    winston.error("specific channel page json#channel error: " +
                        err);
                }

                res.json(channel);
            }
    );
};

export var channels = function(req, res) {
    Channel.model.find(null)
        .select('title images')
        .exec(
            function(err, channels) {
                if (err) {
                    winston.error("all channels json error: " +
                        err);
                }

                res.json(channels);
            }
    );
};
