var _ = require('lodash'),
    fs = require('fs');

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

//Don't hate me for using a sync function, it's only for test code, 
//run three times ever per test run, and is a lot simpler than
//the equivalent async code.
var loadXMLSync = function(path) {
   return fs.readFileSync(path);
};

var testXML = {
    feed: loadXMLSync(__dirname + '/data/Feed.xml').toString(),
    episode: loadXMLSync(__dirname + '/data/episode.xml').toString(),
    channel: loadXMLSync(__dirname + '/data/channel.xml').toString(),
    feedNoImage: loadXMLSync(__dirname + '/data/feedNoImage.xml').toString()
};


module.exports = {
    socketExceptionCommand: socketExceptionCommand,
    failPointCommand: failPointCommand,
    runCommand: runCommand,
    mongoTestCommandsEnabled: mongoTestCommandsEnabled,
    testXML : testXML
};