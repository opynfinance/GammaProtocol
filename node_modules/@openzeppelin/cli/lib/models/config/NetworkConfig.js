"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const lodash_1 = require("lodash");
const NetworkConfig = {
    name: 'NetworkConfig',
    initialize(root = process.cwd()) {
        this.createContractsDir(root);
        this.createNetworkConfigFile(root);
    },
    exists(root = process.cwd()) {
        const filename = this.getConfigFileName(root);
        return fs_1.default.existsSync(filename);
    },
    getConfig(root = process.cwd()) {
        const filename = this.getConfigFileName(root);
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const networksConfigFile = require(filename);
        const buildDir = `${root}/build/contracts`;
        return Object.assign(Object.assign({}, networksConfigFile), { buildDir });
    },
    getBuildDir() {
        return `${process.cwd()}/build/contracts`;
    },
    loadNetworkConfig(networkName, root = process.cwd()) {
        const config = this.getConfig(root);
        const { networks } = config;
        if (!networks[networkName])
            throw Error(`Given network '${networkName}' is not defined in your networks.js file`);
        const network = networks[networkName];
        if (lodash_1.isUndefined(network.networkId)) {
            network.networkId = network.network_id;
        }
        const provider = this.getProvider(networks[networkName]);
        const artifactDefaults = this.getArtifactDefaults(config, networks[networkName]);
        return Object.assign(Object.assign({}, config), { network,
            provider,
            artifactDefaults });
    },
    getProvider(network) {
        if (!network.provider) {
            return this.getURL(network);
        }
        else if (typeof network.provider === 'function') {
            return network.provider();
        }
        else {
            return network.provider;
        }
    },
    getURL(network) {
        const networkUrl = network.url;
        if (networkUrl)
            return networkUrl;
        const { host, port, protocol, path } = network;
        if (!host)
            throw Error('A host name is required for the network connection');
        let url = `${(protocol !== null && protocol !== void 0 ? protocol : 'http')}://${host}`;
        if (port)
            url += `:${port}`;
        if (path)
            url += `/${path}`;
        return url;
    },
    getArtifactDefaults(zosConfigFile, network) {
        const defaults = ['gas', 'gasPrice', 'from'];
        const configDefaults = lodash_1.omitBy(lodash_1.pick(zosConfigFile, defaults), lodash_1.isUndefined);
        const networkDefaults = lodash_1.omitBy(lodash_1.pick(network, defaults), lodash_1.isUndefined);
        return Object.assign(Object.assign({}, configDefaults), networkDefaults);
    },
    createContractsDir(root) {
        const contractsDir = `${root}/contracts`;
        this.createDir(contractsDir);
    },
    createNetworkConfigFile(root) {
        if (!this.exists(root)) {
            const blueprint = path_1.default.resolve(__dirname, './blueprint.networks.js');
            const target = this.getConfigFileName(root);
            fs_1.default.copyFileSync(blueprint, target);
        }
    },
    createDir(dir) {
        if (!fs_1.default.existsSync(dir)) {
            fs_1.default.mkdirSync(dir);
            fs_1.default.writeFileSync(`${dir}/.gitkeep`, '');
        }
    },
    getConfigFileName(root) {
        return `${root}/networks.js`;
    },
};
exports.default = NetworkConfig;
//# sourceMappingURL=NetworkConfig.js.map