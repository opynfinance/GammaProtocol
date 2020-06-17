"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = __importDefault(require("crypto"));
const Addresses_1 = require("./Addresses");
const cbor_1 = __importDefault(require("cbor"));
const Logger_1 = require("../utils/Logger");
function bodyCode(contract) {
    return splitCode(contract).body;
}
exports.bodyCode = bodyCode;
function constructorCode(contract) {
    return splitCode(contract).constructor;
}
exports.constructorCode = constructorCode;
function bytecodeDigest(rawBytecode) {
    const bytecode = tryRemoveMetadata(rawBytecode.replace(/^0x/, ''));
    const buffer = Buffer.from(bytecode, 'hex');
    const hash = crypto_1.default.createHash('sha256');
    return hash.update(buffer).digest('hex');
}
exports.bytecodeDigest = bytecodeDigest;
// Retrieves libraries names in solidity bytecode. Note that if the placeholder does not estrictly match
// the format: __LibName__(...)__ it will fail to get the library names.
function getSolidityLibNames(bytecode) {
    const libs = bytecode.match(/__[A-Za-z0-9_]{36}__/g);
    return libs ? libs.map((lib) => lib.replace(/^__/, '').replace(/_*$/, '')) : [];
}
exports.getSolidityLibNames = getSolidityLibNames;
// Tells whether a bytecode has unlinked libraries or not
function hasUnlinkedVariables(bytecode) {
    return getSolidityLibNames(bytecode).length > 0;
}
exports.hasUnlinkedVariables = hasUnlinkedVariables;
// Removes the swarm hash from the CBOR encoded metadata at the end of the bytecode
// (see https://solidity.readthedocs.io/en/v0.5.9/metadata.html)
function tryRemoveMetadata(bytecode) {
    // Bail on empty bytecode
    if (!bytecode || bytecode.length <= 2)
        return bytecode;
    // Gather length of CBOR metadata from the end of the file
    const rawLength = bytecode.slice(bytecode.length - 4);
    const length = parseInt(rawLength, 16);
    // Bail on unreasonable values for length (meaning we read something else other than metadata length)
    if (length * 2 > bytecode.length - 4)
        return bytecode;
    // Gather what we assume is the CBOR encoded metadata, and try to parse it
    const metadataStart = bytecode.length - length * 2 - 4;
    const metadata = bytecode.slice(metadataStart, bytecode.length - 4);
    // Parse it to see if it is indeed valid metadata
    try {
        cbor_1.default.decode(Buffer.from(metadata, 'hex'));
    }
    catch (err) {
        Logger_1.Loggy.noSpin.warn(__filename, 'tryRemoveMetadata', 'parse-contract-metadata', `Error parsing contract metadata: ${err.message}. Ignoring.`);
        return bytecode;
    }
    // Return bytecode without it
    return bytecode.slice(0, metadataStart);
}
exports.tryRemoveMetadata = tryRemoveMetadata;
// Replaces the solidity library address inside its bytecode with zeros
function replaceSolidityLibAddress(bytecode, address) {
    return bytecode.replace(address.replace(/^0x/, ''), Addresses_1.ZERO_ADDRESS.replace(/^0x/, ''));
}
exports.replaceSolidityLibAddress = replaceSolidityLibAddress;
// Verifies if a bytecode represents a solidity library.
function isSolidityLib(bytecode) {
    const matches = bytecode.match(/^0x73[A-Fa-f0-9]{40}3014/);
    return matches == null ? false : matches.length > 0;
}
exports.isSolidityLib = isSolidityLib;
function splitCode(contract) {
    const binary = contract.schema.linkedBytecode.replace(/^0x/, '');
    const bytecode = contract.schema.bytecode.replace(/^0x/, '');
    const deployedBytecode = contract.schema.deployedBytecode.replace(/^0x/, '');
    const constructor = bytecode.substr(0, bytecode.indexOf(deployedBytecode));
    const body = binary.replace(constructor, '');
    return { constructor, body };
}
//# sourceMappingURL=Bytecode.js.map