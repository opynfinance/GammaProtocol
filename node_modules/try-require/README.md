try-require
===========

try/require mechanism to conditionally load a module using require.

# Installation
```bash
npm install try-require --save
```

# Usage

try-require lets you try to require a module and not fail if the
module is not installed. You could do this inline but the try/catch
block will prevent V8 from optimizing your entire function. Therefore,
making try-require standalone means only this module is not optimizable.

Sometimes you don't need to load the module, just determine if it is available.
For this, a `resolve` function is provided with `try-require.``

```javascript
// Conditionally require a module
var tryRequire = require('try-require');
var maybe = tryRequire('maybeModule');

// If `maybeModule` is not available, then `maybe` will
// be undefined. If available it is equivalent to:
// var maybe = require('maybeModule');
```

```javascript
// Determine if a module is available without loading it into memory
var tryRequire = require('try-require');
var maybePath = tryRequire.resolve('maybeModule');

// If available, maybePath holds the path to the module
// and the module is not loaded. If `maybeModule` is not available,
// then `maybePath` will be undefined.
```

Optionally, check require and resolution exceptions with lastError. Note that
lastError will return null if no error has ever been triggered, or if the most
recent call to require or resolve was successful.

```javascript
var tryRequire = require('try-require');
var maybe = tryRequire('notAModule');

console.error( tryRequire.lastError() );
```

Note that both tryRequire and tryRequire.resolve accept an optional second
argument if you want to provide your own version of require.

# Contribute

If you would like to add to this library, please ensure that all existing test
cases pass and that all new code has proper test coverage in test/all.test.js. 

To run tests, simply execute:

```bash
npm test
```

Also, match styles within the project where language of the file allows. Some 
core styles to follow are:

- indent lines with 4 spaces
- spaces around parameters in function definitions and calls
- opening/closing brackets on same line

# License

MIT
