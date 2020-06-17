"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const web3_utils_1 = __importDefault(require("web3-utils"));
exports.ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
// TS-TODO: Web3 typings? => contract.
function toAddress(contractOrAddress) {
    if (lodash_1.isEmpty(contractOrAddress))
        throw Error(`Contract or address expected`);
    else if (lodash_1.isString(contractOrAddress))
        return web3_utils_1.default.toChecksumAddress(contractOrAddress);
    else
        return web3_utils_1.default.toChecksumAddress(contractOrAddress.address);
}
exports.toAddress = toAddress;
function isZeroAddress(address) {
    return !address || address === exports.ZERO_ADDRESS;
}
exports.isZeroAddress = isZeroAddress;
// TS-TODO: if uint256 is a string, then why are we doing uint256.toString()?
function uint256ToAddress(uint256) {
    const padded = web3_utils_1.default.leftPad(uint256.toString(), 64);
    const address = padded.replace('0x000000000000000000000000', '0x');
    return web3_utils_1.default.toChecksumAddress(address);
}
exports.uint256ToAddress = uint256ToAddress;
//# sourceMappingURL=Addresses.js.map