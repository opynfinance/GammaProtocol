/*!
 * extract-comments <https://github.com/jonschlinkert/extract-comments>
 *
 * Copyright (c) 2014-present, Jon Schlinkert.
 * Released under the MIT License.
 */

'use strict';

const Extractor = require('./lib/extractor');

/**
 * Extract comments from the given `string`.
 *
 * ```js
 * const extract = require('extract-comments');
 * console.log(extract(string, options));
 * ```
 * @param {String} `string`
 * @param {Object} `options` Pass `first: true` to return after the first comment is found.
 * @param {Function} `tranformFn` (optional) Tranform function to modify each comment
 * @return {Array} Returns an array of comment objects
 * @api public
 */

function extract(str, options, tranformFn) {
  let extractor = new Extractor(options, tranformFn);
  return extractor.extract(str);
}

/**
 * Extract block comments from the given `string`.
 *
 * ```js
 * console.log(extract.block(string, options));
 * ```
 * @name .block
 * @param {String} `string`
 * @param {Object} `options` Pass `first: true` to return after the first comment is found.
 * @return {String}
 * @api public
 */

extract.block = (str, options) => {
  return extract(str, Object.assign({}, options, { line: false }));
};

/**
 * Extract line comments from the given `string`.
 *
 * ```js
 * console.log(extract.line(string, options));
 * ```
 * @name .line
 * @param {String} `string`
 * @param {Object} `options` Pass `first: true` to return after the first comment is found.
 * @return {String}
 * @api public
 */

extract.line = (str, options) => {
  return extract(str, Object.assign({}, options, { block: false }));
};

/**
 * Extract the first comment from the given `string`.
 *
 * ```js
 * console.log(extract.first(string, options));
 * ```
 * @name .first
 * @param {String} `string`
 * @param {Object} `options` Pass `first: true` to return after the first comment is found.
 * @return {String}
 * @api public
 */

extract.first = (str, options) => {
  return extract(str, Object.assign({}, options, { first: true }));
};

/**
 * Expose `Extractor` constructor, to
 * allow custom plugins to be registered.
 */

extract.Extractor = Extractor;

/**
 * Expose `extract`
 */

module.exports = extract;
