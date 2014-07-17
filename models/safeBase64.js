var _ = require('lodash');

var makeSafeBase64 = {};

makeSafeBase64.makeSafeFromString = function(id) {
    return makeSafeBase64.URIEncode(new Buffer(
            id
        ).toString('base64'),
        makeSafeBase64.unsafeChars,
        makeSafeBase64.safeChars);
};

makeSafeBase64.makeStringFromSafe = function(link) {
    return new Buffer(
        makeSafeBase64.URIEncode(link, makeSafeBase64.safeChars, makeSafeBase64.unsafeChars),
        'base64'
    ).toString('ascii');
};

makeSafeBase64.unsafeChars = ['/', '+'];
makeSafeBase64.safeChars = ['-', '_'];

makeSafeBase64.URIEncode = function(transformingString, from, to) {
    _.forEach(from, function(char, index) {
        transformingString = transformingString.replace(
            char,
            to[index]
        );
    });

    transformingString = transformingString.replace(/=/g, '');

    return transformingString;
};

module.exports = makeSafeBase64;