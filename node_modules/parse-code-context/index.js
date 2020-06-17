'use strict';

/**
 * Create an instance of `Parser` with
 * the given `string`, optionally passing
 * a `parent` name for namespacing methods
 *
 * ```js
 * const { Parser } = require('parse-code-context');
 * const parser = new Parser('function foo(a, b, c) {}');
 * ```
 * @name Parser
 * @param {String} `str`
 * @param {String} `parent`
 * @api public
 */

class Parser {
  constructor(parent) {
    this.parent = parent;
    this.fns = [];
    this.init();
  }

  /**
   * Convenience method for creating a property name
   * that is prefixed with the parent namespace, if defined.
   *
   * @name .name
   * @param {String} `name`
   * @return {String}
   * @api public
   */

  name(name) {
    return this.parent ? this.parent + (name || '') : '';
  }

  /**
   * Register a parser to use (in addition to those already
   * registered as default parsers) with the given `regex` and
   * function.
   *
   * ```js
   * const parser = new Parser('function foo(a, b, c){}');
   *   .capture(/function\s*([\w$]+)\s*\(([^)]+)/, (match) => {
   *     return {
   *        name: match[1],
   *        params: matc(h[2] || '').split(/[,\s]/)
   *     };
   *   });
   * ```
   * @name .capture
   * @param {RegExp} `regex`
   * @param {Function} `fn`
   * @return {Object} The instance for chaining
   * @api public
   */

  capture(regex, fn) {
    this.fns.push({ regex, fn });
    return this;
  }

  /**
   * Parse the string passed to the constructor with all registered parsers.
   *
   * @name .parse
   * @return {Object|Null}
   * @api public
   */

  parse(str, parent) {
    this.parent = parent || this.parent;
    for (let parser of this.fns) {
      let re = parser.regex;
      let fn = parser.fn;
      let match = re.exec(str);
      if (match) {
        let ctx = fn.call(this, match, this.parent);
        if (ctx) {
          ctx.match = match;
          this.value = ctx;
          return ctx;
        }
      }
    }
  }

