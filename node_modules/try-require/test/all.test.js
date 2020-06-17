"use strict";

var assert = require( 'assert' );
var tryRequire = require( '../index' );

describe( 'try-require', function() {

    it( 'should return an object for async module', function() {
        assert.equal( typeof tryRequire( 'async' ), 'object' );
    } );

    it( 'should return null for last error', function() {
        assert.equal( tryRequire.lastError(), null );
    } );

    it( 'should return path for async module', function() {
        assert.equal( typeof tryRequire.resolve( 'async' ), 'string' );
    } );

    it( 'should still return null for last error', function() {
        assert.equal( tryRequire.lastError(), null );
    } );

    it( 'should return undefined for request module', function() {
        assert.equal( typeof tryRequire( 'request' ), 'undefined' );
    } );

    it( 'should have set last error', function() {
        assert.deepEqual( tryRequire.lastError(), { code: "MODULE_NOT_FOUND" } );
    } );

    it( 'should return undefined path for request module', function() {
        assert.equal( typeof tryRequire.resolve( 'request' ), 'undefined' );
    } );

    it( 'should have set last error', function() {
        assert.deepEqual( tryRequire.lastError(), { code: "MODULE_NOT_FOUND" } );
    } );

    it( 'should return null for last error again after success call', function() {

        tryRequire( 'async' ); // the success

        assert.strictEqual( tryRequire.lastError(), null );
    } );

} );