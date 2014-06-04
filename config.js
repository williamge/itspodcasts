var cmd_args = {
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
    re;

process.argv.forEach( function( element, index, array ) {
    if ( ( re = warn_regex.exec( element ) ) !== null ) {
        cmd_args.warn_level = re[1];
    }
} );

module.exports = {
    mongoURL: 'mongodb://localhost/podcasts',
    cmd_args : cmd_args
};