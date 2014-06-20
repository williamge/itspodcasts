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

module.exports = {
    socketExceptionCommand: socketExceptionCommand,
    failPointCommand: failPointCommand
};