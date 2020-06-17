"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bignumber_js_1 = __importDefault(require("bignumber.js"));
const web3_utils_1 = __importDefault(require("web3-utils"));
function isValidUnit(unit) {
    return Object.keys(web3_utils_1.default.unitMap).includes(unit.toLowerCase());
}
exports.isValidUnit = isValidUnit;
function prettifyTokenAmount(amount, decimals, symbol) {
    const prettifiedAmount = decimals ? new bignumber_js_1.default(amount).shiftedBy(-decimals).toFormat() : amount;
    return symbol ? `${prettifiedAmount} ${symbol}` : prettifiedAmount;
}
exports.prettifyTokenAmount = prettifyTokenAmount;
function toWei(value, unit) {
    return web3_utils_1.default.toWei(value, unit);
}
exports.toWei = toWei;
function fromWei(value, unit) {
    return web3_utils_1.default.fromWei(value, unit);
}
exports.fromWei = fromWei;
//# sourceMappingURL=units.js.map