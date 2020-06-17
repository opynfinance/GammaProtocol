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
const TransactionController_1 = __importDefault(require("../models/network/TransactionController"));
function sendTx({ proxyAddress, methodName, methodArgs, value, gas, network, txParams, networkFile, }) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!proxyAddress)
            throw Error('A contract address must be specified.');
        if (!methodName)
            throw Error('A method name must be specified.');
        if (value)
            txParams = Object.assign({ value }, txParams);
        if (gas)
            txParams = Object.assign({ gas }, txParams);
        const controller = new TransactionController_1.default(txParams, network, networkFile);
        yield controller.sendTransaction(proxyAddress, methodName, methodArgs);
    });
}
exports.default = sendTx;
//# sourceMappingURL=send-tx.js.map