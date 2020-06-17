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
const upgrades_1 = require("@openzeppelin/upgrades");
const TruffleConfig_1 = __importDefault(require("./TruffleConfig"));
const Session_1 = __importDefault(require("../network/Session"));
const NetworkConfig_1 = __importDefault(require("./NetworkConfig"));
const lodash_1 = require("lodash");
const ConfigManager = {
    config: undefined,
    initialize(root = process.cwd()) {
        if (!TruffleConfig_1.default.exists() && !NetworkConfig_1.default.exists()) {
            NetworkConfig_1.default.initialize(root);
        }
    },
    initStaticConfiguration(root = process.cwd()) {
        this.setBaseConfig(root);
        const buildDir = this.config.getBuildDir();
        upgrades_1.Contracts.setLocalBuildDir(buildDir);
    },
    initNetworkConfiguration(options, silent, root = process.cwd()) {
        return __awaiter(this, void 0, void 0, function* () {
            this.initStaticConfiguration(root);
            const { network: networkName, from, timeout, blockTimeout } = Session_1.default.getOptions(options, silent);
            Session_1.default.setDefaultNetworkIfNeeded(options.network);
            if (!networkName)
                throw Error('A network name must be provided to execute the requested action.');
            const { provider, artifactDefaults, network } = yield this.config.loadNetworkConfig(networkName, root);
            upgrades_1.Contracts.setArtifactsDefaults(artifactDefaults);
            try {
                upgrades_1.ZWeb3.initialize(provider, { pollingTimeout: timeout, blockTimeout });
                yield upgrades_1.ZWeb3.checkNetworkId(network.networkId);
                const txParams = Object.assign({ from: upgrades_1.ZWeb3.toChecksumAddress(from || artifactDefaults.from || (yield upgrades_1.ZWeb3.defaultAccount())) }, lodash_1.pickBy(lodash_1.pick(artifactDefaults, ['gas', 'gasPrice']), x => !lodash_1.isNil(x)));
                return { network: yield upgrades_1.ZWeb3.getNetworkName(), txParams };
            }
            catch (error) {
                if (this.config && this.config.name === 'NetworkConfig') {
                    const providerInfo = typeof provider === 'string' ? ` on ${provider}` : '';
                    const message = `Could not connect to the ${networkName} Ethereum network${providerInfo}. Please check your networks.js configuration file.`;
                    error.message = `${message} Error: ${error.message}.`;
                    throw error;
                }
                else
                    throw error;
            }
        });
    },
    getBuildDir(root = process.cwd()) {
        this.setBaseConfig(root);
        return this.config.getBuildDir();
    },
    getCompilerInfo(root = process.cwd()) {
        this.setBaseConfig(root);
        const { compilers: { solc: { version, settings }, }, } = this.config.getConfig();
        const { enabled: optimizer, runs: optimizerRuns } = settings.optimizer;
        return { version, optimizer, optimizerRuns };
    },
    getNetworkNamesFromConfig(root = process.cwd()) {
        this.setBaseConfig(root);
        const config = this.config.getConfig();
        return config && config.networks ? Object.keys(config.networks) : undefined;
    },
    getConfigFileName(root = process.cwd()) {
        this.setBaseConfig(root);
        return this.config.getConfigFileName(root);
    },
    setBaseConfig(root = process.cwd()) {
        if (this.config)
            return;
        // these lines could be expanded to support different libraries like embark, ethjs, buidler, etc
        if (NetworkConfig_1.default.exists(root)) {
            this.config = NetworkConfig_1.default;
        }
        else if (TruffleConfig_1.default.exists(root)) {
            this.config = TruffleConfig_1.default;
        }
        else {
            throw Error('Could not find networks.js file, please remember to initialize your project.');
        }
    },
};
exports.default = ConfigManager;
//# sourceMappingURL=ConfigManager.js.map