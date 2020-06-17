"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ContractAST_1 = __importDefault(require("../utils/ContractAST"));
let VANILLA_CONTRACTS = '@openzeppelin/contracts/';
function importsVanillaContracts(contract, buildArtifacts) {
    const ast = new ContractAST_1.default(contract, buildArtifacts, { nodesFilter: [] });
    const illegalImports = [...ast.getImports()]
        .filter(i => i.startsWith(VANILLA_CONTRACTS))
        .map(i => i.slice(VANILLA_CONTRACTS.length))
        .map(i => i.replace(/^contracts\//, ''));
    return illegalImports.length > 0 ? illegalImports : undefined;
}
exports.importsVanillaContracts = importsVanillaContracts;
// Used for testing purposes;
function setVanillaContractsPackageName(value) {
    VANILLA_CONTRACTS = value;
}
exports.setVanillaContractsPackageName = setVanillaContractsPackageName;
//# sourceMappingURL=VanillaContracts.js.map