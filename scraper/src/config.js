var minimistArgv = require('minimist')(process.argv.slice(2)),
    path = require('path'),
    _ = require('lodash');

function podcastXMLSource() {
    var XMLSource = [];

    function interpretSaveOption(argument) {
        if (!argument) {
            return !argument;
        }

        return (new RegExp("^(y|yes|save)$", "i")).test(argument);
    }

    if (minimistArgv.rss) {
        var rssArgSplit = minimistArgv.rss.split(",");
        var rssURL = rssArgSplit[0];
        var saveRssSourceToDB = interpretSaveOption(rssArgSplit[1]) || false;
        XMLSource.push({
            type: "rss",
            source: rssURL,
            saveToDB: saveRssSourceToDB
        });
    }

    if (minimistArgv.file) {
        var fileArgSplit = minimistArgv.file.split(",");
        var fileURL = fileArgSplit[0];
        var saveFileSourceToDB = interpretSaveOption(fileArgSplit[1]) || false;

        XMLSource.push({
            type: "file",
            source: path.resolve(minimistArgv.file),
            saveToDB: saveFileSourceToDB
        });
    }

    if (minimistArgv.sources) {
        var sourcesFileArgSplit = minimistArgv.sources.split(",");
        var sourcesFilePath = sourcesFileArgSplit[0];
        var saveSourcesFileSourceToDB = interpretSaveOption(sourcesFileArgSplit[1]) || false;

        var sourcesFileSources = require(
            path.resolve(sourcesFilePath)
        );

        XMLSource = _.map(sourcesFileSources,
            function(sourceItem) {
                return _.extend(sourceItem, {
                    saveToDB: saveSourcesFileSourceToDB
                });
            }
        );
    }

    return XMLSource;
}

module.exports = {
    mongoURL: process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || process.env.MONGO_URL || 'mongodb://localhost/podcasts',
    XMLSource: podcastXMLSource(),
    softUpdate: minimistArgv['soft-update'] || false,
    getSourcesFromDB: minimistArgv['db-sources'] || false
};
