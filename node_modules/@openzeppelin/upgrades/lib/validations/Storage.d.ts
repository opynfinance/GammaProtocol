import Contract from '../artifacts/Contract.js';
import { BuildArtifacts } from '../artifacts/BuildArtifacts.js';
import { TypeInfoMapping, StorageInfo } from '../utils/ContractAST';
export declare function getStorageLayout(contract: Contract, artifacts: BuildArtifacts): StorageLayoutInfo;
export declare function getStructsOrEnums(info: StorageLayoutInfo): StorageInfo[];
export interface StorageLayoutInfo {
    types: TypeInfoMapping;
    storage: StorageInfo[];
}
