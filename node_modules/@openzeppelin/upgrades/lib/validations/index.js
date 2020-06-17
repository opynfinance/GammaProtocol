"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const Constructors_1 = require("./Constructors");
const Instructions_1 = require("./Instructions");
const Storage_1 = require("./Storage");
const Layout_1 = require("./Layout");
const InitialValues_1 = require("./InitialValues");
const VanillaContracts_1 = require("./VanillaContracts");
const ContractAST_1 = __importStar(require("../utils/ContractAST"));
const BuildArtifacts_1 = require("../artifacts/BuildArtifacts");
function validate(contract, existingContractInfo = {}, buildArtifacts = BuildArtifacts_1.getBuildArtifacts()) {
    checkArtifactsForImportedSources(contract, buildArtifacts);
    const storageValidation = validateStorage(contract, existingContractInfo, buildArtifacts);
    const uninitializedBaseContracts = [];
    return Object.assign({ hasConstructor: Constructors_1.hasConstructor(contract, buildArtifacts), hasSelfDestruct: Instructions_1.hasSelfDestruct(contract), hasDelegateCall: Instructions_1.hasDelegateCall(contract), hasInitialValuesInDeclarations: InitialValues_1.hasInitialValuesInDeclarations(contract), importsVanillaContracts: VanillaContracts_1.importsVanillaContracts(contract, buildArtifacts), uninitializedBaseContracts }, storageValidation);
}
exports.validate = validate;
function newValidationErrors(validations, existingValidations = {}) {
    return {
        hasConstructor: validations.hasConstructor && !existingValidations.hasConstructor,
        hasSelfDestruct: validations.hasSelfDestruct && !existingValidations.hasSelfDestruct,
        hasDelegateCall: validations.hasDelegateCall && !existingValidations.hasDelegateCall,
        hasInitialValuesInDeclarations: validations.hasInitialValuesInDeclarations && !existingValidations.hasInitialValuesInDeclarations,
        uninitializedBaseContracts: lodash_1.difference(validations.uninitializedBaseContracts, existingValidations.uninitializedBaseContracts),
        storageUncheckedVars: lodash_1.difference(validations.storageUncheckedVars, existingValidations.storageUncheckedVars),
        storageDiff: validations.storageDiff,
        importsVanillaContracts: lodash_1.difference(validations.importsVanillaContracts, existingValidations.importsVanillaContracts),
    };
}
exports.newValidationErrors = newValidationErrors;
function validationPasses(validations) {
    return (lodash_1.every(validations.storageDiff, diff => diff.action === 'append') &&
        !validations.hasConstructor &&
        !validations.hasSelfDestruct &&
        !validations.hasDelegateCall &&
        !validations.hasInitialValuesInDeclarations &&
        lodash_1.isEmpty(validations.uninitializedBaseContracts) &&
        lodash_1.isEmpty(validations.importsVanillaContracts));
}
exports.validationPasses = validationPasses;
function validateStorage(contract, existingContractInfo = {}, buildArtifacts = null) {
    const originalStorageInfo = lodash_1.pick(existingContractInfo, 'storage', 'types');
    if (lodash_1.isEmpty(originalStorageInfo.storage))
        return {};
    const updatedStorageInfo = Storage_1.getStorageLayout(contract, buildArtifacts);
    const storageUncheckedVars = Storage_1.getStructsOrEnums(updatedStorageInfo);
    const storageDiff = Layout_1.compareStorageLayouts(originalStorageInfo, updatedStorageInfo);
    return {
        storageUncheckedVars,
        storageDiff,
    };
}
function checkArtifactsForImportedSources(contract, buildArtifacts) {
    new ContractAST_1.default(contract, buildArtifacts, ContractAST_1.ContractDefinitionFilter).getBaseContractsRecursively();
}
//# sourceMappingURL=index.js.map