"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
function toContractFullName(packageName, contractName) {
    if (!packageName)
        return contractName;
    return [packageName, contractName].join('/');
}
exports.toContractFullName = toContractFullName;
function fromContractFullName(contractFullName) {
    if (!contractFullName)
        return {};
    const fragments = contractFullName.split('/');
    const contractName = fragments.pop();
    if (fragments.length === 0)
        return { contract: contractName };
    else
        return lodash_1.pickBy({ contract: contractName, package: fragments.join('/') });
}
exports.fromContractFullName = fromContractFullName;
//# sourceMappingURL=naming.js.map