var mongoose = require('mongoose'),
    Episode = require('./Episode');

var ChannelSchema = mongoose.Schema( {
    title: String,
    episodes: [ Episode.schema ]
});

ChannelSchema.methods.getID = function() {
    return this.title;
};

ChannelSchema.methods.addEpisode = function(episode) {
    if (!(episode instanceof Episode.model)) {
        throw new TypeError("Passed episode not of type Episode");
    }
    this.episodes.push(episode);
    if (!this._addedEpisodes) {
        this._addedEpisodes = [episode];
    } else {
        this._addedEpisodes.push(episode);
    }
};

var Channel = mongoose.model('Channel', ChannelSchema);

module.exports = {
    schema: ChannelSchema,
    model: Channel
};