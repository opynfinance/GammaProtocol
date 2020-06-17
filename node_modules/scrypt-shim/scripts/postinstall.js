var semver = require('semver');

var NODE_MIN_VER_WITH_BUILTIN_SCRYPT = '10.5.0';
var NODE_MIN_VER_INCOMPAT_SCRYPT_PKG = '12.0.0';
// there are presently no Node.js versions with built-in scrypt that doesn't
// have maxmem limitations
// see: https://github.com/nodejs/node/pull/28799#issuecomment-521829488
// anticipating improved scrypt in 10.x and 12.x release lines
// var NODE_MIN_VER_SCRYPT_MAXMEM_FIXED = ['10.?.?', '12.?.?'];

// use NODE_MIN_VER_SCRYPT_MAXMEM_FIXED instead, when such versions are available
// var byUpgradingOrInstalling = 'You can improve the performance of scrypt by upgrading to Node.js version ' + NODE_MIN_VER_SCRYPT_MAXMEM_FIXED.join(' or ') + ' or newer, or by installing the (deprecated) scrypt package in your project';

var byUpgradingOrInstalling = 'You can improve the performance of scrypt by upgrading to Node.js version ' + NODE_MIN_VER_WITH_BUILTIN_SCRYPT + ' or newer, or by installing the (deprecated) scrypt package in your project';

var colorizeYellow = '\x1b[33m%s\x1b[0m';

function warn(message) {
  console.warn(colorizeYellow, message);
}

var tryScryptPkg = function() {
  var scryptPkg;
  try {
    scryptPkg = require('scrypt');
  } catch (e) {
    scryptPkg = null;
  }
  return scryptPkg;
};

var hasNodeBuiltin = semver.Range('>=' + NODE_MIN_VER_WITH_BUILTIN_SCRYPT).test(process.version);

if (!hasNodeBuiltin) {
  if (!tryScryptPkg()) {
    warn(byUpgradingOrInstalling);
  }
}
