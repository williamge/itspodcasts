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

module.exports = {
    socketExceptionCommand: socketExceptionCommand,
    failPointCommand: failPointCommand,
    runCommand: runCommand,
    mongoTestCommandsEnabled: mongoTestCommandsEnabled
};