/*
    TODO: this is getting to be a real flimsy mock,
    turn this in to something that you can construct, i.e. 
    you should be able to mix and match which components should go
    in to the mock. If you only need to test findOne then only include 
    it, etc.
 */

function db() {
    this.collection = function ( collection ) {
        return this.collections[collection];
    };
    this.collections = {
        'channels' : {
            'saved' : [],
            findOne : function ( query, cb ) {
                if ( query.title ==  "in collection") {
                    if (cb) return cb( null, true ); 
                } else if ( query.title == "title returns error" ) {
                    if (cb) return cb( new Error("fake database error") , null);
                } else {
                    if (cb) return cb( null, null );
                }
            },
            find : function ( query, fields, cb ) {
                if ( query.title ==  "in collection") {
                    if (cb) return cb( null, true ); 
                } else if ( query.title == "title returns error" ) {
                    if (cb) return cb( new Error("fake database error") , null);
                } else {
                    if (cb) cb( null, null );
                    return {
                        toArray: function(cb) {
                            return cb(null, [true]);
                        }
                    };
                }
            },
            save : function( json, cb) {
                if ( typeof json !== 'object' ) {
                    if (cb) return cb(new Error("Not an object"));
                }
                if (json.title == "title returns error") {
                    if (cb) return cb( new Error("fake database error") , null);
                }
                this.saved.push( json );
            }
        },
        'episodes' : {
            'saved' : [],
            save : function( json, cb) {
                if ( typeof json !== 'object' ) {
                    if (cb) return cb(new Error("Not an object"));
                }
                if (json.title == "title returns error") {
                    if (cb) return cb( new Error("fake database error") , null);
                }
                this.saved.push( json );
            },
            find : function ( query, fields, cb ) {
                if ( query._id ==  "in collection") {
                    if (cb) return cb( null, true ); 
                } else if ( query.title == "title returns error" ) {
                    if (cb) return cb( new Error("fake database error") , null);
                } else {
                    if (cb) cb( null, null );
                    return {
                        toArray: function(cb) {
                            return cb(null, [true]);
                        }
                    };
                }
            },
            findOne : function ( query, cb ) {
                if ( query._id ==  "in collection") {
                    if (cb) return cb( null, true ); 
                } else if ( query.title == "title returns error" ) {
                    if (cb) return cb( new Error("fake database error") , null);
                } else {
                    if (cb) cb( null, null );
                    return {
                        toArray: function(cb) {
                            return cb(null, [true]);
                        }
                    };
                }
            }
        }
    };
}

module.exports = db;