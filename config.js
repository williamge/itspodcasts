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

    var warn_regex = /warn([0-9])/g,
        regexResult;

    process.argv.forEach( function( element, index, array ) {
        if ( ( regexResult = warn_regex.exec( element ) ) !== null ) {
            commandArguments.warn_level = regexResult[1];
        }
    } );

    return commandArguments;
}

function podcastXMLSource() {
    var XMLSource = [
        {
            type : "file",
            source: "test.xml"
        }
    ];

    var inputRegex = /--input=(\S+)/g,
        regexResult;

    process.argv.forEach( function( element) {
        if ( ( regexResult = inputRegex.exec( element ) ) !== null &&
            regexResult[1] == "testRSS" ) {
            XMLSource = [
                {
                    type : "rss",
                    source: "http://feeds.feedburner.com/comedydeathrayradio?format=xml"
                }
            ];
        }
    } );

    return XMLSource;
}

module.exports = {
    mongoURL: 'mongodb://localhost/podcasts',
    cmd_args : commandLineArguments(),
    XMLSource : podcastXMLSource()
};