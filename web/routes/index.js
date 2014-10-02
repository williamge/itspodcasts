var mongoose = require('mongoose'),
    _ = require('lodash'),
    Channel = require('../../models/Channel'),
    Episode = require('../../models/Episode');


/*
 * GET home page.
 */

exports.index = function(req, res) {

    Episode.model.getEpisodes({
        sort: {
            pubDate: -1
        }
    }).populate('channel').exec(
        function(err, episodes) {
            if (err) {
                console.error("Index page Channel#getEpisodes error: " +
                    err);
            }

            res.render('index', {
                title: 'It\'s podcasts',
                episodes: episodes || []
            });
        }
    );
};

exports.allContent = function(req, res) {

    Channel.model.find()
        .populate('episodes')
        .exec(
            function(err, channel) {
                res.render('all', {
                    title: 'It\'s podcasts',
                    channels: channel
                });
            }
    );
};

exports.channel = function(req, res) {

    if (!req.params.channelid) {
        winston.error("Channel ID not found", req);
        return res.send(404, "Sorry, we couldn't find that channel");
    }

    Channel.model.findOne({
        _id: req.params.channelid
    })
        .populate({
            path: 'episodes',
            options: {
                sort: {
                    'pubDate': -1
                },
                limit: 5
            }
        })
        .exec(
            function(err, channel) {
                res.render('channel', {
                    title: channel.title,
                    channel: channel
                });
            }
    );
};

exports.episode = function(req, res) {

    if (!req.params.episodeid) {
        winston.error("Channel ID not found", req);
        return res.send(404, "Sorry, we couldn't find that episode");
    }

    var episodeID = req.params.episodeid;

    Episode.model.findOne({
        _id: episodeID
    })
        .populate('channel')
        .exec(
            function(err, episode) {
                if (!episode) {
                    return res.send(404, "Sorry, we couldn't find that episode");
                }
                res.render('episode', {
                    episode: episode
                });
            }
    );
};

exports.channelEpisodes = function(req, res) {

    if (!req.params.channelid) {
        winston.error("Channel ID not found", req);
        return res.send(404, "Sorry, we couldn't find that channel");
    }

    Channel.model.findOne({
        _id: req.params.channelid
    })
        .populate({
            path: 'episodes',
            options: {
                sort: {
                    'pubDate': -1
                }
            }
        })
        .exec(
            function(err, channel) {
                res.render('channelEpisodes', {
                    title: channel.title,
                    channel: channel
                });
            }
    );
};
