var mongoose = require('mongoose'),
    Channel = require('../../models/Channel'),
    Episode = require('../../models/Episode');


/*
 * GET home page.
 */

exports.index = function(req, res) {

    Channel.model.getEpisodes({
            sort: {
                pubDate: -1
            }
        },
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

exports.allChannels = function(req, res) {

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
