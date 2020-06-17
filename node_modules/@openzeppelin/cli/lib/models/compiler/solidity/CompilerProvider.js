"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const fs_extra_1 = require("fs-extra");
const axios_1 = __importDefault(require("axios"));
const solc_wrapper_1 = __importDefault(require("solc-wrapper"));
const semver_1 = __importDefault(require("semver"));
const lodash_1 = require("lodash");
const upgrades_1 = require("@openzeppelin/upgrades");
const os_1 = require("os");
const path_1 = __importDefault(require("path"));
const child_1 = __importDefault(require("../../../utils/child"));
const try_1 = require("../../../utils/try");
const solidity_1 = require("../../../utils/solidity");
const ethereumjs_util_1 = require("ethereumjs-util");
// Downloaded compilers will be stored here.
// TODO: Check writeability and fall back to tmp if needed
let SOLC_CACHE_PATH = path_1.default.join(os_1.homedir(), '.solc');
// Modified ENV to use when running native solc
let SOLC_BIN_ENV = null;
// How frequently to renew the solc list
const SOLC_LIST_EXPIRES_IN_SECONDS = 1 * 60 * 60; // 1 hour
// and where to download it from
const SOLC_LIST_URL = 'https://solc-bin.ethereum.org/bin/list.json';
class SolcjsCompiler {
    constructor(compilerBinary) {
        this.compiler = solc_wrapper_1.default(compilerBinary);
    }
    version() {
        return this.compiler.version();
    }
    compile(input) {
        return __awaiter(this, void 0, void 0, function* () {
            return JSON.parse(this.compiler.compile(JSON.stringify(input), undefined));
        });
    }
}
class SolcBinCompiler {
    constructor(version) {
        this._version = version;
    }
    version() {
        return this._version;
    }
    compile(input) {
        return __awaiter(this, void 0, void 0, function* () {
            const output = child_1.default.execSync('solc --standard-json', {
                input: JSON.stringify(input),
                env: SOLC_BIN_ENV,
            });
            return JSON.parse(output.toString());
        });
    }
}
function resolveCompilerVersion(requiredSemver) {
    return __awaiter(this, void 0, void 0, function* () {
        // Create an array with all unique semver restrictions (dropping initial 'v' if set manually by the user)
        const requiredSemvers = lodash_1.uniq(lodash_1.compact(lodash_1.castArray(requiredSemver))).map(str => str.startsWith('v') ? str.slice(1) : str);
        // TODO: Pin the compiler release, so a new release does not cause all contracts to be recompiled and thus redeployed
        const solcList = yield getAvailableCompilerVersions();
        const build = yield getCompilerVersion(requiredSemvers, solcList);
        return build;
    });
}
exports.resolveCompilerVersion = resolveCompilerVersion;
function fetchCompiler(build) {
    return __awaiter(this, void 0, void 0, function* () {
        // Try local compiler and see if version matches
        const localVersion = yield localCompilerVersion();
        if (localVersion && solidity_1.compilerVersionsMatch(localVersion, build.longVersion)) {
            upgrades_1.Loggy.onVerbose(__filename, 'fetchCompiler', 'download-compiler', `Using local solc compiler found`);
            return new SolcBinCompiler(localVersion);
        }
        // Go with emscriptem version if not
        const localFile = path_1.default.join(SOLC_CACHE_PATH, build.path);
        if (!fs_1.default.existsSync(localFile))
            yield downloadCompiler(build, localFile);
        const compilerBinary = getCompilerBinary(localFile);
        // Wrap emscriptem with solc-wrapper
        return new SolcjsCompiler(compilerBinary);
    });
}
exports.fetchCompiler = fetchCompiler;
function getCompiler(requiredSemver) {
    return __awaiter(this, void 0, void 0, function* () {
        const version = yield resolveCompilerVersion(requiredSemver);
        return fetchCompiler(version);
    });
}
exports.getCompiler = getCompiler;
function localCompilerVersion() {
    return __awaiter(this, void 0, void 0, function* () {
        const output = yield try_1.tryAwait(() => child_1.default.exec('solc --version', { env: SOLC_BIN_ENV }));
        if (!output)
            return null;
        const match = output.stdout.match(/^Version: ([^\s]+)/m);
        if (!match)
            return null;
        return match[1];
    });
}
function getAvailableCompilerVersions() {
    return __awaiter(this, void 0, void 0, function* () {
        const localPath = path_1.default.join(SOLC_CACHE_PATH, 'list.json');
        yield fs_extra_1.mkdirp(SOLC_CACHE_PATH);
        if (fs_1.default.existsSync(localPath) && Date.now() - +fs_1.default.statSync(localPath).mtime < SOLC_LIST_EXPIRES_IN_SECONDS * 1000) {
            return fs_extra_1.readJson(localPath);
        }
        try {
            const response = yield axios_1.default.get(SOLC_LIST_URL);
            const list = response.data;
            yield fs_extra_1.writeJson(localPath, list);
            return list;
        }
        catch (err) {
            if (fs_1.default.existsSync(localPath)) {
                upgrades_1.Loggy.noSpin.warn(__filename, 'getAvailableCompilerVersions', 'get-compiler-versions', `Error downloading solc releases list, using cached version`);
                return fs_extra_1.readJson(localPath);
            }
            else {
                err.message = `Could not retrieve solc releases list: ${err.message}`;
                throw err;
            }
        }
    });
}
function getCompilerVersion(requiredSemvers, solcList) {
    return __awaiter(this, void 0, void 0, function* () {
        // Returns build from list given a version
        const getBuild = (version) => solcList.builds.find(build => build.path === solcList.releases[version]);
        // Return latest release if there are no restrictions
        if (requiredSemvers.length === 0)
            return getBuild(solcList.latestRelease);
        // Look for the most recent release that matches semver restriction
        const comparatorSet = requiredSemvers.join(' ');
        const releases = Object.keys(solcList.releases);
        const maxRelease = semver_1.default.maxSatisfying(releases, comparatorSet);
        if (maxRelease)
            return getBuild(maxRelease);
        // If user asked for a specific version, look for it
        if (requiredSemvers.length === 1) {
            const build = lodash_1.reverse(solcList.builds).find(b => b.path.startsWith(`soljson-v${requiredSemvers[0]}`));
            if (build)
                return build;
        }
        throw new Error(`Could not find a compiler that matches required versions (${comparatorSet})`);
    });
}
function downloadCompiler(build, localFile) {
    return __awaiter(this, void 0, void 0, function* () {
        const { version, keccak256: expectedHash, path: versionPath } = build;
        upgrades_1.Loggy.onVerbose(__filename, 'downloadCompiler', 'download-compiler', `Downloading compiler version ${version}`);
        const url = `https://solc-bin.ethereum.org/bin/${versionPath}`;
        const { data: compilerSource } = yield axios_1.default.get(url);
        // Verify checksum
        const hash = '0x' + ethereumjs_util_1.keccak256(compilerSource).toString('hex');
        if (hash !== expectedHash) {
            throw new Error(`Checksum of compiler downloaded from ${url} does not match (expected ${expectedHash} but got ${hash})`);
        }
        // Cache downloaded source
        yield fs_extra_1.mkdirp(SOLC_CACHE_PATH);
        fs_1.default.writeFileSync(localFile, compilerSource);
        upgrades_1.Loggy.succeed('download-compiler');
    });
}
function getCompilerBinary(compilerPath) {
    // This magic is necessary as ts-node gets stuck when requiring the compiler large asm file
    // Copied from https://github.com/nomiclabs/buidler/blob/0a551dca18522ac2ac0cf2143d71580bf29f5dce/packages/buidler-core/src/internal/solidity/compiler/index.ts#L72-L89
    const Module = module.constructor;
    const previousHook = Module._extensions['.js'];
    Module._extensions['.js'] = function (module, filename) {
        const content = fs_1.default.readFileSync(filename, 'utf8');
        Object.getPrototypeOf(module)._compile.call(module, content, filename);
    };
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const loadedSolc = require(compilerPath);
    Module._extensions['.js'] = previousHook;
    return loadedSolc;
}
exports.getCompilerBinary = getCompilerBinary;
// Used for tests
function setSolcCachePath(value) {
    SOLC_CACHE_PATH = value;
}
exports.setSolcCachePath = setSolcCachePath;
function setSolcBinEnv(value) {
    SOLC_BIN_ENV = value;
}
exports.setSolcBinEnv = setSolcBinEnv;
//# sourceMappingURL=CompilerProvider.js.map