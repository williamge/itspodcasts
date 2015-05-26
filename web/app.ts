/**
 * Module dependencies.
 */

/// <reference path="../typings/express/express.d.ts" />

import express = require('express');

import routes = require('./routes/index');
import routes_images = require('./routes/images');
import routes_json = require('./routes/json');

import config = require('./config');

import http = require('http');
import path = require('path');

import mongoose = require('mongoose');


//Not worth it to get type definitions for these, so just import them and disregard the type since so little interacts with them.
let favicon = require('serve-favicon');
let logger = require('morgan');
let methodOverride = require('method-override');
let bodyParser = require('body-parser');
let multer = require('multer');
let errorHandler = require('errorhandler');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

//TODO(wg): Add a favicon at some point and uncomment this.
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride());
app.use(multer());
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
    app.use(errorHandler());
}

app.get('/templates/:template',
    function(req, res) {
        var templateName = req.params.template.replace(".html", "");
        return res.render('directives/' + templateName);
    }
);

app.get('/', routes.index);
app.get('/all', routes.allContent);
app.get('/channels', routes.channels);
app.get('/channel/:channelid', routes.channel);
app.get('/channel/:channelid/episodes', routes.channelEpisodes);
app.get('/episode/:episodeid', routes.episode);
app.get('/channel_images/:image_id', routes_images.channel_images);

app.get('/json/episodes/recent', routes_json.recentEpisodes);
app.get('/json/channels/:id', routes_json.channel);
app.get('/json/channels', routes_json.channels);

http.createServer(app).listen(app.get('port'), function() {
    console.log('Express server listening on port ' + app.get('port'));

    mongoose.connect(config.mongoURL);

    mongoose.connection.on('error', function(err) {
        console.error('Could not connect to mongo server!');
        console.error(err);
        throw err;
    });

});
