var mongoose = require('mongoose');

var EpisodeSchema = mongoose.Schema( {
    _id: String,
    title: String,
    link: String,
    description: String,
    guid: String
});

EpisodeSchema.pre('save', function(next) {
    if (!this._id) {
        this._id = this.getID();
    }
    next();
});

EpisodeSchema.methods.getID = function() {
    return this.guid || this.link;
};

var Episode = mongoose.model('Episode', EpisodeSchema);

module.exports = {
    schema: EpisodeSchema,
    model: Episode
};