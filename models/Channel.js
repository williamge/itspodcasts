/** @module Channel */

var mongoose = require('mongoose'),
    _ = require('lodash');

var Episode = require('./Episode');

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

ChannelSchema.statics.getEpisodes = function(callingOptions, callback) {

    if ('function' === typeof options) {
        callback = callingOptions;
        callingOptions = null;
    }

    var defaultOptions = {
        limit: 50
    };

    var options = _.extend(defaultOptions, callingOptions);

    var aggregate = this.aggregate().unwind("episodes")
        .project(
            {
                channelTitle: "$title",
                title: "$episodes.title",
                pubDate: "$episodes.pubDate",
                link: "$episodes.link",
                description: "$episodes.description"
            }
        );

    if (options.sort) {
        aggregate = aggregate.sort(
            options.sort
        );
    }

    if ( typeof options.limit !== 'undefined' ) {
        aggregate = aggregate.limit( options.limit );
    }

    aggregate.exec(callback);
};

var Channel = mongoose.model('Channel', ChannelSchema);

module.exports = {
    schema: ChannelSchema,
    model: Channel
};