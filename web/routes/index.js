var mongoose = require('mongoose'),
    Channel = require('../../models/Channel');


/*
 * GET home page.
 */

exports.index = function(req, res){

    Channel.model.find()
        .exec(
            function(err, channel) {
                res.render('index', 
                    { 
                        title: 'It\'s podcasts',
                        channels: channel
                    }
                );
            }
        );
};