  init() {
    // module.exports method
    this.capture(/^(module\.exports)\s*=\s*function\s*\(([^)]+)/, (m, parent) => {
      return {
        type: 'method',
        receiver: m[1],
        name: '',
        params: params(m[2]),
        string: m[1] + '.' + m[2] + '()'
      };
    });

    this.capture(/^(module\.exports)\s*=\s*function\s([\w$]+)\s*\(([^)]+)/, (m, parent) => {
      return {
        type: 'function',
        subtype: 'expression',
        receiver: m[1],
        name: m[2],
        params: params(m[3]),
        string: m[2] + '()'
      };
    });

    // class, possibly exported by name or as a default
    this.capture(/^\s*(export(\s+default)?\s+)?class\s+([\w$]+)(\s+extends\s+([\w$.]+(?:\(.*\))?))?\s*{/, (m, parent) => {
      return {
        type: 'class',
        ctor: m[3],
        name: m[3],
        extends: m[5],
        string: 'new ' + m[3] + '()'
      };
    });

    // class constructor
    this.capture(/^\s*constructor\s*\(([^)]+)/, (m, parent) => {
      return {
        type: 'constructor',
        ctor: this.parent,
        name: 'constructor',
        params: params(m[4]),
        string: this.name('.prototype.') + 'constructor()'
      };
    });

    // class method
    this.capture(/^\s*(static)?\s*(\*?)\s*(\[Symbol\.[^\]]+\]|[\w$]+|\[.*\])\s*\(([^)]*)/, (m, parent) => {
      return {
        type: 'method',
        ctor: this.parent,
        name: m[2] + m[3],
        params: params(m[4]),
        static: m[1] === 'static',
        generator: m[2] === '*',
        string: this.name(m[1] ? '.' : '.prototype.') + m[2] + m[3] + '()'
      };
    });

    // named function statement, possibly exported by name or as a default
    this.capture(/^\s*(export(\s+default)?\s+)?function\s+([\w$]+)\s*\(([^)]+)/, (m, parent) => {
      return {
        type: 'function',
        subtype: 'statement',
        name: m[3],
        params: params(m[4]),
        string: m[3] + '()'
      };
    });

    // anonymous function expression exported as a default
    this.capture(/^\s*export\s+default\s+function\s*\(([^)]+)/, (m, parent) => {
      return {
        type: 'function',
        name: m[1], // undefined
        params: params(m[4]),
        string: m[1] + '()'
      };
    });

    // function expression
    this.capture(/^return\s+function(?:\s+([\w$]+))?\s*\(([^)]+)/, (m, parent) => {
      return {
        type: 'function',
        subtype: 'expression',
        name: m[1],
        params: params(m[4]),
        string: m[1] + '()'
      };
    });

    // function expression
    this.capture(/^\s*(?:const|let|var)\s+([\w$]+)\s*=\s*function\s*\(([^)]+)/, (m, parent) => {
      return {
        type: 'function',
        subtype: 'expression',
        name: m[1],
        params: params(m[2]),
        string: (m[1] || '') + '()'
      };
    });

    // prototype method
    this.capture(/^\s*([\w$.]+)\s*\.\s*prototype\s*\.\s*([\w$]+)\s*=\s*function\s*\(([^)]+)/, (m, parent) => {
      return {
        type: 'prototype method',
        category: 'method',
        ctor: m[1],
        name: m[2],
        params: params(m[3]),
        string: m[1] + '.prototype.' + m[2] + '()'
      };
    });

    // prototype property
    this.capture(/^\s*([\w$.]+)\s*\.\s*prototype\s*\.\s*([\w$]+)\s*=\s*([^\n;]+)/, (m, parent) => {
      return {
        type: 'prototype property',
        ctor: m[1],
        name: m[2],
        value: trim(m[3]),
        string: m[1] + '.prototype.' + m[2]
      };
    });

    // prototype property without assignment
    this.capture(/^\s*([\w$]+)\s*\.\s*prototype\s*\.\s*([\w$]+)\s*/, (m, parent) => {
      return {
        type: 'prototype property',
        ctor: m[1],
        name: m[2],
        string: m[1] + '.prototype.' + m[2]
      };
    });

    // inline prototype
    this.capture(/^\s*([\w$.]+)\s*\.\s*prototype\s*=\s*{/, (m, parent) => {
      return {
        type: 'prototype',
        ctor: m[1],
        name: m[1],
        string: m[1] + '.prototype'
      };
    });

    // Fat arrow function
    this.capture(/^\s*\(*\s*([\w$.]+)\s*\)*\s*=>/, (m, parent) => {
      return {
        type: 'function',
        ctor: this.parent,
        name: m[1],
        string: this.name('.prototype.') + m[1] + '()'
      };
    });

    // inline method
    this.capture(/^\s*([\w$.]+)\s*:\s*function\s*\(([^)]+)/, (m, parent) => {
      return {
        type: 'method',
        ctor: this.parent,
        name: m[1],
        string: this.name('.prototype.') + m[1] + '()'
      };
    });

    // inline property
    this.capture(/^\s*([\w$.]+)\s*:\s*([^\n;]+)/, (m, parent) => {
      return {
        type: 'property',
        ctor: this.parent,
        name: m[1],
        value: trim(m[2]),
        string: this.name('.') + m[1]
      };
    });

    // inline getter/setter
    this.capture(/^\s*(get|set)\s*([\w$.]+)\s*\(([^)]+)/, (m, parent) => {
      return {
        type: 'property',
        ctor: this.parent,
        name: m[2],
        string: this.name('.prototype.') + m[2]
      };
    });

    // method
    this.capture(/^\s*([\w$.]+)\s*\.\s*([\w$]+)\s*=\s*function\s*\(([^)]+)/, (m, parent) => {
      return {
        type: 'method',
        receiver: m[1],
        name: m[2],
        params: params(m[3]),
        string: m[1] + '.' + m[2] + '()'
      };
    });

    // property
    this.capture(/^\s*([\w$.]+)\s*\.\s*([\w$]+)\s*=\s*([^\n;]+)/, (m, parent) => {
      return {
        type: 'property',
        receiver: m[1],
        name: m[2],
        value: trim(m[3]),
        string: m[1] + '.' + m[2]
      };
    });

    // declaration
    this.capture(/^\s*(?:const|let|var)\s+([\w$]+)\s*=\s*([^\n;]+)/, (m, parent) => {
      return {
        type: 'declaration',
        name: m[1],
        value: trim(m[2]),
        string: m[1]
      };
    });
  }
}

function params(val) {
  return trim(val).split(/[\s,]+/);
}

function trim(str) {
  return toString(str).trim();
}

function toString(str) {
  return str ? str.toString() : '';
}

/**
 * Expose `parse`
 */

const parse = (str, options) => {
  let parser = new Parser(options);
  return parser.parse(str);
};

parse.Parser = Parser;
module.exports = parse;
