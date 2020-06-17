"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs_extra_1 = require("fs-extra");
var find_up_1 = __importDefault(require("find-up"));
var try_require_1 = __importDefault(require("try-require"));
function artifactsDir(buildDir) {
    return buildDir + "/contracts";
}
function loadArtifacts(contract) {
    var buildDir = find_up_1.default.sync('build', { type: 'directory' });
    if (!buildDir || !find_up_1.default.sync.exists(artifactsDir(buildDir))) {
        throw new Error('Could not find compiled artifacts directory');
    }
    return fs_extra_1.readJSONSync(artifactsDir(buildDir) + "/" + contract + ".json", { encoding: 'utf8' });
}
function web3Loader(provider, defaultSender, defaultGas) {
    var web3Contract = try_require_1.default('web3-eth-contract');
    if (web3Contract === undefined) {
        throw new Error("Could not load package 'web3-eth-contract'. Please install it alongisde @openzeppelin/contract-loader.");
    }
    web3Contract.setProvider(provider);
    function fromABI(abi, bytecode) {
        if (bytecode === void 0) { bytecode = ''; }
        // eslint-disable-next-line @typescript-eslint/camelcase
        return new web3Contract(abi, undefined, { data: bytecode, from: defaultSender, gas: defaultGas });
    }
    function fromArtifacts(contract) {
        var _a = loadArtifacts(contract), abi = _a.abi, bytecode = _a.bytecode;
        return fromABI(abi, bytecode);
    }
    return { fromABI: fromABI, fromArtifacts: fromArtifacts };
}
function truffleLoader(provider, defaultSender, defaultGas) {
    var truffleContract = try_require_1.default('@truffle/contract');
    if (truffleContract === undefined) {
        throw new Error("Could not load package '@truffle/contract'. Please install it alongisde @openzeppelin/contract-loader.");
    }
    function fromABI(abi, bytecode) {
        if (bytecode === void 0) { bytecode = ''; }
        // eslint-disable-next-line @typescript-eslint/camelcase
        var abstraction = truffleContract({ abi: abi, unlinked_binary: bytecode });
        abstraction.setProvider(provider);
        abstraction.defaults({ from: defaultSender, gas: defaultGas });
        return abstraction;
    }
    function fromArtifacts(contract) {
        var _a = loadArtifacts(contract), abi = _a.abi, bytecode = _a.bytecode;
        return fromABI(abi, bytecode);
    }
    return { fromABI: fromABI, fromArtifacts: fromArtifacts };
}
function setupLoader(_a) {
    var provider = _a.provider, _b = _a.defaultSender, defaultSender = _b === void 0 ? '' : _b, _c = _a.defaultGas, defaultGas = _c === void 0 ? 8e6 : _c;
    return {
        web3: web3Loader(provider, defaultSender, defaultGas),
        truffle: truffleLoader(provider, defaultSender, defaultGas),
    };
}
exports.setupLoader = setupLoader;
//# sourceMappingURL=index.js.map