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
const ProxyAdmin_1 = __importDefault(require("../proxy/ProxyAdmin"));
const BaseSimpleProject_1 = __importDefault(require("./BaseSimpleProject"));
const ProxyFactory_1 = __importDefault(require("../proxy/ProxyFactory"));
const ProxyAdminProjectMixin_1 = __importDefault(require("./mixin/ProxyAdminProjectMixin"));
class BaseProxyAdminProject extends BaseSimpleProject_1.default {
    constructor(name = 'main', proxyAdmin, proxyFactory, txParams = {}) {
        super(name, proxyFactory, txParams);
        this.proxyAdmin = proxyAdmin;
    }
    static fetch(name = 'main', txParams = {}, proxyAdminAddress, proxyFactoryAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            const proxyAdmin = proxyAdminAddress ? yield ProxyAdmin_1.default.fetch(proxyAdminAddress, txParams) : null;
            const proxyFactory = proxyFactoryAddress ? yield ProxyFactory_1.default.fetch(proxyFactoryAddress, txParams) : null;
            return new ProxyAdminProject(name, proxyAdmin, proxyFactory, txParams);
        });
    }
    createProxy(contract, contractParams = {}) {
        const _super = Object.create(null, {
            createProxy: { get: () => super.createProxy }
        });
        return __awaiter(this, void 0, void 0, function* () {
            if (!contractParams.admin)
                yield this.ensureProxyAdmin();
            return _super.createProxy.call(this, contract, contractParams);
        });
    }
    createProxyWithSalt(contract, salt, signature, contractParams = {}) {
        const _super = Object.create(null, {
            createProxyWithSalt: { get: () => super.createProxyWithSalt }
        });
        return __awaiter(this, void 0, void 0, function* () {
            if (!contractParams.admin)
                yield this.ensureProxyAdmin();
            return _super.createProxyWithSalt.call(this, contract, salt, signature, contractParams);
        });
    }
    upgradeProxy(proxyAddress, contract, contractParams = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const { initMethod: initMethodName, initArgs } = contractParams;
            const { implementationAddress, pAddress, initCallData } = yield this._setUpgradeParams(proxyAddress, contract, contractParams);
            Logger_1.Loggy.spin(__filename, 'upgradeProxy', `action-proxy-${pAddress}`, `Upgrading instance at ${pAddress}`);
            yield this.proxyAdmin.upgradeProxy(pAddress, implementationAddress, contract, initMethodName, initArgs);
            Logger_1.Loggy.succeed(`action-proxy-${pAddress}`, `Instance at ${pAddress} upgraded`);
            return contract.at(pAddress);
        });
    }
    getAdminAddress() {
        return new Promise(resolve => resolve(this.proxyAdmin ? this.proxyAdmin.address : null));
    }
    ensureProxyAdmin() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.proxyAdmin) {
                this.proxyAdmin = yield ProxyAdmin_1.default.deploy(this.txParams);
            }
            return this.proxyAdmin;
        });
    }
}
// Mixings produce value but not type
// We have to export full class with type & callable
class ProxyAdminProject extends ProxyAdminProjectMixin_1.default(BaseProxyAdminProject) {
}
exports.default = ProxyAdminProject;
//# sourceMappingURL=ProxyAdminProject.js.map