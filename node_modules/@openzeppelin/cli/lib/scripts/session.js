"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Session_1 = __importDefault(require("../models/network/Session"));
function session({ network, from, timeout, blockTimeout, close = false, expires, }) {
    const anyNetworkOption = network || from || timeout || blockTimeout;
    if (!!anyNetworkOption === !!close) {
        throw Error('Please provide either a network option (--network, --timeout, --blockTimeout, --from) or --close.');
    }
    close ? Session_1.default.close() : Session_1.default.open({ network, from, timeout, blockTimeout }, expires);
}
exports.default = session;
//# sourceMappingURL=session.js.map