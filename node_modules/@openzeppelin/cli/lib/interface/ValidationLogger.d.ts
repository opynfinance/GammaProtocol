import { ValidationInfo, BuildArtifacts, StorageLayoutInfo, Operation, Contract } from '@openzeppelin/upgrades';
import { ContractInterface } from '../models/files/NetworkFile';
export default class ValidationLogger {
    contract: Contract;
    existingContractInfo: ContractInterface;
    constructor(contract: Contract, existingContractInfo?: ContractInterface);
    get contractName(): string;
    log(validations: ValidationInfo, buildArtifacts?: BuildArtifacts): void;
    logImportsVanillaContracts(vanillaContracts: string[] | null): void;
    logHasSelfDestruct(hasSelfDestruct: boolean): void;
    logHasDelegateCall(hasDelegateCall: boolean): void;
    logHasInitialValuesInDeclarations(hasInitialValuesInDeclarations: boolean): void;
    logHasConstructor(hasConstructor: boolean): void;
    logUninitializedBaseContracts(uninitializedBaseContracts: any): void;
    logUncheckedVars(vars: any): void;
    logStorageLayoutDiffs(storageDiff: Operation[], updatedStorageInfo: StorageLayoutInfo): void;
}
