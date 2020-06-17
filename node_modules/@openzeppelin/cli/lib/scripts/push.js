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
const naming_1 = require("../utils/naming");
function push({ contractAliases, network, deployDependencies, deployProxyAdmin, deployProxyFactory, reupload = false, force = false, txParams = {}, networkFile, }) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const controller = new NetworkController_1.default(network, txParams, networkFile);
        try {
            if (deployDependencies)
                yield controller.deployDependencies();
            if (deployProxyAdmin)
                yield controller.deployProxyAdmin();
            if (deployProxyFactory)
                yield controller.deployProxyFactory();
            const localContractAliases = (_a = contractAliases) === null || _a === void 0 ? void 0 : _a.map(naming_1.fromContractFullName).filter(({ package: packageName }) => packageName === undefined || packageName === controller.projectFile.name).map(({ contract }) => contract);
            yield controller.push(localContractAliases, { reupload, force });
            const { appAddress } = controller;
        }
        finally {
            controller.writeNetworkPackageIfNeeded();
        }
    });
}
exports.default = push;
//# sourceMappingURL=push.js.map