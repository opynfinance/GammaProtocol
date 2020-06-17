var semver = require('semver');

var NODE_MIN_VER_WITH_BUILTIN_SCRYPT = '10.5.0';
var NODE_MIN_VER_INCOMPAT_SCRYPT_PKG = '12.0.0';
// there are presently no Node.js versions with built-in scrypt that doesn't
// have maxmem limitations
// see: https://github.com/nodejs/node/pull/28799#issuecomment-521829488
// anticipating improved scrypt in 10.x and 12.x release lines
// var NODE_MIN_VER_SCRYPT_MAXMEM_FIXED = ['10.?.?', '12.?.?'];

var colorizeYellow = '\x1b[33m%s\x1b[0m';

var crypto;
var fallbackCount;
var fallbackImpl;
// var noFallbackNeeded;
var scrypt;
var scryptPkg;
var scryptsy;

var tryScryptPkg = function() {
  var scryptPkg;
  try {
    scryptPkg = require('scrypt');
  } catch (e) {
    if (/was compiled against a different/.test(e.message)) {
      throw e;
    }
    scryptPkg = null;
  }
  return scryptPkg;
};

var hasNodeBuiltin = semver.Range('>=' + NODE_MIN_VER_WITH_BUILTIN_SCRYPT).test(process.version);

if (hasNodeBuiltin) {
  crypto = require('crypto');
  // noFallbackNeeded = NODE_MIN_VER_SCRYPT_MAXMEM_FIXED.some(v => semver.Range('>=' + v).test(process.version));
  // if (noFallbackNeeded) {
  //     scrypt = function(key, salt, N, r, p, dkLen) {
  //         return crypto.scryptSync(key, salt, dkLen, {N: N, r: r, p: p});
  //     };
  // } else {
  scryptPkg = tryScryptPkg();
  if (scryptPkg) {
    scrypt = function(key, salt, N, r, p, dkLen) {
      return scryptPkg.hashSync(key, {N: N, r: r, p: p}, dkLen, salt);
    };
  } else {
    fallbackCount = 0;
    scryptsy = require('scryptsy');
    fallbackImpl = function(key, salt, N, r, p, dkLen) {
      fallbackCount += 1;
      console.warn(
        colorizeYellow,
        // use NODE_MIN_VER_SCRYPT_MAXMEM_FIXED, when such versions are available
        // 'Memory limit exceeded for Node\'s built-in crypto.scrypt, falling back to scryptsy (times: ' + fallbackCount + '), if this happens frequently you can improve the performance of scrypt by upgrading to Node.js version ' + NODE_MIN_VER_SCRYPT_MAXMEM_FIXED.join(' or ') + ' or newer, or when running Node.js versions older than ' + NODE_MIN_VER_INCOMPAT_SCRYPT_PKG + ' by installing the (deprecated) scrypt package in your project'

        'Memory limit exceeded for Node\'s built-in crypto.scrypt, falling back to scryptsy (times: ' + fallbackCount + '), if this happens frequently you can improve the performance of scrypt when running Node.js versions older than ' + NODE_MIN_VER_INCOMPAT_SCRYPT_PKG + ' by installing the (deprecated) scrypt package in your project'
      );
      return scryptsy(key, salt, N, r, p, dkLen);
    };
    scrypt = function(key, salt, N, r, p, dkLen) {
      try {
        return crypto.scryptSync(key, salt, dkLen, {N: N, r: r, p: p});
      } catch (e) {
        if (/scrypt:memory limit exceeded/.test(e.message)) {
          return fallbackImpl(key, salt, N, r, p, dkLen);
        }
        throw e;
      }
    };
  }
  // }
} else {
  scryptPkg = tryScryptPkg();
  if (scryptPkg) {
    scrypt = function(key, salt, N, r, p, dkLen) {
      return scryptPkg.hashSync(key, {N: N, r: r, p: p}, dkLen, salt);
    };
  } else {
    scrypt = require('scryptsy');
  }
}

module.exports = scrypt;
