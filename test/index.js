var ChannelSpec = require('./ChannelSpec'),
    scrapeSpec = require('./scrapeSpec'),
    EpisodeSpec = require('./EpisodeSpec');

var dbURL = 'mongodb://localhost/TEST-podcasts';

describe('itspodcasts RSS scraper test suite', function() {
    ChannelSpec.run(dbURL);
    scrapeSpec.run(dbURL);
    EpisodeSpec.run(dbURL);
});