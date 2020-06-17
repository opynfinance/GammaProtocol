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
const TransactionController_1 = __importDefault(require("../models/network/TransactionController"));
function balance({ accountAddress, contractAddress }) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!accountAddress)
            throw Error('An account address must be specified.');
        const controller = new TransactionController_1.default();
        const balance = yield controller.getBalanceOf(accountAddress, contractAddress);
        if (balance)
            stdout_1.default(balance);
    });
}
exports.default = balance;
//# sourceMappingURL=balance.js.map