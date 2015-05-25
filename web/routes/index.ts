/// <reference path="../../typings/mongoose/mongoose.d.ts" />
/// <reference path="../../typings/lodash/lodash.d.ts" />
/// <reference path="../../typings/winston/winston.d.ts" />

import mongoose = require('mongoose');
import _ = require('lodash');
import Channel = require('../../models/Channel');
import Episode = require('../../models/Episode');
import winston = require('winston');


/*
 * GET home page.
 */

export var index = function(req, res) {

    (<any>Episode.model).getEpisodes({
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

export var allContent = function(req, res) {

    (<any> Channel.model).find()
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

export var channels = function(req, res) {

    (<any> Channel.model)
        .find()
        .sort('title')
        .exec(
            function(err, channel) {
                if (err) {
                    console.error("Index page Channel#getEpisodes error: " +
                        err);
                    return res.render(500);
                }
                res.render('channels', {
                    title: 'It\'s podcasts',
                    channels: channel
                });
            }
    );
};

export var channel = function(req, res) {

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
                if (!channel) {
                    return res.send(404, "Sorry, we couldn't find that channel");
                }

                res.render('channel', {
                    title: channel.title,
                    channel: channel
                });
            }
    );
};

export var episode = function(req, res) {

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

export var channelEpisodes = function(req, res) {

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
