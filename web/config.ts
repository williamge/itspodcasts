/// <reference path="../typings/node/node.d.ts" />

var config = {
    mongoURL: process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || process.env.MONGO_URL || 'mongodb://localhost/podcasts'
};

export = config;
