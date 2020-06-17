"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Contracts_1 = __importDefault(require("../artifacts/Contracts"));
function hasSelfDestruct(contract) {
    return hasTypeIdentifier(contract, [
        't_function_selfdestruct_nonpayable$_t_address_$returns$__$',
        't_function_selfdestruct_nonpayable$_t_address_payable_$returns$__$',
        't_function_selfdestruct_nonpayable$_t_address_nonpayable_$returns$__$',
    ]);
}
exports.hasSelfDestruct = hasSelfDestruct;
function hasDelegateCall(contract) {
    return hasTypeIdentifier(contract, [
        't_function_baredelegatecall_nonpayable$__$returns$_t_bool_$',
        't_function_baredelegatecall_nonpayable$_t_bytes_memory_ptr_$returns$_t_bool_$_t_bytes_memory_ptr_$',
    ]);
}
exports.hasDelegateCall = hasDelegateCall;
function hasTypeIdentifier(contract, typeIdentifiers) {
    for (const node of contract.schema.ast.nodes.filter(n => n.name === contract.schema.contractName)) {
        if (hasKeyValue(node, 'typeIdentifier', typeIdentifiers))
            return true;
        for (const baseContract of node.baseContracts || []) {
            if (hasTypeIdentifier(Contracts_1.default.getFromLocal(baseContract.baseName.name), typeIdentifiers))
                return true;
        }
    }
    return false;
}
function hasKeyValue(data, key, values) {
    if (!data)
        return false;
    if (values.includes(data[key]))
        return true;
    for (const childKey in data) {
        if (typeof data[childKey] === 'object' && hasKeyValue(data[childKey], key, values))
            return true;
    }
    return false;
}
//# sourceMappingURL=Instructions.js.map