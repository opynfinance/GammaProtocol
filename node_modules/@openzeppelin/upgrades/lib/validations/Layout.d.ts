import { StorageLayoutInfo } from './Storage';
import { StorageInfo } from '../utils/ContractAST';
export declare type StorageEntryComparison = 'equal' | 'rename' | 'typechange' | 'replace';
export interface Operation {
    contract: string;
    action: string;
    updated: StorageInfo;
    original: StorageInfo;
}
export declare function compareStorageLayouts(original: StorageLayoutInfo, updated: StorageLayoutInfo): Operation[];
