"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const ContractAST_1 = __importStar(require("../utils/ContractAST"));
function hasConstructor(contract, buildArtifacts) {
    return (new ContractAST_1.default(contract, buildArtifacts, ContractAST_1.FunctionDefinitionFilter)
        .getLinearizedBaseContracts()
        .filter(hasNonEmptyConstructorInAST).length > 0);
}
exports.hasConstructor = hasConstructor;
function hasNonEmptyConstructorInAST(contractNode) {
    return (contractNode.nodes
        .filter((n) => n.nodeType === 'FunctionDefinition' && n.kind === 'constructor')
        .filter((n) => n.body.statements.length > 0 || n.modifiers.length > 0).length > 0);
}
//# sourceMappingURL=Constructors.js.map