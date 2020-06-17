"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function flattenSourceCode(contractPaths, root = process.cwd()) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('truffle-flattener')(contractPaths, root);
}
exports.flattenSourceCode = flattenSourceCode;
//# sourceMappingURL=Solidity.js.map