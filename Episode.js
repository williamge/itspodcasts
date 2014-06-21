var mongoose = require('mongoose');

var EpisodeSchema = mongoose.Schema( {
    _id: { type: String, required: true },
    title: String,
    link: String,
    description: String,
    guid: String
});

EpisodeSchema.methods.getID = function() {
    return this.title;
};

var Episode = mongoose.model('Episode', EpisodeSchema);

module.exports = {
    schema: EpisodeSchema,
    model: Episode
};