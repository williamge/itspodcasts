/**
 * Module dependencies.
 */

var express = require('express');

var routes = require('./routes');
routes.images = require('./routes/images');

var config = require('./config');

var http = require('http');
var path = require('path');

var mongoose = require('mongoose');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
    app.use(express.errorHandler());
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
app.get('/channel_images/:image_id', routes.images.channel_images);

app.get('/json/episodes/recent', routes.recentEpisodes);

http.createServer(app).listen(app.get('port'), function() {
    console.log('Express server listening on port ' + app.get('port'));

    mongoose.connect(config.mongoURL);

    mongoose.connection.on('error', function(err) {
        console.error('Could not connect to mongo server!');
        console.error(err);
        throw err;
    });

});
