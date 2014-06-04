var util = require('util');

var config = require('./config');

var selectiveLog = function(message, level) {

    if ( ! (level in selectiveLog.logLevels.values) )  {
        throw new Error ("Specified warning level (" + level + ") is not a valid level");
    }

    if ( level <= config.cmd_args.warn_level ) {
        console.log( 
            util.inspect(
                "Log level " + level,
                { colors: true }
            ) + message 
        );
    }
};

selectiveLog.logLevels = {
    errors : 1,
    criticalWarning : 2,
    mediumWarning : 3,
    lowWarning : 4,
    informational : 5
};

selectiveLog.logLevels.values = [];
for (var level in selectiveLog.logLevels) {
    selectiveLog.logLevels.values.push( selectiveLog.logLevels[level] );
}

module.exports = selectiveLog;