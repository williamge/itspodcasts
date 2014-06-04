var xml2js = require('xml2js'),
    parseString = xml2js.parseString;

module.exports = function( Channel ) {

    /**
     * 
     * @param  {XML-DOM object corresponding to an 'item' element from an RSS feed} element
     * @return {Episode}
     */
    function scrapeEpisode ( element ) {
        return {
            title: element.title[0],
            link: element.link[0],
            description: ( element.description[0]._ || element.description[0] ),
            guid: ( element.guid[0]._ || element.guid[0] )
        };
    }

    /**
     * 
     * @param  {XML-DOM object corresponding to a 'channel' element from an RSS feed}   element
     * @param  {Function} callback [to be called after element is turned in to a Channel]  
     */
    function scrapeChannel ( element, callback ) {
        Channel.find( element.title[0], function elementResult(err, channel) {
            if (!channel) {
                channel = new Channel( element.title[0] );
            }

            var episodes = element.item;

            episodes.forEach( function( element, index, array ) {
                var episode = scrapeEpisode( element);
                channel.addEpisode(  
                    episode.title,
                    episode.link,
                    episode.description,
                    episode.guid
                );
            } );

            callback( err, channel );
        } );
    }

    function scrapeSource ( data, callback ) {
        var channelList = [];
        var channelScrapers = 0;
        xml2js.parseString( data, function( err, result ) {
            if (err) {
                return callback(err);
            } else {
                result.rss.channel.forEach( function( element, index, array ) {

                    channelScrapers++;

                    scrapeChannel( element, function withChannel( err, channel) {
                        channelList.push( channel );
                        channelScrapers--;
                        if (channelScrapers === 0) {
                            return callback(err, channelList );
                        }
                    } );
                } );
            }
        });
    }

    return {
        scrapeEpisode : scrapeEpisode,
        scrapeChannel : scrapeChannel,
        scrapeSource : scrapeSource
    };
};