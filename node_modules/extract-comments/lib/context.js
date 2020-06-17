'use strict';

const codeContext = require('parse-code-context');

/**
 * Get the code context for the given comment.
 *
 * @param {String} `str` string of JavaScript
 * @param {Object} `comment` Block comment instance
 */

class Context {
  constructor(str, comment, nextComment, options) {
    this.context = {};
    this.value = '';
    this.range = [comment.codeStart || 0];

    if (options.context === false) {
      return;
    }

    /**
     * Loop until we get to a non-whitespace, non-newline character
     * If codeContext returns a parsed object, it's used as context,
     * otherwise we assume that no code follows the comment.
     */

    let begin = comment.range[1];
    let end = nextComment ? nextComment.range[0] : str.length;

    let after = str.slice(begin, end);
    let lineno = comment.loc.end.line;;
    let col = 0;

    if (after[0] === '\n') {
      after = after.slice(1);
    } else {
      col = comment.loc.end.column;
    }

    let lines = after.split('\n');
    let rangeStart = begin;
    let rangeEnd = begin;
    let append = 0;

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      append += 1;
      lineno++;

      if (line && !/^\s+/.test(line)) {
        this.context = codeContext(line);
        this.value = line;
        break;
      }

      append += line.length;
    }

    /**
     * Create location object
     */

    rangeStart += append;
    rangeEnd += append + this.value.length;
    this.range = [rangeStart, rangeEnd];

    this.loc = {
      start: {
        line: lineno,
        column: col
      },
      end: {
        line: lineno,
        column: col + this.value.length
      }
    };
  }
}

/**
 * Expose `Context`
 */

module.exports = Context;
