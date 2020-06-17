/*!
 * esprima-extract-comments <https://github.com/jonschlinkert/esprima-extract-comments>
 *
 * Copyright (c) 2014-2018, Jon Schlinkert.
 * Released under the MIT License.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const esprima = require('esprima');

/**
 * Extract line and block comments from a string of JavaScript.
 *
 * ```js
 * console.log(extract('// this is a line comment'));
 * // [ { type: 'Line',
 * //     value: ' this is a line comment',
 * //     range: [ 0, 25 ],
 * //     loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 25 } } } ]
 * ```
 * @param  {String} `string`
 * @param  {Object} `options` Options to pass to [esprima][].
 * @return {Array} Array of code comment objects.
 * @api public
 */

function extract(str, options) {
  const defaults = { tolerant: true, comment: true, tokens: true, range: true, loc: true };
  const tokens = esprima.tokenize(str, Object.assign({}, defaults, options));
  const comments = [];

  for (let i = 0; i < tokens.length; i++) {
    let n = i + 1;
    const token = tokens[i];
    let next = tokens[n];

    if (isComment(token)) {
      if (token.type === 'BlockComment') {
        while (next && /comment/i.test(next.type)) next = tokens[++n];
        token.codeStart = next && !/(comment|punc)/i.test(next.type) ? next.range[0] : null;
      }
      comments.push(token);
    }
  }
  return comments;
}

/**
 * Extract code comments from a JavaScript file.
 *
 * ```js
 * console.log(extract.file('some-file.js'), { cwd: 'some/path' });
 * // [ { type: 'Line',
 * //     value: ' this is a line comment',
 * //     range: [ 0, 25 ],
 * //     loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 25 } } } ]
 * ```
 * @param  {String} `file` Filepath to the file to parse.
 * @param  {Object} `options` Options to pass to [esprima][].
 * @return {Array} Array of code comment objects.
 * @api public
 */

extract.file = function(file, options) {
  const opts = Object.assign({ cwd: process.cwd() }, options);
  const str = fs.readFileSync(path.resolve(opts.cwd, file), 'utf8');
  return extract(str, options);
};

/**
 * Returns true if `token` is a valid comment token
 */

function isComment(token) {
  return token.type === 'LineComment' || token.type === 'BlockComment';
}

/**
 * Expose `extract`
 */

module.exports = extract;
