"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const Contracts_1 = __importDefault(require("../artifacts/Contracts"));
function hasInitialValuesInDeclarations(contract) {
    return detectInitialValues(contract);
}
exports.hasInitialValuesInDeclarations = hasInitialValuesInDeclarations;
function detectInitialValues(contract) {
    const nodes = contract.schema.ast.nodes.filter(n => n.name === contract.schema.contractName);
    for (const node of nodes) {
        if (hasInitialValues(node))
            return true;
        for (const baseContract of node.baseContracts || []) {
            const parentContract = Contracts_1.default.getFromLocal(baseContract.baseName.name);
            return detectInitialValues(parentContract);
        }
    }
    return false;
}
function hasInitialValues(node) {
    const initializedVariables = node.nodes
        .filter(nodeItem => !nodeItem.constant && nodeItem.nodeType === 'VariableDeclaration')
        .filter(nodeItem => nodeItem.value != null);
    return !lodash_1.isEmpty(initializedVariables);
}
//# sourceMappingURL=InitialValues.js.map