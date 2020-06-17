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
const Logger_1 = require("../utils/Logger");
const Proxy_1 = __importDefault(require("../proxy/Proxy"));
const Contracts_1 = __importDefault(require("../artifacts/Contracts"));
const Package_1 = __importDefault(require("../application/Package"));
const ImplementationDirectory_1 = __importDefault(require("../application/ImplementationDirectory"));
const Addresses_1 = require("../utils/Addresses");
const ABIs_1 = require("../utils/ABIs");
const Semver_1 = require("../utils/Semver");
const Transactions_1 = __importDefault(require("../utils/Transactions"));
class App {
    constructor(appContract, txParams = {}) {
        this.appContract = appContract;
        this.txParams = txParams;
    }
    static fetch(address, txParams = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const appContract = (yield this.getContractClass()).at(address);
            return new this(appContract, txParams);
        });
    }
    static deploy(txParams = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const appContract = yield Transactions_1.default.deployContract(this.getContractClass(), [], txParams);
            Logger_1.Loggy.onVerbose(__filename, 'deploy', `deployed-app`, `Deployed App at ${appContract.address}`);
            return new this(appContract, txParams);
        });
    }
    static getContractClass() {
        return Contracts_1.default.getFromLib('App');
    }
    getPackage(name) {
        return __awaiter(this, void 0, void 0, function* () {
            const { ['0']: address, ['1']: version } = yield this.appContract.methods.getPackage(name).call();
            const thepackage = Package_1.default.fetch(address, Object.assign({}, this.txParams));
            return { package: thepackage, version };
        });
    }
    hasPackage(name, expectedVersion) {
        return __awaiter(this, void 0, void 0, function* () {
            const { ['0']: address, ['1']: version } = yield this.appContract.methods.getPackage(name).call();
            return !Addresses_1.isZeroAddress(address) && (!expectedVersion || Semver_1.semanticVersionEqual(expectedVersion, version));
        });
    }
    setPackage(name, packageAddress, version) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield Transactions_1.default.sendTransaction(this.appContract.methods.setPackage, [name, Addresses_1.toAddress(packageAddress), Semver_1.toSemanticVersion(version)], Object.assign({}, this.txParams));
        });
    }
    unsetPackage(name) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield Transactions_1.default.sendTransaction(this.appContract.methods.unsetPackage, [name], Object.assign({}, this.txParams));
        });
    }
    get address() {
        return this.appContract.address;
    }
    get contract() {
        return this.appContract;
    }
    getImplementation(packageName, contractName) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.appContract.methods.getImplementation(packageName, contractName).call();
        });
    }
    hasProvider(name) {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.getProvider(name)) != null;
        });
    }
    getProvider(name) {
        return __awaiter(this, void 0, void 0, function* () {
            const address = yield this.appContract.methods.getProvider(name).call();
            if (Addresses_1.isZeroAddress(address))
                return null;
            return ImplementationDirectory_1.default.fetch(address, Object.assign({}, this.txParams));
        });
    }
    createProxy(contract, packageName, contractName, proxyAdmin, initMethodName, initArgs) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!lodash_1.isEmpty(initArgs) && !initMethodName)
                initMethodName = 'initialize';
            const implementation = yield this.getImplementation(packageName, contractName);
            const proxy = initMethodName === undefined
                ? yield this._createProxy(packageName, contractName, implementation, proxyAdmin)
                : yield this._createProxyAndCall(contract, packageName, contractName, implementation, proxyAdmin, initMethodName, initArgs);
            Logger_1.Loggy.succeed(`create-proxy`, `${packageName} ${contractName} instance created at ${proxy.address}`);
            return contract.at(proxy.address);
        });
    }
    _createProxy(packageName, contractName, implementation, proxyAdmin) {
        return __awaiter(this, void 0, void 0, function* () {
            const initializeData = Buffer.from('');
            Logger_1.Loggy.spin(__filename, '_createProxy', `create-proxy`, `Creating ${packageName} ${contractName} proxy`);
            return Proxy_1.default.deploy(implementation, proxyAdmin, initializeData, this.txParams);
        });
    }
    _createProxyAndCall(contract, packageName, contractName, implementation, proxyAdmin, initMethodName, initArgs) {
        return __awaiter(this, void 0, void 0, function* () {
            const { method: initMethod, callData } = ABIs_1.buildCallData(contract, initMethodName, initArgs);
            Logger_1.Loggy.spin(__filename, '_createProxyAndCall', `create-proxy`, `Creating ${packageName}/${contractName} instance and calling ${ABIs_1.callDescription(initMethod, initArgs)}`);
            return Proxy_1.default.deploy(implementation, proxyAdmin, callData, this.txParams);
        });
    }
}
exports.default = App;
//# sourceMappingURL=App.js.map