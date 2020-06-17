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
const lodash_1 = require("lodash");
const npm_programmatic_1 = __importDefault(require("npm-programmatic"));
const semver_1 = __importDefault(require("semver"));
const upgrades_1 = require("@openzeppelin/upgrades");
const truffle_config_1 = __importDefault(require("truffle-config"));
const TruffleConfig = {
    name: 'TruffleConfig',
    exists(path = process.cwd()) {
        const truffleFile = `${path}/truffle.js`;
        const truffleConfigFile = `${path}/truffle-config.js`;
        return fs_1.default.existsSync(truffleFile) || fs_1.default.existsSync(truffleConfigFile);
    },
    isTruffleProject(path = process.cwd()) {
        return this.exists(path);
    },
    loadNetworkConfig(network, force = false, path = process.cwd()) {
        return __awaiter(this, void 0, void 0, function* () {
            const config = this.getConfig(force);
            const { networks: networkList } = config;
            if (!networkList[network])
                throw Error(`Given network '${network}' is not defined in your ${this.getConfigFileName(path)} file`);
            config.network = network;
            config.networkId = config.network_id;
            const { provider } = config;
            yield this.checkHdWalletProviderVersion(provider);
            const artifactDefaults = this.getArtifactDefaults(config);
            return Object.assign(Object.assign({}, config), { provider, artifactDefaults });
        });
    },
    getBuildDir() {
        const config = this.getConfig();
        return config.contracts_build_directory;
    },
    getConfig(force = false) {
        if (!force && this.config)
            return this.config;
        try {
            this.config = truffle_config_1.default.detect({ logger: console });
            return this.config;
        }
        catch (error) {
            error.message = `Could not load truffle configuration file. Error: ${error.message}`;
            throw error;
        }
    },
    checkHdWalletProviderVersion(provider, path = process.cwd()) {
        return __awaiter(this, void 0, void 0, function* () {
            if (provider.constructor.name !== 'HDWalletProvider')
                return;
            const packagesList = yield npm_programmatic_1.default.list(path);
            const hdwalletProviderPackage = packagesList.find(packageNameAndVersion => packageNameAndVersion.match(/^truffle-hdwallet-provider@/));
            if (hdwalletProviderPackage) {
                const [, version] = hdwalletProviderPackage.split('@');
                if (version && semver_1.default.lt(version, '1.0.0')) {
                    upgrades_1.Loggy.noSpin.warn(__filename, 'checkHdWalletProviderVersion', 'check-hdwallet-provider-version', `Version ${version} of truffle-hdwallet-provider might fail when deploying multiple contracts. Consider upgrading it to version '1.0.0' or higher.`);
                }
            }
        });
    },
    getArtifactDefaults(config) {
        const network = config.network;
        const rawConfig = require(require('truffle-config').search()) || {};
        const networks = rawConfig.networks || {};
        const networkConfig = networks[network];
        const configDefaults = lodash_1.pickBy(lodash_1.pick(this.config, 'from', 'gasPrice'));
        const networkDefaults = lodash_1.pickBy(lodash_1.pick(networkConfig, 'from', 'gas', 'gasPrice'));
        return Object.assign(Object.assign({}, configDefaults), networkDefaults);
    },
    getConfigFileName(path) {
        const truffleFile = `${path}/truffle.js`;
        return fs_1.default.existsSync(truffleFile) ? 'truffle.js' : 'truffle-config.js';
    },
};
exports.default = TruffleConfig;
//# sourceMappingURL=TruffleConfig.js.map