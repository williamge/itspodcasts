/** @module Channel */

var mongoose = require('mongoose'),
    _ = require('lodash');

var EpisodeSchema = mongoose.Schema( {
    _id: String,

    /*Is this weird??!?! Yes!
    * _id being a string makes it easier to find the episode in the scraper going off of the Channel model through the
    * 'episodes' array/index, for making links and generally referring/finding an Episode model an ObjectId is nicer,
    * hence why we have a string _id and an ObjectId oid, rather than the other way around.
    */
    oid: {
        type: mongoose.Schema.Types.ObjectId
    },
    title: String,
    link: String,
    description: String,
    pubDate: Date,
    guid: String,
    channel : { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Channel',
        required: true
    },
    channelTitle: String
});

/**
 * Pre-save hook for Episode objects, makes sure that the '_id' attribute is set if it is not already set.
 */
EpisodeSchema.pre('save', function(next) {
    if (!this._id) {
        this._id = this.getID();
    }
    if (!this.oid) {
        this.oid = new mongoose.Types.ObjectId();
    }
    next();
});

/**
 * Returns a unique identifier for the current Episode
 * @return {String} Unique ID for the Episode
 */
EpisodeSchema.methods.getID = function() {
    if (!this._id) {
        this._id = this.guid || this.link;
    }
    return this._id;
};

EpisodeSchema.virtual('URLsafeID').get(function () {
    return this.oid;
});

/**
 * Retrieves a list of all episode objects, with a limit of 50 by default. Limit and 
 * sorting behaviour is defined in callingOptions using the equivalent MongoDB expected objects.
 * @param  {Object}   callingOptions optional object with options for the query to be run
 * @param  {Function} callback       callback that will be called with any errors and with the list of retrieved episodes
 */
EpisodeSchema.statics.getEpisodes = function(callingOptions, callback) {

    if ('function' === typeof callingOptions) {
        callback = callingOptions;
        callingOptions = null;
    }

    var defaultOptions = {
        limit: 50
    };

    var options = _.extend(defaultOptions, callingOptions);

    var aggregate = this.find();

    if (options.sort) {
        aggregate = aggregate.sort(
            options.sort
        );
    }

    if ( typeof options.limit !== 'undefined' ) {
        aggregate = aggregate.limit( options.limit );
    }

    return aggregate;
};

EpisodeSchema.statics.getEpisodesNow = function(callingOptions, callback) {
    this.getEpisodes(callingOptions).exec(callback);
};

var Episode = mongoose.model('Episode', EpisodeSchema);

module.exports = {
    schema: EpisodeSchema,
    model: Episode
};