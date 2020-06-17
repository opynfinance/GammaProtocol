# extract-comments [![NPM version](https://img.shields.io/npm/v/extract-comments.svg?style=flat)](https://www.npmjs.com/package/extract-comments) [![NPM monthly downloads](https://img.shields.io/npm/dm/extract-comments.svg?style=flat)](https://npmjs.org/package/extract-comments) [![NPM total downloads](https://img.shields.io/npm/dt/extract-comments.svg?style=flat)](https://npmjs.org/package/extract-comments) [![Linux Build Status](https://img.shields.io/travis/jonschlinkert/extract-comments.svg?style=flat&label=Travis)](https://travis-ci.org/jonschlinkert/extract-comments)

> Uses esprima to extract line and block comments from a string of JavaScript. Also optionally parses code context (the next line of code after a comment).

Please consider following this project's author, [Jon Schlinkert](https://github.com/jonschlinkert), and consider starring the project to show your :heart: and support.

## Install

Install with [npm](https://www.npmjs.com/):

```sh
$ npm install --save extract-comments
```

## Usage

```js
var extract = require('extract-comments');

// pass a string of JavaScript
extract(string);
```

**Example**

```js
var str = '/**\n * this is\n *\n * a comment\n*/\n\n\nvar foo = "bar";\n';
var comments = extract(str);
console.log(comments);

[{
  type: 'block',
  raw: '/**\n * this is\n *\n * a comment\n*/',
  value: 'this is\na comment',
  loc: { start: { line: 1, column: 0 }, end: { line: 5, column: 33 } },
  code:
   { line: 7,
     loc: { start: { line: 7, column: 36 }, end: { line: 7, column: 52 } },
     value: 'var foo = "bar";' }
```

## Extractors

By default, [esprima](http://esprima.org) is used for extracting comments. This can easily be changed by passing a function to `options.extractor`.

**The easy way**

Use a published module, such as:

* [babel-extract-comments](https://github.com/jonschlinkert/babel-extract-comments)
* [esprima-extract-comments](https://github.com/jonschlinkert/esprima-extract-comments)
* [espree-extract-comments](https://github.com/jonschlinkert/espree-extract-comments)

Example:

```js
extract(str, {extractor: require('babel-extract-comments')});
```

If you create a compatible extractor, feel free to do pr [or create an issue](https://github.com/jonschlinkert/extract-comments/issues/new) to add it to the readme!

**Roll your own**

```js
extract(str, {
  extractor: function(str) {
    // must return an array of tokens with:
    // - type: 'Block', 'CommentBlock', 'Line' or 'CommentLine'
    // - value: the comment inner string
    // - loc: with `start` and `end` line and column
    // example:
    return [
      { 
        type: 'Block',
        {start: { line: 1, column: 0 },
          end: { line: 5, column: 33 }},
        value: ' this is a comment string '
      }
    ];
  }
});
```

## API

### [extract](index.js#L26)

Extract comments from the given `string`.

**Params**

* `string` **{String}**
* `options` **{Object}**: Pass `first: true` to return after the first comment is found.
* `tranformFn` **{Function}**: (optional) Tranform function to modify each comment
* `returns` **{Array}**: Returns an array of comment objects

**Example**

```js
const extract = require('extract-comments');
console.log(extract(string, options));
```

### [.block](index.js#L44)

Extract block comments from the given `string`.

**Params**

* `string` **{String}**
* `options` **{Object}**: Pass `first: true` to return after the first comment is found.
* `returns` **{String}**

**Example**

```js
console.log(extract.block(string, options));
```

### [.line](index.js#L61)

Extract line comments from the given `string`.

**Params**

* `string` **{String}**
* `options` **{Object}**: Pass `first: true` to return after the first comment is found.
* `returns` **{String}**

**Example**

```js
console.log(extract.line(string, options));
```

### [.first](index.js#L78)

Extract the first comment from the given `string`.

**Params**

* `string` **{String}**
* `options` **{Object}**: Pass `first: true` to return after the first comment is found.
* `returns` **{String}**

**Example**

```js
console.log(extract.first(string, options));
```

## Release history

**v0.10.0**

* Parsing is now handled by esprima, so only JavaScript can be parsed. I'm working on parsers for other languages and will cross-link those here when they're pushed up.
* Breaking change: since parsing is now done by esprima, on both the line and block comment objects, the `loc.start.pos` and `loc.end.pos` properties have been renamed to `loc.start.column` and `loc.end.column`.

**v0.9.0**

* Breaking change: `lines` property was removed from `Block` comments, since this can easily be done by splitting `value`

## About

<details>
<summary><strong>Contributing</strong></summary>

Pull requests and stars are always welcome. For bugs and feature requests, [please create an issue](../../issues/new).

</details>

<details>
<summary><strong>Running Tests</strong></summary>

Running and reviewing unit tests is a great way to get familiarized with a library and its API. You can install dependencies and run tests with the following command:

```sh
$ npm install && npm test
```

</details>

<details>
<summary><strong>Building docs</strong></summary>

_(This project's readme.md is generated by [verb](https://github.com/verbose/verb-generate-readme), please don't edit the readme directly. Any changes to the readme must be made in the [.verb.md](.verb.md) readme template.)_

To generate the readme, run the following command:

```sh
$ npm install -g verbose/verb#dev verb-generate-readme && verb
```

</details>

### Related projects

You might also be interested in these projects:

* [babel-extract-comments](https://www.npmjs.com/package/babel-extract-comments): Uses babel (babylon) to extract JavaScript code comments from a JavaScript string or file. | [homepage](https://github.com/jonschlinkert/babel-extract-comments "Uses babel (babylon) to extract JavaScript code comments from a JavaScript string or file.")
* [code-context](https://www.npmjs.com/package/code-context): Parse a string of javascript to determine the context for functions, variables and comments based… [more](https://github.com/jonschlinkert/code-context) | [homepage](https://github.com/jonschlinkert/code-context "Parse a string of javascript to determine the context for functions, variables and comments based on the code that follows.")
* [espree-extract-comments](https://www.npmjs.com/package/espree-extract-comments): Uses espree to extract JavaScript code comments from a string. Returns an array of comment… [more](https://github.com/jonschlinkert/espree-extract-comments) | [homepage](https://github.com/jonschlinkert/espree-extract-comments "Uses espree to extract JavaScript code comments from a string. Returns an array of comment objects, with line, column, index, comment type and comment string.")
* [esprima-extract-comments](https://www.npmjs.com/package/esprima-extract-comments): Extract code comments from string or from a glob of files using esprima. | [homepage](https://github.com/jonschlinkert/esprima-extract-comments "Extract code comments from string or from a glob of files using esprima.")
* [parse-comments](https://www.npmjs.com/package/parse-comments): Parse code comments from JavaScript or any language that uses the same format. | [homepage](https://github.com/jonschlinkert/parse-comments "Parse code comments from JavaScript or any language that uses the same format.")

### Contributors

| **Commits** | **Contributor** | 
| --- | --- |
| 93 | [jonschlinkert](https://github.com/jonschlinkert) |
| 3 | [cazzer](https://github.com/cazzer) |
| 1 | [architectcodes](https://github.com/architectcodes) |

### Author

**Jon Schlinkert**

* [linkedin/in/jonschlinkert](https://linkedin.com/in/jonschlinkert)
* [github/jonschlinkert](https://github.com/jonschlinkert)
* [twitter/jonschlinkert](https://twitter.com/jonschlinkert)

### License

Copyright © 2018, [Jon Schlinkert](https://github.com/jonschlinkert).
Released under the [MIT License](LICENSE).

***

_This file was generated by [verb-generate-readme](https://github.com/verbose/verb-generate-readme), v0.6.0, on February 12, 2018._