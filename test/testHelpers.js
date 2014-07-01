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

module.exports = {
    socketExceptionCommand: socketExceptionCommand,
    failPointCommand: failPointCommand,
    runCommand: runCommand
};