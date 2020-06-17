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
const Proxy_1 = __importDefault(require("../proxy/Proxy"));
const Logger_1 = require("../utils/Logger");
const Package_1 = __importDefault(require("../application/Package"));
const Transactions_1 = __importDefault(require("../utils/Transactions"));
const Addresses_1 = require("../utils/Addresses");
const Bytecode_1 = require("../utils/Bytecode");
const Semver_1 = require("../utils/Semver");
const ABIs_1 = require("../utils/ABIs");
const ProxyFactory_1 = __importDefault(require("../proxy/ProxyFactory"));
class BaseSimpleProject {
    constructor(name, proxyFactory, txParams = {}) {
        this.txParams = txParams;
        this.name = name;
        this.implementations = {};
        this.dependencies = {};
        this.proxyFactory = proxyFactory;
    }
    setImplementation(contract, contractName) {
        return __awaiter(this, void 0, void 0, function* () {
            Logger_1.Loggy.onVerbose(__filename, 'setImplementation', `set-implementation-for-${contract.schema.contractName}`, `Deploying logic contract for ${contract.schema.contractName}`);
            if (!contractName)
                contractName = contract.schema.contractName;
            const implementation = yield Transactions_1.default.deployContract(contract, [], this.txParams);
            yield this.registerImplementation(contractName, {
                address: implementation.address,
                bytecodeHash: Bytecode_1.bytecodeDigest(contract.schema.linkedDeployedBytecode),
            });
            return implementation;
        });
    }
    unsetImplementation(contractName) {
        delete this.implementations[contractName];
    }
    registerImplementation(contractName, { address, bytecodeHash }) {
        return __awaiter(this, void 0, void 0, function* () {
            this.implementations[contractName] = { address, bytecodeHash };
        });
    }
    // TS-TODO: review return type
    // TS-TODO: review parameter type (it's packageName?+(contractName|contract))
    getImplementation({ packageName, contractName, contract, }) {
        return __awaiter(this, void 0, void 0, function* () {
            contractName = contractName || contract.schema.contractName;
            return !packageName || packageName === this.name
                ? this.implementations[contractName] && this.implementations[contractName].address
                : this._getDependencyImplementation(packageName, contractName);
        });
    }
    getDependencyPackage(name) {
        return __awaiter(this, void 0, void 0, function* () {
            return Package_1.default.fetch(this.dependencies[name].package);
        });
    }
    getDependencyVersion(name) {
        return Semver_1.toSemanticVersion(this.dependencies[name].version);
    }
    hasDependency(name) {
        return !!this.dependencies[name];
    }
    setDependency(name, packageAddress, version) {
        // TODO: Validate that the package exists and has thatversion
        this.dependencies[name] = { package: packageAddress, version };
    }
    unsetDependency(name) {
        delete this.dependencies[name];
    }
    createProxy(contract, { packageName, contractName, initMethod, initArgs, redeployIfChanged, admin } = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!lodash_1.isEmpty(initArgs) && !initMethod)
                initMethod = 'initialize';
            const implementationAddress = yield this._getOrDeployImplementation(contract, packageName, contractName, redeployIfChanged);
            const initCallData = this._getAndLogInitCallData(contract, initMethod, initArgs, implementationAddress, 'Creating');
            const proxyAdmin = admin || (yield this.getAdminAddress());
            const proxy = yield Proxy_1.default.deploy(implementationAddress, proxyAdmin, initCallData, this.txParams);
            Logger_1.Loggy.succeed(`create-proxy`, `Instance created at ${proxy.address}`);
            return contract.at(proxy.address);
        });
    }
    createProxyWithSalt(contract, salt, signature, { packageName, contractName, initMethod, initArgs, redeployIfChanged, admin } = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!lodash_1.isEmpty(initArgs) && !initMethod)
                initMethod = 'initialize';
            const implementationAddress = yield this._getOrDeployImplementation(contract, packageName, contractName, redeployIfChanged);
            const initCallData = this._getAndLogInitCallData(contract, initMethod, initArgs, implementationAddress, 'Creating');
            const proxyFactory = yield this.ensureProxyFactory();
            const adminAddress = admin || (yield this.getAdminAddress());
            const proxy = yield proxyFactory.createProxy(salt, implementationAddress, adminAddress, initCallData, signature);
            Logger_1.Loggy.succeed(`create-proxy`, `Instance created at ${proxy.address}`);
            return contract.at(proxy.address);
        });
    }
    createMinimalProxy(contract, { packageName, contractName, initMethod, initArgs, redeployIfChanged } = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!lodash_1.isEmpty(initArgs) && !initMethod)
                initMethod = 'initialize';
            const implementationAddress = yield this._getOrDeployImplementation(contract, packageName, contractName, redeployIfChanged);
            const initCallData = this._getAndLogInitCallData(contract, initMethod, initArgs, implementationAddress, 'Creating');
            const proxyFactory = yield this.ensureProxyFactory();
            const proxy = yield proxyFactory.createMinimalProxy(implementationAddress, initCallData);
            Logger_1.Loggy.succeed(`create-proxy`, `Instance created at ${proxy.address}`);
            return contract.at(proxy.address);
        });
    }
    // REFACTOR: De-duplicate from AppProject
    getProxyDeploymentAddress(salt, sender) {
        return __awaiter(this, void 0, void 0, function* () {
            const proxyFactory = yield this.ensureProxyFactory();
            return proxyFactory.getDeploymentAddress(salt, sender);
        });
    }
    // REFACTOR: De-duplicate from AppProject and test
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
    ensureProxyFactory() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.proxyFactory) {
                this.proxyFactory = yield ProxyFactory_1.default.deploy(this.txParams);
            }
            return this.proxyFactory;
        });
    }
    _getOrDeployOwnImplementation(contract, contractName, redeployIfChanged) {
        return __awaiter(this, void 0, void 0, function* () {
            const existing = this.implementations[contractName];
            const contractChanged = existing && existing.bytecodeHash !== Bytecode_1.bytecodeDigest(contract.schema.linkedDeployedBytecode);
            const shouldRedeploy = !existing || (redeployIfChanged && contractChanged);
            if (!shouldRedeploy)
                return existing.address;
            const newInstance = yield this.setImplementation(contract, contractName);
            return newInstance.address;
        });
    }
    _getDependencyImplementation(packageName, contractName) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.hasDependency(packageName))
                return null;
            const { package: packageAddress, version } = this.dependencies[packageName];
            const thepackage = yield Package_1.default.fetch(packageAddress, this.txParams);
            return thepackage.getImplementation(version, contractName);
        });
    }
    _setUpgradeParams(proxyAddress, contract, { packageName, contractName, initMethod: initMethodName, initArgs, redeployIfChanged } = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const implementationAddress = yield this._getOrDeployImplementation(contract, packageName, contractName, redeployIfChanged);
            const initCallData = this._getAndLogInitCallData(contract, initMethodName, initArgs, implementationAddress, 'Upgrading', proxyAddress);
            return {
                initCallData,
                implementationAddress,
                pAddress: Addresses_1.toAddress(proxyAddress),
            };
        });
    }
    _getOrDeployImplementation(contract, packageName, contractName, redeployIfChanged) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!contractName)
                contractName = contract.schema.contractName;
            const implementation = !packageName || packageName === this.name
                ? yield this._getOrDeployOwnImplementation(contract, contractName, redeployIfChanged)
                : yield this._getDependencyImplementation(packageName, contractName);
            if (!implementation)
                throw Error(`Could not retrieve or deploy contract ${packageName}/${contractName}`);
            return implementation;
        });
    }
    _getAndLogInitCallData(contract, initMethodName, initArgs, implementationAddress, actionLabel, proxyAddress) {
        const logReference = actionLabel === 'Creating' ? 'create-proxy' : `upgrade-proxy-${proxyAddress}`;
        const logMessage = actionLabel === 'Creating'
            ? `Creating instance for contract at ${implementationAddress}`
            : `Upgrading instance at ${proxyAddress}`;
        if (initMethodName) {
            const { method: initMethod, callData } = ABIs_1.buildCallData(contract, initMethodName, initArgs);
            if (actionLabel)
                Logger_1.Loggy.spin(__filename, '_getAndLogInitCallData', logReference, `${logMessage} and calling ${ABIs_1.callDescription(initMethod, initArgs)}`);
            return callData;
        }
        else {
            if (actionLabel)
                Logger_1.Loggy.spin(__filename, '_getAndLogInitCallData', logReference, logMessage);
            return null;
        }
    }
}
exports.default = BaseSimpleProject;
//# sourceMappingURL=BaseSimpleProject.js.map