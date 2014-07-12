/** @module PodcastSource */

var mongoose = require('mongoose');

var PodcastSourceSchema = mongoose.Schema( {
    source: {type: String, unique: true},
    type: String
});

var PodcastSource = mongoose.model('PodcastSource', PodcastSourceSchema);

/**
 * Retrieves a list of PodcastSources from the database and passes them to the callback.
 * @param  {Function} callback callback that will be called with an error or the list of sources.
 */
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