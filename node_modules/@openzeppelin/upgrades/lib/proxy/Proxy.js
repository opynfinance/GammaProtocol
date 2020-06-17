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
const web3_utils_1 = require("web3-utils");
const ZWeb3_1 = __importDefault(require("../artifacts/ZWeb3"));
const Contracts_1 = __importDefault(require("../artifacts/Contracts"));
const Addresses_1 = require("../utils/Addresses");
const Transactions_1 = __importDefault(require("../utils/Transactions"));
const Constants_1 = require("../utils/Constants");
class Proxy {
    constructor(contract, txParams = {}) {
        this.address = Addresses_1.toAddress(contract);
        this.contract = contract;
        this.txParams = txParams;
    }
    static at(contractOrAddress, txParams = {}) {
        const ProxyContract = Contracts_1.default.getFromLib('AdminUpgradeabilityProxy');
        const contract = ProxyContract.at(Addresses_1.toAddress(contractOrAddress));
        return new this(contract, txParams);
    }
    static deploy(implementation, admin, initData, txParams = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const ProxyContract = Contracts_1.default.getFromLib('AdminUpgradeabilityProxy');
            const contractParams = [Addresses_1.toAddress(implementation), Addresses_1.toAddress(admin), initData || Buffer.from('')];
            const contract = yield Transactions_1.default.deployContract(ProxyContract, contractParams, txParams);
            return new this(contract, txParams);
        });
    }
    upgradeTo(address, migrateData) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.checkAdmin();
            return migrateData
                ? Transactions_1.default.sendTransaction(this.contract.methods.upgradeToAndCall, [Addresses_1.toAddress(address), migrateData], this.txParams)
                : Transactions_1.default.sendTransaction(this.contract.methods.upgradeTo, [Addresses_1.toAddress(address)], this.txParams);
        });
    }
    changeAdmin(newAdmin) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.checkAdmin();
            return Transactions_1.default.sendTransaction(this.contract.methods.changeAdmin, [newAdmin], this.txParams);
        });
    }
    implementation() {
        return __awaiter(this, void 0, void 0, function* () {
            const hashedLabel = web3_utils_1.toHex(web3_utils_1.toBN(web3_utils_1.sha3(Constants_1.IMPLEMENTATION_LABEL)).sub(web3_utils_1.toBN(1)));
            let storage = yield this.getStorageAt(hashedLabel);
            // TODO-v3: Remove deprecated 'zos' support
            if (storage === '0x0') {
                storage = yield this.getStorageAt(web3_utils_1.sha3(Constants_1.DEPRECATED_IMPLEMENTATION_LABEL));
            }
            return Addresses_1.uint256ToAddress(storage);
        });
    }
    admin() {
        return __awaiter(this, void 0, void 0, function* () {
            const hashedLabel = web3_utils_1.toHex(web3_utils_1.toBN(web3_utils_1.sha3(Constants_1.ADMIN_LABEL)).sub(web3_utils_1.toBN(1)));
            let storage = yield this.getStorageAt(hashedLabel);
            // TODO-v3: Remove deprecated 'zos' support
            if (storage === '0x0') {
                storage = yield this.getStorageAt(web3_utils_1.sha3(Constants_1.DEPRECATED_ADMIN_LABEL));
            }
            return Addresses_1.uint256ToAddress(storage);
        });
    }
    getStorageAt(position) {
        return __awaiter(this, void 0, void 0, function* () {
            return ZWeb3_1.default.eth.getStorageAt(this.address, position);
        });
    }
    checkAdmin() {
        return __awaiter(this, void 0, void 0, function* () {
            const currentAdmin = yield this.admin();
            const { from } = this.txParams;
            // TODO: If no `from` is set, load which is the default account and use it to compare against the current admin
            if (from && currentAdmin !== from)
                throw new Error(`Cannot modify proxy from non-admin account: current admin is ${currentAdmin} and sender is ${from}`);
        });
    }
}
exports.default = Proxy;
//# sourceMappingURL=Proxy.js.map