var mongoose = require('mongoose'),
    _ = require('lodash'),
    winston = require('winston'),
    Channel = require('../../models/Channel'),
    Episode = require('../../models/Episode');

exports.recentEpisodes = function(req, res) {
    Episode.model.getEpisodes({
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

exports.channel = function(req, res) {
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

exports.channels = function(req, res) {
    Channel.model.find()
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
