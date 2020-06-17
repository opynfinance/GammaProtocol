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
const upgrades_1 = require("@openzeppelin/upgrades");
const input_1 = require("../utils/input");
function querySignedDeployment({ packageName, contractAlias, methodName, methodArgs, network, txParams = {}, salt = null, signature = null, admin = null, networkFile, }) {
    return __awaiter(this, void 0, void 0, function* () {
        input_1.validateSalt(salt, true);
        const controller = new NetworkController_1.default(network, txParams, networkFile);
        try {
            const { signer, address } = yield controller.getProxySignedDeployment(salt, signature, packageName, contractAlias, methodName, methodArgs, admin);
            upgrades_1.Loggy.noSpin(__filename, 'querySignedDeployment', `query-signed-deployment`, `Contract created with salt ${salt} signed by ${signer} will be deployed to the following address`);
            stdout_1.default(address);
            return address;
        }
        finally {
            controller.writeNetworkPackageIfNeeded();
        }
    });
}
exports.default = querySignedDeployment;
//# sourceMappingURL=query-signed-deployment.js.map