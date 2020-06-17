# parse-code-context [![NPM version](https://img.shields.io/npm/v/parse-code-context.svg?style=flat)](https://www.npmjs.com/package/parse-code-context) [![NPM monthly downloads](https://img.shields.io/npm/dm/parse-code-context.svg?style=flat)](https://npmjs.org/package/parse-code-context) [![NPM total downloads](https://img.shields.io/npm/dt/parse-code-context.svg?style=flat)](https://npmjs.org/package/parse-code-context) [![Linux Build Status](https://img.shields.io/travis/jonschlinkert/parse-code-context.svg?style=flat&label=Travis)](https://travis-ci.org/jonschlinkert/parse-code-context)

> Fast and simple way to parse code context for use with documentation from code comments. Parses context from a single line of JavaScript, for functions, variable declarations, methods, prototype properties, prototype methods etc.

Please consider following this project's author, [Jon Schlinkert](https://github.com/jonschlinkert), and consider starring the project to show your :heart: and support.

## Install

Install with [npm](https://www.npmjs.com/):

```sh
$ npm install --save parse-code-context
```

## Getting started

* [Usage](#usage)
* [API](#api)
* [Examples](#examples)
* [Custom parsers](#custom-parsers)

## Usage

```js
const parse = require('parse-code-context');
console.log(parse('function app(a, b, c) {\n\n}'));
```

## API

### [Parser](index.js#L18)

Create an instance of `Parser` with the given `string`, optionally passing a `parent` name for namespacing methods

**Params**

* `str` **{String}**
* `parent` **{String}**

**Example**

```js
const { Parser } = require('parse-code-context');
const parser = new Parser('function foo(a, b, c) {}');
```

### [.name](index.js#L35)

Convenience method for creating a property name
that is prefixed with the parent namespace, if defined.

**Params**

* `name` **{String}**
* `returns` **{String}**

### [.capture](index.js#L60)

Register a parser to use (in addition to those already registered as default parsers) with the given `regex` and function.

**Params**

* `regex` **{RegExp}**
* `fn` **{Function}**
* `returns` **{Object}**: The instance for chaining

**Example**

```js
const parser = new Parser('function foo(a, b, c){}');
  .capture(/function\s*([\w$]+)\s*\(([^)]+)/, (match) => {
    return {
       name: match[1],
       params: matc(h[2] || '').split(/[,\s]/)
    };
  });
```

### [.parse](index.js#L73)

Parse the string passed to the constructor with all registered parsers.

* `returns` **{Object|Null}**

## Examples

### function statement

```js
const context = parse('function app(a, b, c) {\n\n}');
console.log(context);
```

Results in:

```js
{ type: 'function statement',
  name: 'app',
  params: [ 'a', 'b', 'c' ],
  string: 'app()',
  original: 'function app() {\n\n}' }
```

### function expression

```js
parse("var app = function(a, b, c) {\n\n}");
```

Results in:

```js
{ type: 'function expression',
  name: 'app',
  params: [ 'a', 'b', 'c' ],
  string: 'app()',
  original: 'var app = function() {\n\n}' }
```

### `module.exports` function expression

```js
parse("module.exports = function foo(a, b, c) {\n\n}");
```

Results in:

```js
{ type: 'function expression',
  receiver: 'module.exports',
  name: 'foo',
  params: [ 'a', 'b', 'c' ],
  string: 'module.exports()',
  original: 'module.exports = function foo(a, b, c) {\n\n}' }
```

### `module.exports` method

```js
parse("module.exports = function() {\n\n}");
```

Results in:

```js
{ type: 'method',
  receiver: 'module.exports',
  name: '',
  params: [],
  string: 'module.exports.() {\n\n}()',
  original: 'module.exports = function() {\n\n}' }
```

### prototype method

```js
parse("Template.prototype.get = function() {}");
```

Results in:

```js
{ type: 'prototype method',
  class: 'Template',
  name: 'get',
  params: [],
  string: 'Template.prototype.get()',
  original: 'Template.prototype.get = function() {}' }
```

### prototype property

```js
parse("Template.prototype.enabled = true;\nasdf");
```

Results in:

```js
{ type: 'prototype property',
  class: 'Template',
  name: 'enabled',
  value: 'true',
  string: 'Template.prototype.enabled',
  original: 'Template.prototype.enabled = true;\nasdf' }
```

### method

```js
parse("option.get = function() {}");
```

Results in:

```js
{ type: 'method',
  receiver: 'option',
  name: 'get',
  params: [],
  string: 'option.get()',
  original: 'option.get = function() {}' }
```

### property

```js
parse("option.name = \"delims\";\nasdf");
```

Results in:

```js
{ type: 'property',
  receiver: 'option',
  name: 'name',
  value: '"delims"',
  string: 'option.name',
  original: 'option.name = "delims";\nasdf' }
```

### declaration

```js
parse("var name = \"delims\";\nasdf");
```

Results in:

```js
{ type: 'declaration',
  name: 'name',
  value: '"delims"',
  string: 'name',
  original: 'var name = "delims";\nasdf' }

```

### function statement params

```js
parse("function app(a, b) {\n\n}");
```

Results in:

```js
{ type: 'function statement',
  name: 'app',
  params: [ 'a', 'b' ],
  string: 'app()',
  original: 'function app(a, b) {\n\n}' }
```

### function expression params

```js
parse("var app = function(foo, bar) {\n\n}");
```

Results in:

```js
{ type: 'function expression',
  name: 'app',
  params: [ 'foo', 'bar' ],
  string: 'app()',
  original: 'var app = function(foo, bar) {\n\n}' }
```

### function expression params

```js
parse("var app=function(foo,bar) {\n\n}");
```

Results in:

```js
{ type: 'function expression',
  name: 'app',
  params: [ 'foo', 'bar' ],
  string: 'app()',
  original: 'var app=function(foo,bar) {\n\n}' }
```

### prototype method params

```js
parse("Template.prototype.get = function(key, value, options) {}");
```

Results in:

```js
{ type: 'prototype method',
  class: 'Template',
  name: 'get',
  params: [ 'key', 'value', 'options' ],
  string: 'Template.prototype.get()',
  original: 'Template.prototype.get = function(key, value, options) {}' }
```

## Custom parsers

Instantiate the `Parser` class to register custom parsers.

```js
const { Parser} = require('parse-code-context');
const parser = new Parser();

parser.capture(/foo\(([^)]+)\)/, match => {
  return {
    params: match[1].split(/[,\s]+/)
  };
});

console.log(parser.parse('foo(a, b, c)'));
```

## Credit

Regex was originally sourced and modified from [https://github.com/visionmedia/dox](https://github.com/visionmedia/dox).

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

* [code-context](https://www.npmjs.com/package/code-context): Parse a string of javascript to determine the context for functions, variables and comments based… [more](https://github.com/jonschlinkert/code-context) | [homepage](https://github.com/jonschlinkert/code-context "Parse a string of javascript to determine the context for functions, variables and comments based on the code that follows.")
* [snapdragon](https://www.npmjs.com/package/snapdragon): Easy-to-use plugin system for creating powerful, fast and versatile parsers and compilers, with built-in source-map… [more](https://github.com/here-be/snapdragon) | [homepage](https://github.com/here-be/snapdragon "Easy-to-use plugin system for creating powerful, fast and versatile parsers and compilers, with built-in source-map support.")
* [strip-comments](https://www.npmjs.com/package/strip-comments): Strip comments from code. Removes line comments, block comments, the first comment only, or all… [more](https://github.com/jonschlinkert/strip-comments) | [homepage](https://github.com/jonschlinkert/strip-comments "Strip comments from code. Removes line comments, block comments, the first comment only, or all comments. Optionally leave protected comments unharmed.")

### Author

**Jon Schlinkert**

* [GitHub Profile](https://github.com/jonschlinkert)
* [Twitter Profile](https://twitter.com/jonschlinkert)
* [LinkedIn Profile](https://linkedin.com/in/jonschlinkert)

### License

Copyright © 2018, [Jon Schlinkert](https://github.com/jonschlinkert).
Released under the [MIT License](LICENSE).

***

_This file was generated by [verb-generate-readme](https://github.com/verbose/verb-generate-readme), v0.8.0, on November 24, 2018._