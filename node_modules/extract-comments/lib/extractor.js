/*!
 * extract-comments <https://github.com/jonschlinkert/extract-comments>
 *
 * Copyright (c) 2014-present Jon Schlinkert.
 * Licensed under the MIT license.
 */

'use strict';

const esprima = require('esprima-extract-comments');
const BlockComment = require('./block');
const LineComment = require('./line');
const Context = require('./context');

/**
 * If you need to customize the generated comment objects, you
 * can create an instance of `Extractor`:
 *
 * ```js
 * const extract = require('extract-comments');
 * const Extractor = extract.Extractor;
 * const comments = new Extractor(options);
 * ```
 * @param {String} `string`
 * @param {Object} `options`
 * @param {Object} `options.first` Return the first comment only
 * @param {Object} `options.banner` alias for `options.first`
 * @param {Function} `fn` Optionally pass a transform function to call on each token (comment) in the AST.
 * @return {String}
 * @api public
 */

class Extractor {
  constructor(options, fn) {
    if (typeof options === 'function') {
      fn = options;
      options = {};
    }

    this.options = Object.assign({ transform: fn }, options);
  }

  extract(str) {
    if (typeof str !== 'string') {
      throw new TypeError('expected a string');
    }

    const opts = Object.assign({ keepProtected: true }, this.options);
    const extract = opts.extractor || esprima;
    const tokens = extract(str, opts);
    const comments = [];

    let filter = opts.filter;
    let keep = opts.stripProtected === true ? false : opts.keepProtected === true;

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      const nextToken = tokens[i + 1];

      if (typeof filter === 'function' && filter(token) === false) {
        continue;
      }

      if (/^\*?!/.test(token.value) && keep === false) {
        continue;
      }

      const comment = toComment(str, token, nextToken, opts);
      if (comment) comments.push(comment);

      if ((opts.first || opts.banner) && comments.length === 1) {
        break;
      }
    }

    return comments;
  }
}

function toComment(str, token, nextToken, options) {
  if (typeof options.transform === 'function') {
    token = options.transform(token, options) || token;
  }

  if (isBlock(token.type) && options.block !== false) {
    let comment = new BlockComment(str, token, options);
    if (nextToken) nextToken = toComment(str, nextToken, null, options);

    comment.code = new Context(str, comment, nextToken, options);
    return comment;
  }

  if (isLine(token.type) && options.line !== false) {
    return new LineComment(str, token, options);
  }
}

function isLine(type) {
  return type === 'Line' || type === 'CommentLine' || type === 'LineComment';
}

function isBlock(type) {
  return type === 'Block' || type === 'CommentBlock' || type === 'BlockComment';
}

/**
 * Expose `Extractor` constructor
 */

module.exports = Extractor;
