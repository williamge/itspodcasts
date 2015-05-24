/// <reference path="../../typings/mongoose/mongoose.d.ts" />
/// <reference path="../../typings/lodash/lodash.d.ts" />
/// <reference path="../../typings/winston/winston.d.ts" />
/// <reference path="../../typings/async/async.d.ts" />
/// <reference path="../../typings/node/node.d.ts" />
/// <reference path="../../typings/minimist/minimist.d.ts" />


import _ = require('lodash');
import PodcastSource = require('../../models/PodcastSource');
import minimist = require('minimist');
import path = require('path');

var minimistArgv: any = minimist(process.argv.slice(2));


export var cmdline_help_text = "Available arguments:\n" +
    "The following options will allow you to save the source by appending a comma and 'y', 'yes', or 'save' after the source location\n" +
    "--rss : Specify an RSS feed URL to scrape from\n" +
    "--file : Specify an XML file to read\n" +
    "--sources : Specify a JSON file containing sources to scrape from\n" +
    "--db-sources : Scrape the sources that are already saved\n" +
    "--soft-update : Update episodes and channels that have already been scraped in addition to adding new episodes, " +
    "will not delete episodes or channels that have already been scraped";

function podcastXMLSource() {
    var XMLSource = [];

    function interpretSaveOption(argument) {
        if (!argument) {
            return argument;
        }

        return (new RegExp("^(y|yes|save)$", "i")).test(argument);
    }

    if (minimistArgv.sources) {
        var sourcesFileArgSplit = minimistArgv.sources.split(",");
        var sourcesFilePath = sourcesFileArgSplit[0];
        var saveSourcesFileSourceToDB = interpretSaveOption(sourcesFileArgSplit[1]) || false;

        var sourcesFileSources = require(
            path.resolve(sourcesFilePath)
        );

        XMLSource = _.map(sourcesFileSources,
            function(sourceItem: any) {

                if (sourceItem.type === 'rss' && saveSourcesFileSourceToDB) {
                    _.extend(sourceItem, {
                        saveToDB: saveSourcesFileSourceToDB
                    });
                }

                return new PodcastSource.model(sourceItem);
            }
        );
    }

    if (minimistArgv.rss) {
        if (_.isString(minimistArgv.rss)) {
            minimistArgv.rss = [minimistArgv.rss];
        }
        _.each(minimistArgv.rss,
            function(rssFeed: any) {
                var rssArgSplit = rssFeed.split(",");
                var rssURL = rssArgSplit[0];
                var saveRssSourceToDB = interpretSaveOption(rssArgSplit[1]) || false;
                XMLSource.push(new PodcastSource.model({
                    type: "rss",
                    source: rssURL,
                    saveToDB: saveRssSourceToDB
                }));
            });
    }

    if (minimistArgv.file) {
        if (_.isString(minimistArgv.file)) {
            minimistArgv.file = [minimistArgv.file];
        }
        _.each(minimistArgv.file,
            function(fileFeed: any) {
                var fileArgSplit = fileFeed.split(",");
                var fileURL = fileArgSplit[0];

                XMLSource.push(new PodcastSource.model({
                    type: "file",
                    source: path.resolve(fileURL)
                }));
            }
        );
    }

    return XMLSource;
}

export var mongoURL = process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || process.env.MONGO_URL || 'mongodb://localhost/podcasts';

export var XMLSource = podcastXMLSource();

export var softUpdate = minimistArgv['soft-update'] || false;

export var getSourcesFromDB =  minimistArgv['db-sources'] || false;
