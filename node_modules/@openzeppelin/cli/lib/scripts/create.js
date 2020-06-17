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
const stdout_1 = __importDefault(require("../utils/stdout"));
const NetworkController_1 = __importDefault(require("../models/network/NetworkController"));
const interfaces_1 = require("./interfaces");
const upgrades_1 = require("@openzeppelin/upgrades");
const input_1 = require("../utils/input");
function createProxy({ packageName, contractAlias, methodName, methodArgs, network, txParams = {}, force = false, salt = null, signature = null, admin = null, kind = interfaces_1.ProxyType.Upgradeable, networkFile, }) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!contractAlias)
            throw Error('A contract alias must be provided to create a new proxy.');
        input_1.validateSalt(salt, false);
        const controller = new NetworkController_1.default(network, txParams, networkFile);
        try {
            yield controller.checkContractDeployed(packageName, contractAlias, !force);
            const proxy = yield controller.createProxy(packageName, contractAlias, methodName, methodArgs, admin, salt, signature, kind);
            upgrades_1.Loggy.noSpin(__filename, 'deploy', 'deploy-hint', `To upgrade this instance run 'oz upgrade'`);
            stdout_1.default(proxy.address);
            return proxy;
        }
        finally {
            controller.writeNetworkPackageIfNeeded();
        }
    });
}
exports.default = createProxy;
//# sourceMappingURL=create.js.map