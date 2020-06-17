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
const NetworkController_1 = __importDefault(require("../models/network/NetworkController"));
function update({ packageName, contractAlias, proxyAddress, methodName, methodArgs, all, network, force = false, txParams = {}, networkFile, }) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!packageName && !contractAlias && !proxyAddress && !all) {
            throw Error('The package name, contract name, or address to upgrade must be provided, or set the `all` flag to upgrade all contracts in the application.');
        }
        const controller = new NetworkController_1.default(network, txParams, networkFile);
        try {
            yield controller.checkLocalContractsDeployed(!force);
            const proxies = yield controller.upgradeProxies(packageName, contractAlias, proxyAddress, methodName, methodArgs);
        }
        finally {
            controller.writeNetworkPackageIfNeeded();
        }
    });
}
exports.default = update;
//# sourceMappingURL=update.js.map