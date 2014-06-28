var ChannelSpec = require('./ChannelSpec'),
    scrapeSpec = require('./scrapeSpec'),
    EpisodeSpec = require('./EpisodeSpec'),
    mainSpec = require('./mainSpec');

var mongoose = require('mongoose');

var dbURL = 'mongodb://localhost/TEST-podcasts';

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

ChannelSpec.run(dbURL);
scrapeSpec.run(dbURL);
EpisodeSpec.run(dbURL);
mainSpec.run(dbURL);