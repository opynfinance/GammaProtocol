'use strict';

var lastError = null;

var tryRequire = function tryRequire( id, req ) {
    var path;
    var _req = req || require;

    try {
        path = _req.resolve( id );

        lastError = null;
    } catch ( e ) {
        lastError = e;
    }

    if ( path ) {
        return _req( path );
    }

    return undefined;
};

var resolve = function tryRequireResolve( id, req ) {
    var path;
    var _req = req || require;

    try {
        path = _req.resolve( id );

        lastError = null;
    } catch ( e ) {
        lastError = e;
    }

    return path;
};

tryRequire.resolve = resolve;
tryRequire.lastError = function() {
    return lastError;
};

module.exports = tryRequire;
