"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const naming_1 = require("./naming");
function parseContractReference(contractReference) {
    let proxyAddress;
    let contractAlias;
    let packageName;
    if (contractReference && contractReference.startsWith('0x')) {
        proxyAddress = contractReference;
    }
    else if (contractReference) {
        ({ contract: contractAlias, package: packageName } = naming_1.fromContractFullName(contractReference));
    }
    return { proxyAddress, contractAlias, packageName };
}
exports.parseContractReference = parseContractReference;
//# sourceMappingURL=contract.js.map