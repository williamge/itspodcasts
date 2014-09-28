var _ = require('lodash'),
    fs = require('fs'),
    xml2js = require('xml2js'),
    parseString = xml2js.parseString;

var socketExceptionCommand = function(timesToFail) {
    return failPointCommand( 
                'throwSockExcep', 
                { 'times': timesToFail } 
            );
};

var failPointCommand = function(failPoint, mode) {
    return {
        'configureFailPoint' : failPoint,
        'mode': mode
    }; 
};

var runCommand = function (mongoose, command, callback) {
    mongoose.connection.db.admin().command(command, callback);
};

var mongoTestCommandsEnabled = function() {
    //TODO: add an actual test instead of having to explicitly set an env variable
    return process.env.ENABLE_MONGO_TEST_COMMANDS || false;
};


var parseXML = function (xmlString, callback) {
    xml2js.parseString( xmlString, 
        function( err, xmlDom ) {
            if (err) {
                console.error("Error in parsing XML");
                return callback(err);
            } else {
                try {

                    var output = {};

                    output.xml = xmlString.toString();
                    output.xmlChannel = xmlDom.rss.channel[0];
                    output.xmlEpisode = output.xmlChannel.item[0];
                    return callback(err, output);
                }
                catch (e) {
                    console.error("Error while accesing XML DOM");
                    return callback(err);
                }
            }
        }
    );
};

var loadXML = function(path,  callback) {
    fs.readFile(path, 
        function(err, xmlFS) {
            if (err) return callback(err);

            parseXML(xmlFS.toString(), callback);
        }
    );
};

var loadXMLSync = function(path) {
   return fs.readFileSync(path);
};

var testXML = {
    feed: loadXMLSync(__dirname + '/data/Feed.xml').toString(),
    episode: loadXMLSync(__dirname + '/data/episode.xml').toString(),
    channel: loadXMLSync(__dirname + '/data/channel.xml').toString()
};


module.exports = {
    socketExceptionCommand: socketExceptionCommand,
    failPointCommand: failPointCommand,
    runCommand: runCommand,
    mongoTestCommandsEnabled: mongoTestCommandsEnabled,
    testXML : testXML
};