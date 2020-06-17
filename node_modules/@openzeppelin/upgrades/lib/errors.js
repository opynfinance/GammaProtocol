"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ContractNotFound extends Error {
    constructor(contractName, dependency) {
        if (dependency === undefined) {
            super(`Contract ${contractName} not found`);
        }
        else {
            super(`Contract ${contractName} not found in ${dependency}`);
        }
    }
}
exports.ContractNotFound = ContractNotFound;
//# sourceMappingURL=errors.js.map