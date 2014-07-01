var minimistArgv = require('minimist')(process.argv.slice(2));

function commandLineArguments() {
    var commandArguments = {
        /* Level of optional warnings to log (refer to logging.js for more accurate information)
             1 - errors
             2 - critical warnings + (above)
             3 - normal warnings + (above)
             4 - all warnings + (above)
             5 - informational + (above)
         */ 
        warn_level : 1
    };

    commandArguments.warn_level = minimistArgv.warn || commandArguments.warn_level;

    return commandArguments;
}

function podcastXMLSource() {
    var XMLSource = [
        {
            type : "file",
            source: __dirname + "/test.xml"
        }
    ];

    if (minimistArgv.input && minimistArgv.input == "testRSS") {
        XMLSource = [
            {
                type : "rss",
                source: "http://feeds.feedburner.com/comedydeathrayradio?format=xml"
            }
        ];
    }
    
    if (minimistArgv.sources) {
        XMLSource = require(minimistArgv.sources);
    }

    return XMLSource;
}

module.exports = {
    mongoURL: process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'mongodb://localhost/podcasts',
    cmd_args : commandLineArguments(),
    XMLSource : podcastXMLSource()
};