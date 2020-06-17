"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const semver_1 = require("semver");
const fuzzy_solidity_import_parser_1 = require("@openzeppelin/fuzzy-solidity-import-parser");
function getPragma(source) {
    if (!source)
        return null;
    const match = source.match(/pragma solidity\s+([^;]+?)\s*;/m);
    if (!match)
        return null;
    return match[1];
}
exports.getPragma = getPragma;
function compilerVersionsMatch(v1, v2) {
    if (!v1 || !v2)
        return false;
    const parseVersion = (version) => {
        const cleaned = version
            .replace(/^soljson-v?/, '')
            .replace(/\.js$/, '')
            .replace('g++', 'gcc'); // semver fails when parsing '+' characters as part of the build
        const semver = semver_1.parse(cleaned);
        if (!semver)
            throw new Error(`Invalid compiler version ${version}`);
        return semver;
    };
    return semver_1.eq(parseVersion(v1), parseVersion(v2));
}
exports.compilerVersionsMatch = compilerVersionsMatch;
function compilerSettingsMatch(s1, s2) {
    if (!s1 || !s2)
        return false;
    return (s1.evmVersion === s2.evmVersion &&
        ((!s1.optimizer && !s2.optimizer) ||
            (s1.optimizer.enabled == s2.optimizer.enabled && s1.optimizer.runs == s2.optimizer.runs)));
}
exports.compilerSettingsMatch = compilerSettingsMatch;
function getImports(source) {
    return fuzzy_solidity_import_parser_1.getMetadata(source).imports;
}
exports.getImports = getImports;
//# sourceMappingURL=solidity.js.map