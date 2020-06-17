'use strict';

const utils = require('./utils');
const LineComment = require('./line');

/**
 * Create a new BlockComment
 *
 * @param {String} `str` string of JavaScript
 * @param {Object} `token` Parsed AST token
 */

class BlockComment extends LineComment {
  constructor(str, token) {
    super(str, token);
    this.value = utils.stripStars(this.raw);
  }
}

/**
 * expose `BlockComment`
 */

module.exports = BlockComment;
