var mongoose = require('mongoose'),
    Episode = require('./Episode');

var ChannelSchema = mongoose.Schema( {
    title: String,
    episodes: [ Episode.schema ]
});

/**
 * Returns a unique identifier for the current Channel
 * @return {String} Unique ID for the Channel
 */
ChannelSchema.methods.getID = function() {
    return this.title;
};

/**
 * Adds an Episode to the list of Episode objects for the current Channel. Also keeps track of the Episode objects added to the Channel since being 
 * created or retrieved, whichever action happened last.
 * @param {Episode} episode Episode to be added to the current Channel
 */
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