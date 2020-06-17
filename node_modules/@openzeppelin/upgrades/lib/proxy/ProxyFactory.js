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
const Logger_1 = require("../utils/Logger");
const Contracts_1 = __importDefault(require("../artifacts/Contracts"));
const Addresses_1 = require("../utils/Addresses");
const Transactions_1 = __importDefault(require("../utils/Transactions"));
const Proxy_1 = __importDefault(require("./Proxy"));
const MinimalProxy_1 = __importDefault(require("./MinimalProxy"));
class ProxyFactory {
    constructor(contract, txParams = {}) {
        this.contract = contract;
        this.address = Addresses_1.toAddress(contract);
        this.txParams = txParams;
    }
    static tryFetch(address, txParams = {}) {
        return address ? this.fetch(address, txParams) : null;
    }
    static fetch(address, txParams = {}) {
        const contract = Contracts_1.default.getFromLib('ProxyFactory').at(address);
        return new this(contract, txParams);
    }
    static deploy(txParams = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            Logger_1.Loggy.spin(__filename, 'deploy', 'deploy-proxy-factory', 'Deploying new ProxyFactory contract');
            const contract = yield Transactions_1.default.deployContract(Contracts_1.default.getFromLib('ProxyFactory'), [], txParams);
            Logger_1.Loggy.succeed('deploy-proxy-factory', `Deployed ProxyFactory at ${contract.address}`);
            return new this(contract, txParams);
        });
    }
    createMinimalProxy(logicAddress, initData) {
        return __awaiter(this, void 0, void 0, function* () {
            const args = [logicAddress, initData || Buffer.from('')];
            const { events, transactionHash } = yield Transactions_1.default.sendTransaction(this.contract.methods.deployMinimal, args, Object.assign({}, this.txParams));
            if (!events.ProxyCreated) {
                throw new Error(`Could not retrieve proxy deployment address from transaction ${transactionHash}`);
            }
            const address = events.ProxyCreated.returnValues.proxy;
            return MinimalProxy_1.default.at(address);
        });
    }
    createProxy(salt, logicAddress, proxyAdmin, initData, signature) {
        return __awaiter(this, void 0, void 0, function* () {
            const args = [salt, logicAddress, proxyAdmin, initData || Buffer.from('')];
            const method = signature ? this.contract.methods.deploySigned : this.contract.methods.deploy;
            if (signature)
                args.push(signature);
            const { events, transactionHash } = yield Transactions_1.default.sendTransaction(method, args, Object.assign({}, this.txParams));
            if (!events.ProxyCreated) {
                throw new Error(`Could not retrieve proxy deployment address from transaction ${transactionHash}`);
            }
            const address = (events.ProxyCreated.returnValues || events.ProxyCreated[0].returnValues).proxy;
            return Proxy_1.default.at(address, this.txParams);
        });
    }
    getSigner(salt, logicAddress, proxyAdmin, initData, signature) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.contract.methods
                .getSigner(salt, logicAddress, proxyAdmin, initData || Buffer.from(''), signature)
                .call();
        });
    }
    getDeploymentAddress(salt, sender) {
        return __awaiter(this, void 0, void 0, function* () {
            const actualSender = sender || (yield this.getDefaultSender());
            return this.contract.methods.getDeploymentAddress(salt, actualSender).call();
        });
    }
    getDefaultSender() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.txParams.from || (yield Contracts_1.default.getDefaultFromAddress());
        });
    }
}
exports.default = ProxyFactory;
//# sourceMappingURL=ProxyFactory.js.map