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
const lodash_1 = require("lodash");
const App_1 = __importDefault(require("../application/App"));
const Package_1 = __importDefault(require("../application/Package"));
const ProxyAdmin_1 = __importDefault(require("../proxy/ProxyAdmin"));
const ProxyAdminProjectMixin_1 = __importDefault(require("./mixin/ProxyAdminProjectMixin"));
const BasePackageProject_1 = __importDefault(require("./BasePackageProject"));
const DeployError_1 = require("../utils/errors/DeployError");
const Semver_1 = require("../utils/Semver");
const ProxyFactory_1 = __importDefault(require("../proxy/ProxyFactory"));
const ABIs_1 = require("../utils/ABIs");
const Logger_1 = require("../utils/Logger");
const DEFAULT_NAME = 'main';
const DEFAULT_VERSION = '0.1.0';
class BaseAppProject extends BasePackageProject_1.default {
    constructor(app, name = DEFAULT_NAME, version = DEFAULT_VERSION, proxyAdmin, proxyFactory, txParams = {}) {
        super(txParams);
        this.app = app;
        this.name = name;
        this.proxyAdmin = proxyAdmin;
        this.proxyFactory = proxyFactory;
        this.version = Semver_1.semanticVersionToString(version);
        this.txParams = txParams;
    }
    // REFACTOR: Evaluate merging this logic with CLI's ProjectDeployer classes
    static fetchOrDeploy(name = DEFAULT_NAME, version = DEFAULT_VERSION, txParams = {}, { appAddress, packageAddress, proxyAdminAddress, proxyFactoryAddress } = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            let thepackage;
            let directory;
            let app;
            version = Semver_1.semanticVersionToString(version);
            try {
                if (appAddress) {
                    app = yield App_1.default.fetch(appAddress, txParams);
                }
                else {
                    Logger_1.Loggy.spin(__filename, 'fetchOrDeploy', `publish-project`, 'Preparing everything to publish the project. Deploying new App contract');
                    app = yield App_1.default.deploy(txParams);
                }
                if (packageAddress) {
                    thepackage = Package_1.default.fetch(packageAddress, txParams);
                }
                else if (yield app.hasPackage(name, version)) {
                    thepackage = (yield app.getPackage(name)).package;
                }
                else {
                    Logger_1.Loggy.spin(__filename, 'fetchOrDeploy', `publish-project`, 'Deploying new Package contract');
                    thepackage = yield Package_1.default.deploy(txParams);
                }
                if (yield thepackage.hasVersion(version)) {
                    directory = yield thepackage.getDirectory(version);
                }
                else {
                    Logger_1.Loggy.spin(__filename, 'fetchOrDeploy', `publish-project`, `Adding new version ${version} and creating ImplementationDirectory contract`);
                    directory = yield thepackage.newVersion(version);
                    const succeedText = !appAddress || !packageAddress ? `Project structure deployed` : `Version ${version} deployed`;
                    Logger_1.Loggy.succeed(`publish-project`, succeedText);
                }
                if (!(yield app.hasPackage(name, version)))
                    yield app.setPackage(name, thepackage.address, version);
                const proxyAdmin = proxyAdminAddress
                    ? yield ProxyAdmin_1.default.fetch(proxyAdminAddress, txParams)
                    : null;
                const proxyFactory = ProxyFactory_1.default.tryFetch(proxyFactoryAddress, txParams);
                const project = new AppProject(app, name, version, proxyAdmin, proxyFactory, txParams);
                project.directory = directory;
                project.package = thepackage;
                return project;
            }
            catch (error) {
                throw new DeployError_1.DeployError(error, { thepackage, directory, app });
            }
        });
    }
    // REFACTOR: This code is similar to the ProxyAdminProjectDeployer, consider unifying them
    static fromProxyAdminProject(proxyAdminProject, version = DEFAULT_VERSION, existingAddresses = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const appProject = yield this.fetchOrDeploy(proxyAdminProject.name, version, proxyAdminProject.txParams, existingAddresses);
            yield Promise.all(lodash_1.concat(lodash_1.map(proxyAdminProject.implementations, (contractInfo, contractAlias) => appProject.registerImplementation(contractAlias, contractInfo)), lodash_1.map(proxyAdminProject.dependencies, (dependencyInfo, dependencyName) => appProject.setDependency(dependencyName, dependencyInfo.package, dependencyInfo.version))));
            return appProject;
        });
    }
    // REFACTOR: This code is similar to the SimpleProjectDeployer, consider unifying them
    static fromSimpleProject(simpleProject, version = DEFAULT_VERSION, existingAddresses = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const appProject = yield this.fetchOrDeploy(simpleProject.name, version, simpleProject.txParams, existingAddresses);
            yield Promise.all(lodash_1.concat(lodash_1.map(simpleProject.implementations, (contractInfo, contractAlias) => appProject.registerImplementation(contractAlias, contractInfo)), lodash_1.map(simpleProject.dependencies, (dependencyInfo, dependencyName) => appProject.setDependency(dependencyName, dependencyInfo.package, dependencyInfo.version))));
            return appProject;
        });
    }
    newVersion(version) {
        const _super = Object.create(null, {
            newVersion: { get: () => super.newVersion }
        });
        return __awaiter(this, void 0, void 0, function* () {
            version = Semver_1.semanticVersionToString(version);
            const directory = yield _super.newVersion.call(this, version);
            const thepackage = yield this.getProjectPackage();
            yield this.app.setPackage(this.name, thepackage.address, version);
            return directory;
        });
    }
    getAdminAddress() {
        return new Promise(resolve => resolve(this.proxyAdmin ? this.proxyAdmin.address : null));
    }
    getApp() {
        return this.app;
    }
    ensureProxyAdmin() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.proxyAdmin) {
                this.proxyAdmin = yield ProxyAdmin_1.default.deploy(this.txParams);
            }
            return this.proxyAdmin;
        });
    }
    ensureProxyFactory() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.proxyFactory) {
                this.proxyFactory = yield ProxyFactory_1.default.deploy(this.txParams);
            }
            return this.proxyFactory;
        });
    }
    getProjectPackage() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.package) {
                const packageInfo = yield this.app.getPackage(this.name);
                this.package = packageInfo.package;
            }
            return this.package;
        });
    }
    getCurrentDirectory() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.directory)
                this.directory = yield this.app.getProvider(this.name);
            return this.directory;
        });
    }
    getCurrentVersion() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.version;
        });
    }
    getImplementation({ packageName, contractName, contract, }) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.app.getImplementation(packageName || this.name, contractName || contract.schema.contractName);
        });
    }
    createProxy(contract, contractInterface = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const { contractName, packageName, initMethod, initArgs, admin } = this.getContractInterface(contract, contractInterface);
            const proxyAdmin = admin || (yield this.ensureProxyAdmin()).address;
            return this.app.createProxy(contract, packageName, contractName, proxyAdmin, initMethod, initArgs);
        });
    }
    getContractInterface(contract, opts = {}) {
        let { contractName, packageName, initMethod } = opts;
        if (!contractName) {
            contractName = contract.schema.contractName;
        }
        if (!packageName) {
            packageName = this.name;
        }
        if (!lodash_1.isEmpty(opts.initArgs) && !initMethod) {
            initMethod = 'initialize';
        }
        return Object.assign(Object.assign({}, opts), { contractName, packageName, initMethod });
    }
    createProxyWithSalt(contract, salt, signature, contractInterface = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const { contractName, packageName, initMethod, initArgs, admin } = this.getContractInterface(contract, contractInterface);
            const implementationAddress = yield this.app.getImplementation(packageName, contractName);
            const initCallData = this.getAndLogInitCallData(contract, initMethod, initArgs, implementationAddress, 'Creating');
            const proxyFactory = yield this.ensureProxyFactory();
            const proxyAdmin = admin || (yield this.ensureProxyAdmin()).address;
            const proxy = yield proxyFactory.createProxy(salt, implementationAddress, proxyAdmin, initCallData, signature);
            Logger_1.Loggy.succeed(`create-proxy`, `Instance created at ${proxy.address}`);
            return contract.at(proxy.address);
        });
    }
    createMinimalProxy(contract, contractInterface = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const { contractName, packageName, initMethod, initArgs } = this.getContractInterface(contract, contractInterface);
            const implementationAddress = yield this.app.getImplementation(packageName, contractName);
            const initCallData = this.getAndLogInitCallData(contract, initMethod, initArgs, implementationAddress, 'Creating');
            const proxyFactory = yield this.ensureProxyFactory();
            const proxy = yield proxyFactory.createMinimalProxy(implementationAddress, initCallData);
            Logger_1.Loggy.succeed(`create-proxy`, `Instance created at ${proxy.address}`);
            return contract.at(proxy.address);
        });
    }
    // REFACTOR: De-duplicate from BaseSimpleProject
    getProxyDeploymentAddress(salt, sender) {
        return __awaiter(this, void 0, void 0, function* () {
            const proxyFactory = yield this.ensureProxyFactory();
            return proxyFactory.getDeploymentAddress(salt, sender);
        });
    }
    // REFACTOR: De-duplicate from BaseSimpleProject
    getProxyDeploymentSigner(contract, salt, signature, { packageName, contractName, initMethod, initArgs, admin } = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const proxyFactory = yield this.ensureProxyFactory();
            const implementationAddress = yield this.getImplementation({
                packageName,
                contractName,
                contract,
            });
            if (!implementationAddress)
                throw new Error(`Contract ${contractName ||
                    contract.schema.contractName} was not found or is not deployed in the current network.`);
            const adminAddress = admin || (yield this.getAdminAddress());
            const initData = initMethod ? ABIs_1.buildCallData(contract, initMethod, initArgs).callData : null;
            return proxyFactory.getSigner(salt, implementationAddress, adminAddress, initData, signature);
        });
    }
    upgradeProxy(proxyAddress, contract, contractInterface = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const { contractName, packageName, initMethod, initArgs } = this.getContractInterface(contract, contractInterface);
            const implementationAddress = yield this.getImplementation({
                packageName,
                contractName,
            });
            return this.proxyAdmin.upgradeProxy(proxyAddress, implementationAddress, contract, initMethod, initArgs);
        });
    }
    getDependencyPackage(name) {
        return __awaiter(this, void 0, void 0, function* () {
            const packageInfo = yield this.app.getPackage(name);
            return packageInfo.package;
        });
    }
    getDependencyVersion(name) {
        return __awaiter(this, void 0, void 0, function* () {
            const packageInfo = yield this.app.getPackage(name);
            return packageInfo.version;
        });
    }
    hasDependency(name) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.app.hasPackage(name);
        });
    }
    setDependency(name, packageAddress, version) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.app.setPackage(name, packageAddress, version);
        });
    }
    unsetDependency(name) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.app.unsetPackage(name);
        });
    }
    // REFACTOR: Deduplicate from BaseSimpleProject
    getAndLogInitCallData(contract, initMethodName, initArgs, implementationAddress, actionLabel, proxyAddress) {
        const logReference = actionLabel === 'Creating' ? 'create-proxy' : `upgrade-proxy-${proxyAddress}`;
        const logMessage = actionLabel === 'Creating'
            ? `Creating instance for contract at ${implementationAddress}`
            : `Upgrading instance at ${proxyAddress}`;
        if (initMethodName) {
            const { method: initMethod, callData } = ABIs_1.buildCallData(contract, initMethodName, initArgs);
            if (actionLabel)
                Logger_1.Loggy.spin(__filename, 'getAndLogInitCallData', logReference, `${logMessage} and calling ${ABIs_1.callDescription(initMethod, initArgs)}`);
            return callData;
        }
        else {
            if (actionLabel) {
                Logger_1.Loggy.spin(__filename, 'getAndLogInitCallData', logReference, logMessage);
            }
            return null;
        }
    }
}
// Mixings produce value but not type
// We have to export full class with type & callable
class AppProject extends ProxyAdminProjectMixin_1.default(BaseAppProject) {
}
exports.default = AppProject;
//# sourceMappingURL=AppProject.js.map