"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Geth compatible DB keys
var headsKey = 'heads';
exports.headsKey = headsKey;
/**
 * Current canonical head for light sync
 */
var headHeaderKey = 'LastHeader';
exports.headHeaderKey = headHeaderKey;
/**
 * Current canonical head for full sync
 */
var headBlockKey = 'LastBlock';
exports.headBlockKey = headBlockKey;
/**
 * headerPrefix + number + hash -> header
 */
var headerPrefix = Buffer.from('h');
/**
 * headerPrefix + number + hash + tdSuffix -> td
 */
var tdSuffix = Buffer.from('t');
/**
 * headerPrefix + number + numSuffix -> hash
 */
var numSuffix = Buffer.from('n');
/**
 * blockHashPrefix + hash -> number
 */
var blockHashPrefix = Buffer.from('H');
/**
 * bodyPrefix + number + hash -> block body
 */
var bodyPrefix = Buffer.from('b');
// Utility functions
/**
 * Convert BN to big endian Buffer
 */
var bufBE8 = function (n) { return n.toArrayLike(Buffer, 'be', 8); };
exports.bufBE8 = bufBE8;
var tdKey = function (n, hash) { return Buffer.concat([headerPrefix, bufBE8(n), hash, tdSuffix]); };
exports.tdKey = tdKey;
var headerKey = function (n, hash) { return Buffer.concat([headerPrefix, bufBE8(n), hash]); };
exports.headerKey = headerKey;
var bodyKey = function (n, hash) { return Buffer.concat([bodyPrefix, bufBE8(n), hash]); };
exports.bodyKey = bodyKey;
var numberToHashKey = function (n) { return Buffer.concat([headerPrefix, bufBE8(n), numSuffix]); };
exports.numberToHashKey = numberToHashKey;
var hashToNumberKey = function (hash) { return Buffer.concat([blockHashPrefix, hash]); };
exports.hashToNumberKey = hashToNumberKey;
//# sourceMappingURL=util.js.map