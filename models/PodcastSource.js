/** @module PodcastSource */

var mongoose = require('mongoose');

var PodcastSourceSchema = mongoose.Schema( {
    source: {type: String, unique: true},
    type: String
});

var PodcastSource = mongoose.model('PodcastSource', PodcastSourceSchema);


function getFromDatabase(callback) {
    PodcastSource.find(
        function(err, sources) {
            if (err) {
                return callback(err, sources);
            }

            return callback(null, sources);
        }
    );
}

module.exports = {
    schema: PodcastSourceSchema,
    model: PodcastSource,
    getFromDatabase: getFromDatabase
};