var ChannelSpec = require('./ChannelSpec'),
    scrapeSpec = require('./scrapeSpec'),
    EpisodeSpec = require('./EpisodeSpec');

var mongoose = require('mongoose');

var dbURL = 'mongodb://localhost/TEST-podcasts';

before( function() {
    mongoose.connect(dbURL);
} );

ChannelSpec.run(dbURL);
scrapeSpec.run(dbURL);
EpisodeSpec.run(dbURL);
