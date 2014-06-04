var ChannelSpec = require('./ChannelSpec'),
    scrapeSpec = require('./scrapeSpec'),
    EpisodeSpec = require('./EpisodeSpec');

exports.run = function() {
    ChannelSpec.run();
    scrapeSpec.run();
    EpisodeSpec.run();
};

exports.run();