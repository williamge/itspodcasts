module.exports = function( db ) {

    var Episode = require('./Episode')(db);

    var Channel = function( title ) {
        this.title = title;

        this.episodeIDs = {};

        //this list will only be populated locally, 
        //even if values are present in the database
        this.localEpisodes = [];
    }; 

    Channel.jsonChannel = function( channel ) {
        return {
            _id: channel.getID(),
            title: channel.title,
           episodes: channel.episodeIDs
        };
    };

    Channel.prototype.getID = function() {
        return this.title;
    };

    Channel.save = function( channel, callback ) {

        //TODO: there's gotta be a better way of doing this, this is kinda silly
        if ( Function.prototype.toString.call(channel.constructor) != Function.prototype.toString.call(Channel) ) {
            if (callback) return callback( new TypeError('"channel" is not a Channel object') );
        }

        var collection = db.collection('channels');
        collection.save( Channel.jsonChannel( channel ),
            function( err, inserted ) {
                if (err) {
                    if (callback) return callback( err );
                }
            }  
        );

    };

    Channel.find = function( title, callback ) {

        if (!callback) {
            callback = function(err){ if (err) throw err; };
        }

        if (!title) {
            return callback( new TypeError('"title" is not a valid parameter') , undefined);
        }

        var channelsCollection = db.collection('channels'),
            episodesCollection = db.collection('episodes');
        var storedChannel = channelsCollection.findOne( { title: title},
            function returnChannel(err, data) {
                if (!data) {
                    return callback(err, data);
                }
                var channel = new Channel();
                for (var property in data) {
                    channel[property] = data[property];
                }
                (function findEpisodeIDs( channelID, IDcallback ) {
                    episodesCollection.find( 
                        {
                            channel: channelID
                        },
                        {
                            "_id": true
                        }
                    ).toArray( IDcallback );
                })( data._id, function storeIDsList(err, IDs ) {
                    if (err) {
                        return callback(err, channel);
                    }

                    IDs.forEach( function(element) {
                        channel.episodeIDs[element._id] = null;
                    } );              
                    return callback(err, channel);
                });
            }
        );
    };

    Channel.prototype.addEpisode = function ( episode ) {

        //DELETE: this.episodeIDs.push( episode.getID() );
        this.localEpisodes.push( episode );
    };

    return Channel;
};