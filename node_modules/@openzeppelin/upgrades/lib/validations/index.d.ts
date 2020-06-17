import { Operation } from './Layout';
import Contract from '../artifacts/Contract.js';
import { StorageInfo } from '../utils/ContractAST';
import { BuildArtifacts } from '..';
export interface ValidationInfo {
    hasConstructor: boolean;
    hasSelfDestruct: boolean;
    hasDelegateCall: boolean;
    hasInitialValuesInDeclarations: boolean;
    uninitializedBaseContracts: any[];
    storageUncheckedVars?: StorageInfo[];
    storageDiff?: Operation[];
    importsVanillaContracts?: string[];
}
export declare function validate(contract: Contract, existingContractInfo?: any, buildArtifacts?: BuildArtifacts): any;
export declare function newValidationErrors(validations: any, existingValidations?: any): any;
export declare function validationPasses(validations: any): boolean;
