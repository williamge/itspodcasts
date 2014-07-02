var ChannelSpec = require('./ChannelSpec'),
    scrapeSpec = require('./scrapeSpec'),
    EpisodeSpec = require('./EpisodeSpec'),
    mainSpec = require('./mainSpec');

var mongoose = require('mongoose');

var dbURL = process.env.MONGOTEST_URI || 'mongodb://localhost/TEST-podcasts';

before( function(done) {
    mongoose.connect(dbURL, function(err) {
        if (err)
            throw err;

        done();
    });
    
    mongoose.connection.on('error', function (err) {
      console.log('Could not connect to mongo server!');
      console.log(err);
    });

} );