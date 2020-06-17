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
const NetworkController_1 = __importDefault(require("../../models/network/NetworkController"));
function action(params) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        const { userNetworkName } = params;
        const controller = new NetworkController_1.default(params.network, params.txParams, params.networkFile);
        try {
            controller.checkLocalContractDeployed(params.contract, true);
        }
        catch (e) {
            if (!e.message.includes('has changed locally')) {
                e.message += '\n\nVerification of regular instances is not yet supported.';
            }
            throw e;
        }
        yield controller.verifyAndPublishContract(params.contract, params.optimizer, (_a = params.optimizerRuns, (_a !== null && _a !== void 0 ? _a : 200)), params.remote, (_b = params.apiKey, (_b !== null && _b !== void 0 ? _b : '')));
        if (!params.dontExitProcess && process.env.NODE_ENV !== 'test')
            process.exit(0);
    });
}
exports.action = action;
//# sourceMappingURL=action.js.map