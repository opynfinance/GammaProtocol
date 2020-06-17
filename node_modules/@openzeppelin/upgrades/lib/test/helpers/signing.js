"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const web3_1 = __importDefault(require("web3"));
const web3 = new web3_1.default(null);
exports.signer = '0x239938d1Bd73e99a5042d29DcFFf6991e0Fe5626';
exports.signerPk = '0xbe7e12ce20410c5f0207bd6c7bcae39052679bfd401c62849657ebfe23e3711b';
function signDeploy(factory, salt, logic, admin, initData = '', pk = exports.signerPk) {
    // Encodes and tightly packs the arguments and calculates keccak256
    const hash = web3.utils.soliditySha3({ type: 'uint256', value: salt }, { type: 'address', value: logic }, { type: 'address', value: admin }, { type: 'bytes', value: initData }, { type: 'address', value: factory });
    // Prepends the Ethereum Signed Message string, hashes, and signs
    const signed = web3.eth.accounts.sign(hash, pk);
    return signed.signature;
}
exports.signDeploy = signDeploy;
//# sourceMappingURL=signing.js.map