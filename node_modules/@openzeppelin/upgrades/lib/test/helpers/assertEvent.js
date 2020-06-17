"use strict";
// TS-TODO: use typed web3 stuff here
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
const assert_1 = __importDefault(require("assert"));
function inLogs(logs, eventName, eventArgs = {}) {
    const event = logs.find((e) => e.event === eventName && Object.entries(eventArgs).every(([k, v]) => e.args[k] === v));
    assert_1.default(!!event, `Expected to find ${eventName} with ${eventArgs} in ${logs}`);
    return event;
}
function inTransaction(tx, eventName, eventArgs = {}) {
    return __awaiter(this, void 0, void 0, function* () {
        const { logs } = yield tx;
        return inLogs(logs, eventName, eventArgs);
    });
}
exports.default = {
    inLogs,
    inTransaction,
};
//# sourceMappingURL=assertEvent.js.map