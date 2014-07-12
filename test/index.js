var mongoose = require('mongoose'),
    winston = require('winston');

var dbURL = process.env.MONGOTEST_URI || 'mongodb://localhost/TEST-podcasts';

before( function(done) {
    mongoose.connect(dbURL, function(err) {
        if (err){
            throw err;
        }

        winston.add(winston.transports.File, { filename: 'testlog.log' });
        winston.remove(winston.transports.Console);

        done();
    });
    
    mongoose.connection.on('error', function (err) {
        winston.error('Could not connect to mongo server!', err);
    });
} );