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
const Contracts_1 = __importDefault(require("../artifacts/Contracts"));
const Addresses_1 = require("../utils/Addresses");
const ABIs_1 = require("../utils/ABIs");
const Transactions_1 = __importDefault(require("../utils/Transactions"));
class ProxyAdmin {
    constructor(contract, txParams = {}) {
        this.contract = contract;
        this.address = Addresses_1.toAddress(contract);
        this.txParams = txParams;
    }
    static fetch(address, txParams = {}) {
        const contract = Contracts_1.default.getFromLib('ProxyAdmin').at(address);
        return new this(contract, txParams);
    }
    static deploy(txParams = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            Logger_1.Loggy.spin(__filename, 'deploy', `deploy-proxy-admin`, 'Setting everything up to create contract instances');
            const contract = yield Transactions_1.default.deployContract(Contracts_1.default.getFromLib('ProxyAdmin'), [], txParams);
            Logger_1.Loggy.succeed(`deploy-proxy-admin`);
            return new this(contract, txParams);
        });
    }
    getProxyImplementation(proxyAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.contract.methods.getProxyImplementation(proxyAddress).call(Object.assign({}, this.txParams));
        });
    }
    changeProxyAdmin(proxyAddress, newAdmin) {
        return __awaiter(this, void 0, void 0, function* () {
            Logger_1.Loggy.spin(__filename, 'changeProxyAdmin', `change-proxy-admin`, `Changing admin for proxy ${proxyAddress} to ${newAdmin}`);
            yield Transactions_1.default.sendTransaction(this.contract.methods.changeProxyAdmin, [proxyAddress, newAdmin], Object.assign({}, this.txParams));
            Logger_1.Loggy.succeed('change-proxy-admin', `Admin for proxy ${proxyAddress} set to ${newAdmin}`);
        });
    }
    upgradeProxy(proxyAddress, implementationAddress, contract, initMethodName, initArgs) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!lodash_1.isEmpty(initArgs) && !initMethodName)
                initMethodName = 'initialize';
            const receipt = initMethodName === undefined
                ? yield this._upgradeProxy(proxyAddress, implementationAddress)
                : yield this._upgradeProxyAndCall(proxyAddress, implementationAddress, contract, initMethodName, initArgs);
            Logger_1.Loggy.succeed(`upgrade-proxy-${proxyAddress}`, `Instance upgraded at ${proxyAddress}. Transaction receipt: ${receipt.transactionHash}`);
            return contract.at(proxyAddress);
        });
    }
    transferOwnership(newAdminOwner) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.checkOwner();
            Logger_1.Loggy.spin(__filename, 'transferOwnerShip', 'transfer-ownership', `Changing ownership of proxy admin to ${newAdminOwner}`);
            yield Transactions_1.default.sendTransaction(this.contract.methods.transferOwnership, [newAdminOwner], Object.assign({}, this.txParams));
            Logger_1.Loggy.succeed('transfer-ownership', `Proxy admin owner set to ${newAdminOwner}`);
        });
    }
    getOwner() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.contract.methods.owner().call(Object.assign({}, this.txParams));
        });
    }
    checkOwner() {
        return __awaiter(this, void 0, void 0, function* () {
            const currentOwner = yield this.getOwner();
            const { from } = this.txParams;
            if (from && currentOwner !== from) {
                throw new Error(`Cannot change ownership from non-owner account: current owner is ${currentOwner} and sender is ${from}`);
            }
        });
    }
    _upgradeProxy(proxyAddress, implementation) {
        return __awaiter(this, void 0, void 0, function* () {
            Logger_1.Loggy.spin(__filename, '_upgradeProxy', `upgrade-proxy-${proxyAddress}`, `Upgrading instance at ${proxyAddress}`);
            return Transactions_1.default.sendTransaction(this.contract.methods.upgrade, [proxyAddress, implementation], Object.assign({}, this.txParams));
        });
    }
    _upgradeProxyAndCall(proxyAddress, implementationAddress, contract, initMethodName, initArgs) {
        return __awaiter(this, void 0, void 0, function* () {
            const { method: initMethod, callData } = ABIs_1.buildCallData(contract, initMethodName, initArgs);
            Logger_1.Loggy.spin(__filename, '_upgradeProxyAndCall', `upgrade-proxy-${proxyAddress}`, `Upgrading instance at ${proxyAddress} and calling ${ABIs_1.callDescription(initMethod, initArgs)}`);
            return Transactions_1.default.sendTransaction(this.contract.methods.upgradeAndCall, [proxyAddress, implementationAddress, callData], Object.assign({}, this.txParams));
        });
    }
}
exports.default = ProxyAdmin;
//# sourceMappingURL=ProxyAdmin.js.map