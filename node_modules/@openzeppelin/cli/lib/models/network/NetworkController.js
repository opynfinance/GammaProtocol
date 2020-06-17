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
const fs_extra_1 = __importDefault(require("fs-extra"));
const lodash_1 = require("lodash");
const toposort_1 = __importDefault(require("toposort"));
const upgrades_1 = require("@openzeppelin/upgrades");
const ManifestVersion_1 = require("../files/ManifestVersion");
const async_1 = require("../../utils/async");
const naming_1 = require("../../utils/naming");
const ProjectDeployer_1 = require("./ProjectDeployer");
const Dependency_1 = __importDefault(require("../dependency/Dependency"));
const ValidationLogger_1 = __importDefault(require("../../interface/ValidationLogger"));
const Verifier_1 = __importDefault(require("../Verifier"));
const LocalController_1 = __importDefault(require("../local/LocalController"));
const ContractManager_1 = __importDefault(require("../local/ContractManager"));
const NetworkFile_1 = __importDefault(require("../files/NetworkFile"));
const ProjectFile_1 = __importDefault(require("../files/ProjectFile"));
const ManifestVersion_2 = require("../files/ManifestVersion");
const interfaces_1 = require("../../scripts/interfaces");
class NetworkController {
    constructor(network, txParams, networkFile) {
        if (!networkFile) {
            const projectFile = new ProjectFile_1.default();
            this.networkFile = new NetworkFile_1.default(projectFile, network);
        }
        else {
            this.networkFile = networkFile;
        }
        this.localController = new LocalController_1.default(this.networkFile.projectFile);
        this.contractManager = new ContractManager_1.default(this.networkFile.projectFile);
        this.txParams = txParams;
        this.network = network;
    }
    // NetworkController
    get projectFile() {
        return this.localController.projectFile;
    }
    // NetworkController
    get projectVersion() {
        return this.projectFile.version;
    }
    // NetworkController
    get currentVersion() {
        return this.networkFile.version;
    }
    get currentManifestVersion() {
        return this.networkFile.manifestVersion;
    }
    // NetworkController
    get packageAddress() {
        return this.networkFile.packageAddress;
    }
    get proxyAdminAddress() {
        return this.networkFile.proxyAdminAddress;
    }
    get proxyFactoryAddress() {
        return this.networkFile.proxyFactoryAddress;
    }
    // NetworkController
    checkNotFrozen() {
        if (this.networkFile.frozen) {
            throw Error(`Cannot modify contracts in a frozen version. Run 'openzeppelin bump' to create a new version first.`);
        }
    }
    // DeployerController
    fetchOrDeploy(requestedVersion) {
        return __awaiter(this, void 0, void 0, function* () {
            this.project = yield this.getDeployer(requestedVersion).fetchOrDeploy();
            return this.project;
        });
    }
    deployChangedSolidityLibs(contractNames) {
        return __awaiter(this, void 0, void 0, function* () {
            const libNames = this._getAllSolidityLibNames([contractNames]);
            const changedLibraries = this.getLibsToDeploy(libNames, true);
            yield this.uploadSolidityLibs(changedLibraries);
        });
    }
    // DeployerController
    push(aliases, { reupload = false, force = false } = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const changedLibraries = this._solidityLibsForPush(!reupload);
            const contractObjects = this._contractsListForPush(aliases, !reupload, changedLibraries);
            const buildArtifacts = upgrades_1.getBuildArtifacts();
            // ValidateContracts also extends each contract class with validation errors and storage info
            if (!this.validateContracts(contractObjects, buildArtifacts) && !force) {
                throw Error('One or more contracts have validation errors. Please review the items listed above and fix them, or run this command again with the --force option.');
            }
            this._checkVersion();
            yield this.fetchOrDeploy(this.projectVersion);
            yield this.handleDependenciesLink();
            this.checkNotFrozen();
            yield this.uploadSolidityLibs(changedLibraries);
            yield Promise.all([this.uploadContracts(contractObjects), this.unsetContracts()]);
            yield this._unsetSolidityLibs();
            if (lodash_1.isEmpty(contractObjects) && lodash_1.isEmpty(changedLibraries)) {
                upgrades_1.Loggy.noSpin(__filename, 'push', `after-push`, `All implementations are up to date`);
            }
            else {
                upgrades_1.Loggy.noSpin(__filename, 'push', `after-push`, `All implementations have been deployed`);
            }
        });
    }
    // DeployerController
    deployProxyFactory() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.fetchOrDeploy(this.projectVersion);
            yield this.project.ensureProxyFactory();
            yield this._tryRegisterProxyFactory();
        });
    }
    // DeployerController
    deployProxyAdmin() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.fetchOrDeploy(this.projectVersion);
            yield this.project.ensureProxyAdmin();
            yield this._tryRegisterProxyAdmin();
        });
    }
    // DeployerController
    _checkVersion() {
        if (this._newVersionRequired()) {
            this.networkFile.frozen = false;
            this.networkFile.contracts = {};
        }
    }
    // DeployerController
    _newVersionRequired() {
        return this.projectVersion !== this.currentVersion && this.isPublished;
    }
    // Contract model
    _contractsListForPush(aliases, onlyChanged = false, changedLibraries = []) {
        const newVersion = this._newVersionRequired();
        aliases = aliases || Object.keys(this.projectFile.contracts);
        return aliases
            .map(alias => [alias, this.projectFile.contracts[alias]])
            .map(([contractAlias, contractName]) => [contractAlias, upgrades_1.Contracts.getFromLocal(contractName)])
            .filter(([contractAlias, contract]) => newVersion ||
            !onlyChanged ||
            this.hasContractChanged(contractAlias, contract) ||
            this._hasChangedLibraries(contract, changedLibraries));
    }
    getLibsToDeploy(libNames, onlyChanged = false) {
        return libNames
            .map(libName => upgrades_1.Contracts.getFromLocal(libName))
            .filter(libClass => {
            const hasSolidityLib = this.networkFile.hasSolidityLib(libClass.schema.contractName);
            const hasChanged = this._hasSolidityLibChanged(libClass);
            return !hasSolidityLib || !onlyChanged || hasChanged;
        });
    }
    // Contract model || SolidityLib model
    _solidityLibsForPush(onlyChanged = false) {
        const { contractNames, contractAliases } = this.projectFile;
        const libNames = this._getAllSolidityLibNames(contractNames);
        const clashes = lodash_1.intersection(libNames, contractAliases);
        if (!lodash_1.isEmpty(clashes)) {
            throw new Error(`Cannot upload libraries with the same name as a contract alias: ${clashes.join(', ')}`);
        }
        return this.getLibsToDeploy(libNames, onlyChanged);
    }
    // Contract model || SolidityLib model
    uploadSolidityLibs(libs) {
        return __awaiter(this, void 0, void 0, function* () {
            // Libs may have dependencies, so deploy them in order
            for (let i = 0; i < libs.length; i++) {
                yield this._uploadSolidityLib(libs[i]);
            }
        });
    }
    // Contract model || SolidityLib model
    _uploadSolidityLib(libClass) {
        return __awaiter(this, void 0, void 0, function* () {
            const libName = libClass.schema.contractName;
            yield this._setSolidityLibs(libClass); // Libraries may depend on other libraries themselves
            upgrades_1.Loggy.spin(__filename, '_uploadSolidityLib', `upload-solidity-lib${libName}`, `Uploading ${libName} library`);
            const libInstance = this.project === undefined
                ? // There is no project for non-upgradeable deploys.
                    yield upgrades_1.Transactions.deployContract(libClass)
                : yield this.project.setImplementation(libClass, libName);
            this.networkFile.addSolidityLib(libName, libInstance);
            upgrades_1.Loggy.succeed(`upload-solidity-lib${libName}`, `${libName} library uploaded`);
        });
    }
    // Contract model
    uploadContracts(contracts) {
        return __awaiter(this, void 0, void 0, function* () {
            yield async_1.allPromisesOrError(contracts.map(([contractAlias, contract]) => this.uploadContract(contractAlias, contract)));
        });
    }
    // Contract model
    uploadContract(contractAlias, contract) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this._setSolidityLibs(contract);
                upgrades_1.Loggy.spin(__filename, 'uploadContract', `upload-contract${contract.schema.contractName}`, `Validating and deploying contract ${contract.schema.contractName}`);
                const contractInstance = yield this.project.setImplementation(contract, contractAlias);
                const { types, storage } = contract.schema.storageInfo || {
                    types: null,
                    storage: null,
                };
                this.networkFile.addContract(contractAlias, contractInstance, {
                    warnings: contract.schema.warnings,
                    types,
                    storage,
                });
                upgrades_1.Loggy.succeed(`upload-contract${contract.schema.contractName}`, `Contract ${contract.schema.contractName} deployed`);
            }
            catch (error) {
                error.message = `${contractAlias} deployment failed with error: ${error.message}`;
                throw error;
            }
        });
    }
    // Contract model || SolidityLib model
    _setSolidityLibs(contract) {
        return __awaiter(this, void 0, void 0, function* () {
            const currentContractLibs = upgrades_1.getSolidityLibNames(contract.schema.bytecode);
            const libraries = this.networkFile.getSolidityLibs(currentContractLibs);
            contract.link(libraries);
        });
    }
    // Contract model || SolidityLib model
    _unsetSolidityLibs() {
        return __awaiter(this, void 0, void 0, function* () {
            const { contractNames } = this.projectFile;
            const libNames = this._getAllSolidityLibNames(contractNames);
            yield async_1.allPromisesOrError(this.networkFile.solidityLibsMissing(libNames).map(libName => this._unsetSolidityLib(libName)));
        });
    }
    // Contract model || SolidityLib model
    _unsetSolidityLib(libName) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                upgrades_1.Loggy.spin(__filename, '_unsetSolidityLib', `unset-solidity-lib-${libName}`, `Removing ${libName} library`);
                // There is no project for non-upgradeable deploys.
                if (this.project !== undefined) {
                    yield this.project.unsetImplementation(libName);
                }
                this.networkFile.unsetSolidityLib(libName);
                upgrades_1.Loggy.succeed(`unset-solidity-lib-${libName}`);
            }
            catch (error) {
                error.message = `Removal of ${libName} failed with error: ${error.message}`;
                throw error;
            }
        });
    }
    // Contract model || SolidityLib model
    _hasChangedLibraries(contract, changedLibraries) {
        const libNames = upgrades_1.getSolidityLibNames(contract.schema.bytecode);
        return !lodash_1.isEmpty(lodash_1.intersection(changedLibraries.map(c => c.schema.contractName), libNames));
    }
    // Contract model || SolidityLib model
    _getAllSolidityLibNames(contractNames) {
        const graph = [];
        const nodes = [];
        contractNames.forEach(contractName => {
            this._populateDependencyGraph(contractName, nodes, graph);
        });
        // exclude original contracts
        return [...lodash_1.difference(toposort_1.default(graph), contractNames).reverse()];
    }
    _populateDependencyGraph(contractName, nodes, graph) {
        // if library is already added just ingore it
        if (!nodes.includes(contractName)) {
            nodes.push(contractName);
            this._getContractDependencies(contractName).forEach(dependencyContractName => {
                this._populateDependencyGraph(dependencyContractName, nodes, graph);
                graph.push([contractName, dependencyContractName]);
            });
        }
    }
    _getContractDependencies(contractName) {
        const contract = upgrades_1.Contracts.getFromLocal(contractName);
        return upgrades_1.getSolidityLibNames(contract.schema.bytecode);
    }
    // Contract model
    unsetContracts() {
        return __awaiter(this, void 0, void 0, function* () {
            yield async_1.allPromisesOrError(this.networkFile.contractAliasesMissingFromPackage().map(contractAlias => this.unsetContract(contractAlias)));
        });
    }
    // Contract model
    unsetContract(contractAlias) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                upgrades_1.Loggy.spin(__filename, 'unsetContract', `unset-contract-${contractAlias}`, `Removing ${contractAlias} contract`);
                yield this.project.unsetImplementation(contractAlias);
                this.networkFile.unsetContract(contractAlias);
                upgrades_1.Loggy.succeed(`unset-contract-${contractAlias}`);
            }
            catch (error) {
                error.message = `Removal of ${contractAlias} failed with error: ${error.message}`;
                throw error;
            }
        });
    }
    // DeployerController || Contract model
    validateContracts(contracts, buildArtifacts) {
        return lodash_1.every(contracts.map(([contractAlias, contract]) => this.validateContract(contractAlias, contract, buildArtifacts)));
    }
    // DeployerController || Contract model
    validateContract(contractAlias, contract, buildArtifacts) {
        try {
            const existingContractInfo = this.networkFile.contract(contractAlias) || {};
            const warnings = upgrades_1.validate(contract, existingContractInfo, buildArtifacts);
            const newWarnings = upgrades_1.newValidationErrors(warnings, existingContractInfo.warnings);
            const validationLogger = new ValidationLogger_1.default(contract, existingContractInfo);
            validationLogger.log(newWarnings, buildArtifacts);
            contract.schema.warnings = warnings;
            contract.schema.storageInfo = upgrades_1.getStorageLayout(contract, buildArtifacts);
            return upgrades_1.validationPasses(newWarnings);
        }
        catch (err) {
            upgrades_1.Loggy.noSpin.error(__filename, 'validateContract', `validate-contract`, `Error while validating contract ${contract.schema.contractName}: ${err}`);
            return false;
        }
    }
    // Contract model
    checkContractDeployed(packageName, contractAlias, throwIfFail = false) {
        if (!packageName)
            packageName = this.projectFile.name;
        const err = this._errorForContractDeployed(packageName, contractAlias);
        if (err)
            this._handleErrorMessage(err, throwIfFail);
    }
    // Contract model
    checkLocalContractsDeployed(throwIfFail = false) {
        const err = this._errorForLocalContractsDeployed();
        if (err)
            this._handleErrorMessage(err, throwIfFail);
    }
    // Contract model
    _errorForLocalContractsDeployed() {
        const [contractsDeployed, contractsMissing] = lodash_1.partition(this.projectFile.contractAliases, alias => this.isContractDeployed(alias));
        const contractsChanged = lodash_1.filter(contractsDeployed, alias => this.hasContractChanged(alias));
        if (!lodash_1.isEmpty(contractsMissing)) {
            return `Contracts ${contractsMissing.join(', ')} are not deployed.`;
        }
        else if (!lodash_1.isEmpty(contractsChanged)) {
            return `Contracts ${contractsChanged.join(', ')} have changed since the last deploy.`;
        }
    }
    // Contract model
    checkLocalContractDeployed(contractAlias, throwIfFail = false) {
        // if (!packageName) packageName = this.projectFile.name
        const err = this._errorForLocalContractDeployed(contractAlias);
        if (err)
            this._handleErrorMessage(err, throwIfFail);
    }
    // Contract model
    _errorForLocalContractDeployed(contractAlias) {
        if (!this.isContractDefined(contractAlias)) {
            return `Contract ${contractAlias} not found in this project`;
        }
        else if (!this.isContractDeployed(contractAlias)) {
            return `Contract ${contractAlias} is not deployed to ${this.network}.`;
        }
        else if (this.hasContractChanged(contractAlias)) {
            return `Contract ${contractAlias} has changed locally since the last deploy, consider running 'openzeppelin push'.`;
        }
    }
    // TODO: move to utils folder or somewhere else
    _handleErrorMessage(msg, throwIfFail = false) {
        if (throwIfFail) {
            throw Error(msg);
        }
        else {
            upgrades_1.Loggy.noSpin(__filename, 'handleErrorMessage', `handle-error-message`, msg);
        }
    }
    // Contract model || SolidityLib model
    _hasSolidityLibChanged(libClass) {
        return !this.networkFile.hasSameBytecode(libClass.schema.contractName, libClass);
    }
    // Contract model
    hasContractChanged(contractAlias, contract) {
        if (!this.isLocalContract(contractAlias))
            return false;
        if (!this.isContractDeployed(contractAlias))
            return true;
        if (!contract) {
            const contractName = this.projectFile.contract(contractAlias);
            contract = upgrades_1.Contracts.getFromLocal(contractName);
        }
        return !this.networkFile.hasSameBytecode(contractAlias, contract);
    }
    // Contract model
    isLocalContract(contractAlias) {
        return this.projectFile.hasContract(contractAlias);
    }
    // Contract model
    isContractDefined(contractAlias) {
        return this.projectFile.hasContract(contractAlias);
    }
    // Contract model
    isContractDeployed(contractAlias) {
        return !this.isLocalContract(contractAlias) || this.networkFile.hasContract(contractAlias);
    }
    // VerifierController
    verifyAndPublishContract(contractAlias, optimizer, optimizerRuns, remote, apiKey) {
        return __awaiter(this, void 0, void 0, function* () {
            upgrades_1.Loggy.spin(__filename, 'verifyAndPublishContract', 'verify-and-publish', `Verifying and publishing contract source code of ${contractAlias} on ${remote} (this usually takes under 30 seconds)`);
            const contractName = this.projectFile.contract(contractAlias);
            const { compilerVersion, sourcePath } = this.localController.getContractSourcePath(contractAlias);
            const contractSource = yield upgrades_1.flattenSourceCode([sourcePath]);
            const contractAddress = this.networkFile.contracts[contractAlias].address;
            if (this.networkFile.getProxies({ contract: contractName, kind: interfaces_1.ProxyType.NonProxy }).length > 0) {
                upgrades_1.Loggy.noSpin(__filename, 'verifyAndPublishContract', 'verify-and-publish-nonproxy', `A regular instance of ${contractName} was found. Verification of regular instances is not yet supported.`);
            }
            yield Verifier_1.default.verifyAndPublish(remote, {
                contractName,
                compilerVersion,
                optimizer,
                optimizerRuns,
                contractSource,
                contractAddress,
                apiKey,
                network: this.network,
            });
        });
    }
    // NetworkController
    writeNetworkPackageIfNeeded() {
        this.networkFile.write();
        this.projectFile.write();
    }
    // DeployerController
    freeze() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.packageAddress)
                throw Error('Cannot freeze an unpublished project');
            yield this.fetchOrDeploy(this.currentVersion);
            if (this.project instanceof upgrades_1.AppProject)
                yield this.project.freeze();
            this.networkFile.frozen = true;
        });
    }
    // DeployerController
    get isPublished() {
        return this.projectFile.isPublished || this.appAddress !== undefined;
    }
    // DeployerController
    getDeployer(requestedVersion) {
        return this.isPublished
            ? new ProjectDeployer_1.AppProjectDeployer(this, requestedVersion)
            : new ProjectDeployer_1.ProxyAdminProjectDeployer(this, requestedVersion);
    }
    // NetworkController
    get appAddress() {
        return this.networkFile.appAddress;
    }
    // NetworkController
    get app() {
        if (this.project instanceof upgrades_1.AppProject)
            return this.project.getApp();
        else
            return null;
    }
    _migrate() {
        return __awaiter(this, void 0, void 0, function* () {
            const owner = this.isPublished ? this.appAddress : this.txParams.from;
            const proxies = this._fetchOwnedProxies(null, null, null, owner);
            if (proxies.length !== 0) {
                const proxyAdmin = this.proxyAdminAddress
                    ? yield upgrades_1.ProxyAdmin.fetch(this.proxyAdminAddress, this.txParams)
                    : yield upgrades_1.ProxyAdmin.deploy(this.txParams);
                if (!this.proxyAdminAddress) {
                    upgrades_1.Loggy.spin(__filename, 'fetchOrDeploy', 'await-confirmations', 'Awaiting confirmations before transferring proxies to ProxyAdmin (this may take a few minutes)');
                    yield upgrades_1.Transactions.awaitConfirmations(proxyAdmin.contract.deployment.transactionHash);
                    upgrades_1.Loggy.succeed('await-confirmations');
                }
                this._tryRegisterProxyAdmin(proxyAdmin.address);
                yield async_1.allPromisesOrError(lodash_1.map(proxies, (proxy) => __awaiter(this, void 0, void 0, function* () {
                    const proxyInstance = yield upgrades_1.Proxy.at(proxy.address);
                    const currentAdmin = yield proxyInstance.admin();
                    if (currentAdmin !== proxyAdmin.address) {
                        if (this.appAddress) {
                            return upgrades_1.AppProxyMigrator(this.appAddress, proxy.address, proxyAdmin.address, this.txParams);
                        }
                        else {
                            const simpleProject = new upgrades_1.SimpleProject(this.projectFile.name, null, this.txParams);
                            return simpleProject.changeProxyAdmin(proxy.address, proxyAdmin.address);
                        }
                    }
                })));
                upgrades_1.Loggy.noSpin(__filename, '_migrate', 'migrate-version-cli', `Successfully migrated to manifest version ${ManifestVersion_2.MANIFEST_VERSION}`);
            }
            else {
                upgrades_1.Loggy.noSpin(__filename, '_migrate', 'migrate-version-cli', `No proxies were found. Updating manifest version to ${ManifestVersion_2.MANIFEST_VERSION}`);
            }
        });
    }
    migrateManifestVersionIfNeeded() {
        return __awaiter(this, void 0, void 0, function* () {
            if (ManifestVersion_1.isMigratableManifestVersion(this.currentManifestVersion))
                yield this._migrate();
            this.updateManifestVersionsIfNeeded(ManifestVersion_2.MANIFEST_VERSION);
        });
    }
    // DeployerController
    publish() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.appAddress) {
                upgrades_1.Loggy.noSpin(__filename, 'publish', 'publish-project', `Project is already published to ${this.network}`);
                return;
            }
            yield this.migrateManifestVersionIfNeeded();
            const proxyAdminProject = (yield this.fetchOrDeploy(this.currentVersion));
            const deployer = new ProjectDeployer_1.AppProjectDeployer(this, this.projectVersion);
            this.project = yield deployer.fromProxyAdminProject(proxyAdminProject);
            upgrades_1.Loggy.succeed(`publish-project`, `Published to ${this.network}!`);
        });
    }
    // Proxy model
    createProxy(packageName, contractAlias, initMethod, initArgs, admin, salt, signature, kind) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.migrateManifestVersionIfNeeded();
                yield this.fetchOrDeploy(this.currentVersion);
                if (!packageName)
                    packageName = this.projectFile.name;
                const contract = this.contractManager.getContractClass(packageName, contractAlias);
                yield this._setSolidityLibs(contract);
                this.checkInitialization(contract, initMethod);
                if (salt)
                    yield this._checkDeploymentAddress(salt);
                const createArgs = {
                    packageName,
                    contractName: contractAlias,
                    initMethod,
                    initArgs,
                    admin,
                };
                const { proxy, instance } = yield this.createProxyInstance(kind, salt, contract, signature, createArgs);
                const implementationAddress = yield proxy.implementation();
                const projectVersion = packageName === this.projectFile.name
                    ? this.currentVersion
                    : yield this.project.getDependencyVersion(packageName);
                yield this._updateTruffleDeployedInformation(contractAlias, instance);
                this.networkFile.addProxy(packageName, contractAlias, {
                    address: instance.address,
                    version: upgrades_1.semanticVersionToString(projectVersion),
                    implementation: implementationAddress,
                    admin: admin || this.networkFile.proxyAdminAddress || (yield this.project.getAdminAddress()),
                    kind,
                });
                return instance;
            }
            finally {
                yield this._tryRegisterProxyAdmin();
                yield this._tryRegisterProxyFactory();
            }
        });
    }
    createInstance(packageName, contractAlias, initArgs) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.migrateManifestVersionIfNeeded();
            if (!packageName) {
                packageName = this.projectFile.name;
            }
            if (packageName === this.projectFile.name) {
                yield this.deployChangedSolidityLibs(contractAlias);
            }
            const contract = this.contractManager.getContractClass(packageName, contractAlias);
            yield this._setSolidityLibs(contract);
            upgrades_1.Loggy.spin(__filename, 'createInstance', 'create-instance', `Deploying an instance of ${contractAlias}`);
            const instance = yield upgrades_1.Transactions.deployContract(contract, initArgs, this.txParams);
            upgrades_1.Loggy.succeed('create-instance', `Deployed instance of ${contractAlias}`);
            if (packageName === this.projectFile.name) {
                yield this._updateTruffleDeployedInformation(contractAlias, instance);
            }
            this.networkFile.addProxy(packageName, contractAlias, {
                address: instance.address,
                kind: interfaces_1.ProxyType.NonProxy,
                bytecodeHash: upgrades_1.bytecodeDigest(contract.schema.bytecode),
            });
            return instance;
        });
    }
    createProxyInstance(kind, salt, contract, signature, createArgs) {
        return __awaiter(this, void 0, void 0, function* () {
            let instance, proxy;
            switch (kind) {
                case interfaces_1.ProxyType.Upgradeable:
                    instance = salt
                        ? yield this.project.createProxyWithSalt(contract, salt, signature, createArgs)
                        : yield this.project.createProxy(contract, createArgs);
                    proxy = yield upgrades_1.Proxy.at(instance.address);
                    break;
                case interfaces_1.ProxyType.Minimal:
                    if (salt) {
                        throw new Error(`Cannot create a minimal proxy with a precomputed address, use an Upgradeable proxy instead.`);
                    }
                    instance = yield this.project.createMinimalProxy(contract, createArgs);
                    proxy = yield upgrades_1.MinimalProxy.at(instance.address);
                    break;
                default:
                    throw new Error(`Unknown proxy type ${kind}`);
            }
            return { proxy, instance };
        });
    }
    getProxyDeploymentAddress(salt, sender) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.migrateManifestVersionIfNeeded();
            yield this.fetchOrDeploy(this.currentVersion);
            const address = yield this.project.getProxyDeploymentAddress(salt, sender);
            this._tryRegisterProxyFactory();
            return address;
        });
    }
    getProxySignedDeployment(salt, signature, packageName, contractAlias, initMethod, initArgs, admin) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.migrateManifestVersionIfNeeded();
            yield this.fetchOrDeploy(this.currentVersion);
            if (!packageName)
                packageName = this.projectFile.name;
            const contract = this.contractManager.getContractClass(packageName, contractAlias);
            const args = {
                packageName,
                contractName: contractAlias,
                initMethod,
                initArgs,
                admin,
            };
            const signer = yield this.project.getProxyDeploymentSigner(contract, salt, signature, args);
            const address = yield this.project.getProxyDeploymentAddress(salt, signer);
            this._tryRegisterProxyFactory();
            return { address, signer };
        });
    }
    // Proxy model
    _checkDeploymentAddress(salt) {
        return __awaiter(this, void 0, void 0, function* () {
            const deploymentAddress = yield this.getProxyDeploymentAddress(salt);
            if ((yield upgrades_1.ZWeb3.eth.getCode(deploymentAddress)) !== '0x')
                throw new Error(`Deployment address for salt ${salt} is already in use`);
        });
    }
    // Proxy model
    _tryRegisterProxyAdmin(adminAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.networkFile.proxyAdminAddress) {
                const proxyAdminAddress = adminAddress || (yield this.project.getAdminAddress());
                if (proxyAdminAddress)
                    this.networkFile.proxyAdmin = { address: proxyAdminAddress };
            }
        });
    }
    // Proxy model
    _tryRegisterProxyFactory(factoryAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.networkFile.proxyFactoryAddress) {
                const proxyFactoryAddress = factoryAddress || (this.project.proxyFactory && this.project.proxyFactory.address);
                if (proxyFactoryAddress)
                    this.networkFile.proxyFactory = { address: proxyFactoryAddress };
            }
        });
    }
    // Proxy model
    checkInitialization(contract, calledInitMethod) {
        // If there is an initializer called, assume it's ok
        if (calledInitMethod)
            return;
        // Otherwise, warn the user to invoke it
        const contractMethods = upgrades_1.contractMethodsFromAbi(contract);
        const initializerMethods = contractMethods
            .filter(({ hasInitializer, name }) => hasInitializer || name === 'initialize')
            .map(({ name }) => name);
        if (initializerMethods.length === 0)
            return;
        upgrades_1.Loggy.noSpin.warn(__filename, 'validateContract', `validate-contract`, `Possible initialization method (${lodash_1.uniq(initializerMethods).join(', ')}) found in contract. Make sure you initialize your instance.`);
    }
    // Proxy model
    _updateTruffleDeployedInformation(contractAlias, implementation) {
        return __awaiter(this, void 0, void 0, function* () {
            const contractName = this.projectFile.contract(contractAlias);
            if (contractName) {
                const path = upgrades_1.Contracts.getLocalPath(contractName);
                const data = fs_extra_1.default.readJsonSync(path);
                if (!data.networks) {
                    data.networks = {};
                }
                const networkId = yield upgrades_1.ZWeb3.getNetwork();
                data.networks[networkId] = {
                    links: {},
                    events: {},
                    address: implementation.address,
                    // eslint-disable-next-line @typescript-eslint/camelcase
                    updated_at: Date.now(),
                };
                fs_extra_1.default.writeJsonSync(path, data, { spaces: 2 });
            }
        });
    }
    // Proxy model
    setProxiesAdmin(packageName, contractAlias, proxyAddress, newAdmin) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.migrateManifestVersionIfNeeded();
            const proxies = this._fetchOwnedProxies(packageName, contractAlias, proxyAddress);
            if (proxies.length === 0)
                return [];
            yield this.fetchOrDeploy(this.currentVersion);
            yield this._changeProxiesAdmin(proxies, newAdmin);
            return proxies;
        });
    }
    // Proxy model
    setProxyAdminOwner(newAdminOwner) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.migrateManifestVersionIfNeeded();
            yield this.fetchOrDeploy(this.currentVersion);
            yield this.project.transferAdminOwnership(newAdminOwner);
        });
    }
    // Proxy model
    _changeProxiesAdmin(proxies, newAdmin, project = null) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!project)
                project = this.project;
            yield async_1.allPromisesOrError(lodash_1.map(proxies, (aProxy) => __awaiter(this, void 0, void 0, function* () {
                yield project.changeProxyAdmin(aProxy.address, newAdmin);
                this.networkFile.updateProxy(aProxy, anotherProxy => (Object.assign(Object.assign({}, anotherProxy), { admin: newAdmin })));
            })));
        });
    }
    // Proxy model
    upgradeProxies(packageName, contractAlias, proxyAddress, initMethod, initArgs) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.migrateManifestVersionIfNeeded();
            const proxies = this._fetchOwnedProxies(packageName, contractAlias, proxyAddress);
            if (proxies.length === 0)
                return [];
            yield this.fetchOrDeploy(this.currentVersion);
            // Update all out of date proxies
            yield async_1.allPromisesOrError(lodash_1.map(proxies, proxy => this._upgradeProxy(proxy, initMethod, initArgs)));
            return proxies;
        });
    }
    // Proxy model
    _upgradeProxy(proxy, initMethod, initArgs) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const name = { packageName: proxy.package, contractName: proxy.contract };
                const contract = this.contractManager.getContractClass(proxy.package, proxy.contract);
                yield this._setSolidityLibs(contract);
                const currentImplementation = yield upgrades_1.Proxy.at(proxy.address).implementation();
                const contractImplementation = yield this.project.getImplementation(name);
                const projectVersion = proxy.package === this.projectFile.name
                    ? this.currentVersion
                    : yield this.project.getDependencyVersion(proxy.package);
                let newImplementation;
                if (currentImplementation !== contractImplementation) {
                    yield this.project.upgradeProxy(proxy.address, contract, Object.assign({ initMethod,
                        initArgs }, name));
                    newImplementation = contractImplementation;
                }
                else {
                    upgrades_1.Loggy.noSpin(__filename, '_upgradeProxy', `upgrade-proxy-${proxy.address}`, `Contract ${proxy.contract} at ${proxy.address} is up to date.`);
                    newImplementation = currentImplementation;
                }
                this.networkFile.updateProxy(proxy, aProxy => (Object.assign(Object.assign({}, aProxy), { implementation: newImplementation, version: upgrades_1.semanticVersionToString(projectVersion) })));
            }
            catch (error) {
                error.message = `Proxy ${naming_1.toContractFullName(proxy.package, proxy.contract)} at ${proxy.address} failed to upgrade with error: ${error.message}`;
                throw error;
            }
        });
    }
    // Proxy model
    _fetchOwnedProxies(packageName, contractAlias, proxyAddress, ownerAddress) {
        let criteriaDescription = '';
        if (packageName || contractAlias)
            criteriaDescription += ` contract ${naming_1.toContractFullName(packageName, contractAlias)}`;
        if (proxyAddress)
            criteriaDescription += ` address ${proxyAddress}`;
        const proxies = this.networkFile.getProxies({
            package: packageName || (contractAlias ? this.projectFile.name : undefined),
            contract: contractAlias,
            address: proxyAddress,
            kind: interfaces_1.ProxyType.Upgradeable,
        });
        if (lodash_1.isEmpty(proxies)) {
            upgrades_1.Loggy.noSpin(__filename, '_fetchOwnedProxies', `fetch-owned-proxies`, `No upgradeable contract instances that match${criteriaDescription} were found`);
            return [];
        }
        const expectedOwner = upgrades_1.ZWeb3.toChecksumAddress(ownerAddress || this.networkFile.proxyAdminAddress);
        const ownedProxies = proxies.filter(proxy => !proxy.admin || !expectedOwner || upgrades_1.ZWeb3.toChecksumAddress(proxy.admin) === expectedOwner);
        if (lodash_1.isEmpty(ownedProxies)) {
            upgrades_1.Loggy.noSpin(__filename, '_fetchOwnedProxies', `fetch-owned-proxies`, `No contract instances that match${criteriaDescription} are owned by this project`);
        }
        return ownedProxies;
    }
    // Dependency Controller
    deployDependencies() {
        return __awaiter(this, void 0, void 0, function* () {
            yield async_1.allPromisesOrError(lodash_1.map(this.projectFile.dependencies, (version, dep) => this.deployDependencyIfNeeded(dep, version)));
        });
    }
    // DependencyController
    deployDependencyIfNeeded(depName, depVersion) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const dependency = new Dependency_1.default(depName, depVersion);
                if (dependency.isDeployedOnNetwork(this.network) || this.networkFile.dependencyHasMatchingCustomDeploy(depName))
                    return;
                upgrades_1.Loggy.spin(__filename, 'deployDependencyIfNeeded', `deploy-dependency-${depName}`, `Deploying ${depName} dependency to network ${this.network}`);
                const deployment = yield dependency.deploy(this.txParams);
                this.networkFile.setDependency(depName, {
                    package: (yield deployment.getProjectPackage()).address,
                    version: deployment.version,
                    customDeploy: true,
                });
                upgrades_1.Loggy.succeed(`deploy-dependency-${depName}`);
            }
            catch (error) {
                error.message = `Failed deployment of dependency ${depName} with error: ${error.message}`;
                throw error;
            }
        });
    }
    // DependencyController
    handleDependenciesLink() {
        return __awaiter(this, void 0, void 0, function* () {
            yield async_1.allPromisesOrError(lodash_1.concat(lodash_1.map(this.projectFile.dependencies, (version, dep) => this.linkDependency(dep, version)), lodash_1.map(this.networkFile.dependenciesNamesMissingFromPackage(), dep => this.unlinkDependency(dep))));
        });
    }
    // DependencyController
    unlinkDependency(depName) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (yield this.project.hasDependency(depName)) {
                    upgrades_1.Loggy.spin(__filename, 'unlinkDependency', `unlink-dependency-${depName}`, `Unlinking dependency ${depName}`);
                    yield this.project.unsetDependency(depName);
                    upgrades_1.Loggy.succeed(`unlink-dependency-${depName}`);
                }
                this.networkFile.unsetDependency(depName);
            }
            catch (error) {
                throw Error(`Failed to unlink dependency ${depName} with error: ${error.message}`);
            }
        });
    }
    // DependencyController
    linkDependency(depName, depVersion) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (this.networkFile.dependencyHasMatchingCustomDeploy(depName)) {
                    upgrades_1.Loggy.onVerbose(__filename, 'linkDependency', `link-dependency-${depName}`, `Using custom deployment of ${depName}`);
                    const depInfo = this.networkFile.getDependency(depName);
                    return yield this.project.setDependency(depName, depInfo.package, depInfo.version);
                }
                if (!this.networkFile.dependencySatisfiesVersionRequirement(depName)) {
                    const dependencyInfo = new Dependency_1.default(depName, depVersion).getNetworkFile(this.network);
                    if (!dependencyInfo.packageAddress)
                        throw Error(`Dependency '${depName}' has not been published to network '${this.network}', so it cannot be linked. Hint: you can create a custom deployment of all unpublished dependencies by running 'openzeppelin push --deploy-dependencies'.`);
                    upgrades_1.Loggy.spin(__filename, 'linkDependency', `link-dependency-${depName}`, `Linking dependency ${depName} ${dependencyInfo.version}`);
                    yield this.project.setDependency(depName, dependencyInfo.packageAddress, dependencyInfo.version);
                    const depInfo = {
                        package: dependencyInfo.packageAddress,
                        version: dependencyInfo.version,
                    };
                    this.networkFile.setDependency(depName, depInfo);
                    upgrades_1.Loggy.succeed(`link-dependency-${depName}`, `Linked dependency ${depName} ${dependencyInfo.version}`);
                }
            }
            catch (error) {
                error.message = `Failed to link dependency ${depName}@${depVersion} with error: ${error.message}`;
                throw error;
            }
        });
    }
    // Contract model
    _errorForContractDeployed(packageName, contractAlias) {
        if (packageName === this.projectFile.name) {
            return this._errorForLocalContractDeployed(contractAlias);
        }
        else if (!this.projectFile.hasDependency(packageName)) {
            return `Dependency ${packageName} not found in project.`;
        }
        else if (!this.networkFile.hasDependency(packageName)) {
            return `Dependency ${packageName} has not been linked yet. Please run 'openzeppelin push'.`;
        }
        else if (!new Dependency_1.default(packageName).projectFile.contract(contractAlias)) {
            return `Contract ${contractAlias} is not provided by ${packageName}.`;
        }
    }
    updateManifestVersionsIfNeeded(version) {
        if (this.networkFile.manifestVersion !== ManifestVersion_2.MANIFEST_VERSION)
            this.networkFile.manifestVersion = version;
        if (this.projectFile.manifestVersion !== ManifestVersion_2.MANIFEST_VERSION)
            this.projectFile.manifestVersion = version;
    }
}
exports.default = NetworkController;
//# sourceMappingURL=NetworkController.js.map