"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const lodash_1 = require("lodash");
const upgrades_1 = require("@openzeppelin/upgrades");
const naming_1 = require("../../utils/naming");
const ManifestVersion_1 = require("./ManifestVersion");
const constants_1 = require("../files/constants");
const interfaces_1 = require("../../scripts/interfaces");
class NetworkFile {
    // TS-TODO: type for network parameter (and class member too).
    constructor(projectFile, network, filePath = null) {
        this.projectFile = projectFile;
        this.network = network;
        const defaults = {
            contracts: {},
            solidityLibs: {},
            proxies: {},
            manifestVersion: ManifestVersion_1.MANIFEST_VERSION,
        };
        this.filePath = NetworkFile.getExistingFilePath(network, process.cwd(), filePath);
        if (this.filePath) {
            try {
                this.data = fs_extra_1.default.existsSync(this.filePath) ? fs_extra_1.default.readJsonSync(this.filePath) : null;
            }
            catch (e) {
                e.message = `Failed to parse '${path_1.default.resolve(filePath)}' file. Please make sure that ${filePath} is a valid JSON file. Details: ${e.message}.`;
                throw e;
            }
        }
        this.data = this.data || defaults;
        this.filePath = this.filePath || `${constants_1.OPEN_ZEPPELIN_FOLDER}/${network}.json`;
        ManifestVersion_1.checkVersion(this.data.manifestVersion || this.data.zosversion, this.filePath);
    }
    static getManifestVersion(network) {
        const file = fs_extra_1.default.existsSync(`zos.${network}.json`) ? fs_extra_1.default.readJsonSync(`zos.${network}.json`) : null;
        return file ? file.manifestVersion || file.zosversion : null;
    }
    set manifestVersion(version) {
        if (this.data.manifestVersion) {
            this.data.manifestVersion = version;
        }
        else {
            this.data.zosversion = version;
        }
    }
    get manifestVersion() {
        return this.data.manifestVersion || this.data.zosversion;
    }
    set version(version) {
        this.data.version = version;
    }
    get version() {
        return this.data.version;
    }
    set contracts(contracts) {
        this.data.contracts = contracts;
    }
    get contracts() {
        return this.data.contracts || {};
    }
    set solidityLibs(solidityLibs) {
        this.data.solidityLibs = solidityLibs;
    }
    get solidityLibs() {
        return this.data.solidityLibs || {};
    }
    set frozen(frozen) {
        this.data.frozen = frozen;
    }
    get frozen() {
        return this.data.frozen;
    }
    set proxyAdmin(admin) {
        this.data.proxyAdmin = admin;
    }
    get proxyAdmin() {
        return this.data.proxyAdmin || {};
    }
    set proxyFactory(factory) {
        this.data.proxyFactory = factory;
    }
    get proxyFactory() {
        return this.data.proxyFactory || {};
    }
    set app(app) {
        this.data.app = app;
    }
    get app() {
        return this.data.app || {};
    }
    set provider(provider) {
        this.data.provider = provider;
    }
    get provider() {
        return this.data.provider || {};
    }
    set package(_package) {
        this.data.package = _package;
    }
    get package() {
        return this.data.package || {};
    }
    get proxyAdminAddress() {
        return this.proxyAdmin.address;
    }
    get proxyFactoryAddress() {
        return this.proxyFactory.address;
    }
    get appAddress() {
        return this.app.address;
    }
    get packageAddress() {
        return this.package.address;
    }
    get providerAddress() {
        return this.provider.address;
    }
    get isPublished() {
        return this.projectFile.isPublished;
    }
    get contractAliases() {
        return Object.keys(this.contracts);
    }
    addSolidityLib(libName, instance) {
        this.data.solidityLibs[libName] = {
            address: instance.address,
            constructorCode: upgrades_1.constructorCode(instance),
            bodyBytecodeHash: upgrades_1.bytecodeDigest(upgrades_1.bodyCode(instance)),
            localBytecodeHash: upgrades_1.bytecodeDigest(instance.schema.bytecode),
            deployedBytecodeHash: upgrades_1.bytecodeDigest(instance.schema.linkedBytecode),
        };
    }
    unsetSolidityLib(libName) {
        delete this.data.solidityLibs[libName];
    }
    setSolidityLib(alias, value) {
        if (!this.data.solidityLibs)
            this.data.solidityLibs = {};
        this.data.solidityLibs[alias] = value;
    }
    solidityLib(libName) {
        return this.data.solidityLibs[libName];
    }
    getSolidityLibs(libs) {
        const { solidityLibs } = this.data;
        return Object.keys(solidityLibs)
            .filter(libName => libs.includes(libName))
            .map(libName => ({ libName, address: solidityLibs[libName].address }))
            .reduce((someLib, currentLib) => {
            someLib[currentLib.libName] = currentLib.address;
            return someLib;
        }, {});
    }
    hasSolidityLib(libName) {
        return !lodash_1.isEmpty(this.solidityLib(libName));
    }
    solidityLibsMissing(libs) {
        return lodash_1.difference(Object.keys(this.solidityLibs), libs);
    }
    getSolidityLibOrContract(aliasOrName) {
        return this.data.solidityLibs[aliasOrName] || this.data.contracts[aliasOrName];
    }
    hasSolidityLibOrContract(aliasOrName) {
        return this.hasSolidityLib(aliasOrName) || this.hasContract(aliasOrName);
    }
    updateImplementation(aliasOrName, fn) {
        if (this.hasContract(aliasOrName))
            this.data.contracts[aliasOrName] = fn(this.data.contracts[aliasOrName]);
        else if (this.hasSolidityLib(aliasOrName))
            this.data.solidityLibs[aliasOrName] = fn(this.data.solidityLibs[aliasOrName]);
        else
            return;
    }
    get dependencies() {
        return this.data.dependencies || {};
    }
    get dependenciesNames() {
        return Object.keys(this.dependencies);
    }
    getDependency(name) {
        if (!this.data.dependencies)
            return null;
        return this.data.dependencies[name] || {};
    }
    hasDependency(name) {
        return !lodash_1.isEmpty(this.getDependency(name));
    }
    hasDependencies() {
        return !lodash_1.isEmpty(this.dependencies);
    }
    getProxies({ package: packageName, contract, address, kind } = {}) {
        if (lodash_1.isEmpty(this.data.proxies))
            return [];
        const allProxies = lodash_1.flatMap(this.data.proxies || {}, (proxiesList, fullname) => lodash_1.map(proxiesList, proxyInfo => (Object.assign(Object.assign(Object.assign({}, naming_1.fromContractFullName(fullname)), proxyInfo), { kind: proxyInfo.kind || interfaces_1.ProxyType.Upgradeable }))));
        return lodash_1.filter(allProxies, proxy => (!packageName || proxy.package === packageName) &&
            (!contract || proxy.contract === contract) &&
            (!address || proxy.address === address) &&
            (!kind || proxy.kind === kind));
    }
    getProxy(address) {
        const allProxies = this.getProxies();
        return lodash_1.find(allProxies, { address });
    }
    contract(alias) {
        return this.data.contracts[alias];
    }
    contractAliasesMissingFromPackage() {
        return lodash_1.difference(this.contractAliases, this.projectFile.contractAliases);
    }
    isCurrentVersion(version) {
        return this.version === version;
    }
    hasContract(alias) {
        return !lodash_1.isEmpty(this.contract(alias));
    }
    hasContracts() {
        return !lodash_1.isEmpty(this.data.contracts);
    }
    hasProxies(aFilter = {}) {
        return !lodash_1.isEmpty(this.getProxies(aFilter));
    }
    hasMatchingVersion() {
        return this.projectFile.isCurrentVersion(this.version);
    }
    dependenciesNamesMissingFromPackage() {
        return lodash_1.difference(this.dependenciesNames, this.projectFile.dependenciesNames);
    }
    dependencyHasCustomDeploy(name) {
        const dep = this.getDependency(name);
        return dep && dep.customDeploy;
    }
    dependencySatisfiesVersionRequirement(name) {
        const dep = this.getDependency(name);
        return dep && this.projectFile.dependencyMatches(name, dep.version);
    }
    dependencyHasMatchingCustomDeploy(name) {
        return this.dependencyHasCustomDeploy(name) && this.dependencySatisfiesVersionRequirement(name);
    }
    hasSameBytecode(alias, klass) {
        const contract = this.contract(alias) || this.solidityLib(alias);
        if (contract) {
            const localBytecode = contract.localBytecodeHash;
            const currentBytecode = upgrades_1.bytecodeDigest(klass.schema.bytecode);
            return currentBytecode === localBytecode;
        }
    }
    setDependency(name, { package: thepackage, version, customDeploy } = {}) {
        if (!this.data.dependencies)
            this.data.dependencies = {};
        const dependency = {
            package: thepackage,
            version: upgrades_1.semanticVersionToString(version),
            customDeploy: undefined,
        };
        if (customDeploy)
            dependency.customDeploy = customDeploy;
        this.data.dependencies[name] = dependency;
    }
    unsetDependency(name) {
        if (!this.data.dependencies)
            return;
        delete this.data.dependencies[name];
    }
    updateDependency(name, fn) {
        this.setDependency(name, fn(this.getDependency(name)));
    }
    addContract(alias, instance, { warnings, types, storage } = {}) {
        this.setContract(alias, {
            address: instance.address,
            constructorCode: upgrades_1.constructorCode(instance),
            bodyBytecodeHash: upgrades_1.bytecodeDigest(upgrades_1.bodyCode(instance)),
            localBytecodeHash: upgrades_1.bytecodeDigest(instance.schema.bytecode),
            deployedBytecodeHash: upgrades_1.bytecodeDigest(instance.schema.linkedBytecode),
            types,
            storage,
            warnings,
        });
    }
    setContract(alias, value) {
        this.data.contracts[alias] = value;
    }
    unsetContract(alias) {
        delete this.data.contracts[alias];
    }
    setProxies(packageName, alias, value) {
        const fullname = naming_1.toContractFullName(packageName, alias);
        this.data.proxies[fullname] = value;
    }
    addProxy(thepackage, alias, info) {
        const fullname = naming_1.toContractFullName(thepackage, alias);
        if (!this.data.proxies[fullname])
            this.data.proxies[fullname] = [];
        this.data.proxies[fullname].push(info);
    }
    removeProxy(thepackage, alias, address) {
        const fullname = naming_1.toContractFullName(thepackage, alias);
        const index = this._indexOfProxy(fullname, address);
        if (index < 0)
            return;
        this.data.proxies[fullname].splice(index, 1);
        if (this._proxiesOf(fullname).length === 0)
            delete this.data.proxies[fullname];
    }
    updateProxy({ package: proxyPackageName, contract: proxyContractName, address: proxyAddress }, fn) {
        const fullname = naming_1.toContractFullName(proxyPackageName, proxyContractName);
        const index = this._indexOfProxy(fullname, proxyAddress);
        if (index === -1)
            throw Error(`Proxy ${fullname} at ${proxyAddress} not found in network file`);
        this.data.proxies[fullname][index] = fn(this.data.proxies[fullname][index]);
    }
    _indexOfProxy(fullname, address) {
        return lodash_1.findIndex(this.data.proxies[fullname], { address });
    }
    _proxiesOf(fullname) {
        return this.data.proxies[fullname] || [];
    }
    write() {
        if (this.hasChanged()) {
            const exists = this.exists();
            fs_extra_1.default.writeJsonSync(this.filePath, this.data, { spaces: 2 });
            upgrades_1.Loggy.onVerbose(__filename, 'write', 'write-network-json', exists ? `Updated ${this.filePath}` : `Created ${this.filePath}`);
        }
    }
    static getExistingFilePath(network, dir = process.cwd(), ...paths) {
        // TODO-v3: remove legacy project file support
        // Prefer the new format over the old one
        return [...paths, `${dir}/zos.${network}.json`, `${dir}/${constants_1.OPEN_ZEPPELIN_FOLDER}/${network}.json`].find(fs_extra_1.default.existsSync);
    }
    hasChanged() {
        const currentNetworkFile = fs_extra_1.default.existsSync(this.filePath) ? fs_extra_1.default.readJsonSync(this.filePath) : null;
        return !lodash_1.isEqual(this.data, currentNetworkFile);
    }
    exists() {
        return fs_extra_1.default.existsSync(this.filePath);
    }
}
exports.default = NetworkFile;
//# sourceMappingURL=NetworkFile.js.map