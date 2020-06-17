'use strict';

/**
 * Create a new LineComment.
 *
 * @param {String} `str` string of JavaScript
 * @param {Object} `token` Parsed AST token
 */

class LineComment {
  constructor(str, token) {
    Object.assign(this, token);
    this.range = token.range || [token.start, token.end];
    this.raw = token.value;
    this.value = this.raw.trim();
  }
}

/**
 * expose `LineComment`
 */

module.exports = LineComment;
