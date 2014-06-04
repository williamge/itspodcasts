module.exports = function( db ) {

    var Episode = function(channelID, title, link, description, guid  ) {
        this.channel = channelID;
        this.title = title;
        this.link = link;
        this.description = description;
        if (guid) {
            this.guid = guid;
        } else {
            console.log(title);
        }
    };

    Episode.jsonEpisode = function( episode ) {
        var json = {
            channel: episode.channel,
            title: episode.title,
            link: episode.link,
            description: episode.description,
            _id: episode.getID()
        };
        if (episode.guid) {
            json.guid = episode.guid;
        }
        return json;
    };

    Episode.prototype.getID = function() {
        return this.guid || this.link;
    };

    Episode.save = function( episode, callback ) {

        //TODO: there's gotta be a better way of doing this, this is kinda silly
        if ( Function.prototype.toString.call(episode.constructor) != Function.prototype.toString.call(Episode)  ){
            if (callback) return callback( new TypeError('"episode" is not an Episode object') );
        }

        var collection = db.collection('episodes');
        collection.save( Episode.jsonEpisode( episode ), 
            function( err, inserted ) {
                if (callback) return callback(err, inserted);
            }  
        );

    };

    return Episode;
};