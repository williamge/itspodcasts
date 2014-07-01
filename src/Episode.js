var mongoose = require('mongoose');

var EpisodeSchema = mongoose.Schema( {
    _id: String,
    title: String,
    link: String,
    description: String,
    pubDate: Date,
    guid: String
});

/**
 * Pre-save hook for Episode objects, makes sure that the '_id' attribute is set if it is not already set.
 */
EpisodeSchema.pre('save', function(next) {
    if (!this._id) {
        this._id = this.getID();
    }
    next();
});

/**
 * Returns a unique identifier for the current Episode
 * @return {String} Unique ID for the Episode
 */
EpisodeSchema.methods.getID = function() {
    return this.guid || this.link;
};

var Episode = mongoose.model('Episode', EpisodeSchema);

module.exports = {
    schema: EpisodeSchema,
    model: Episode
};