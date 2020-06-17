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
const Proxy_1 = __importDefault(require("../proxy/Proxy"));
const Logger_1 = require("../utils/Logger");
const ZWeb3_1 = __importDefault(require("../artifacts/ZWeb3"));
const BaseSimpleProject_1 = __importDefault(require("./BaseSimpleProject"));
class SimpleProject extends BaseSimpleProject_1.default {
    constructor(name = 'main', proxyFactory, txParams = {}) {
        super(name, proxyFactory, txParams);
    }
    upgradeProxy(proxyAddress, contract, contractParams = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const { implementationAddress, pAddress, initCallData } = yield this._setUpgradeParams(proxyAddress, contract, contractParams);
            Logger_1.Loggy.spin(__filename, 'upgradeProxy', `action-proxy-${pAddress}`, `Upgrading instance at ${pAddress}`);
            const proxy = Proxy_1.default.at(pAddress, this.txParams);
            yield proxy.upgradeTo(implementationAddress, initCallData);
            Logger_1.Loggy.succeed(`action-proxy-${pAddress}`, `Instance at ${pAddress} upgraded`);
            return contract.at(proxyAddress);
        });
    }
    changeProxyAdmin(proxyAddress, newAdmin) {
        return __awaiter(this, void 0, void 0, function* () {
            Logger_1.Loggy.spin(__filename, 'changeProxyAdmin', `change-proxy-admin`, `Changing admin for proxy ${proxyAddress} to ${newAdmin}`);
            const proxy = Proxy_1.default.at(proxyAddress, this.txParams);
            yield proxy.changeAdmin(newAdmin);
            Logger_1.Loggy.succeed('change-proxy-admin', `Admin for proxy ${proxyAddress} set to ${newAdmin}`);
            return proxy;
        });
    }
    getAdminAddress() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.txParams.from)
                return new Promise(resolve => resolve(this.txParams.from));
            else
                return ZWeb3_1.default.defaultAccount();
        });
    }
}
exports.default = SimpleProject;
//# sourceMappingURL=SimpleProject.js.map