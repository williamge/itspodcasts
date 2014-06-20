var ChannelSpec = require('./ChannelSpec'),
    scrapeSpec = require('./scrapeSpec'),
    EpisodeSpec = require('./EpisodeSpec');

var dbURL = 'mongodb://localhost/TEST-podcasts';


ChannelSpec.run(dbURL);
scrapeSpec.run(dbURL);
EpisodeSpec.run(dbURL);
