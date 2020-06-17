import { BuildArtifacts } from '../artifacts/BuildArtifacts';
import Contract from '../artifacts/Contract';
export declare type Node = any;
export interface NodeMapping {
    [id: number]: Node[];
}
export interface TypeInfo {
    id: string;
    kind: string;
    label: string;
    valueType?: string;
    length?: number;
    members?: StorageInfo[];
    src?: any;
}
export interface TypeInfoMapping {
    [id: string]: TypeInfo;
}
export interface StorageInfo {
    label: string;
    astId: number;
    type: any;
    src: string;
    path?: string;
    contract?: string;
}
interface ContractASTProps {
    nodesFilter?: string[];
}
export declare const ContractDefinitionFilter: {
    nodesFilter: string[];
};
export declare const FunctionDefinitionFilter: {
    nodesFilter: string[];
};
export default class ContractAST {
    private artifacts;
    private contract;
    private imports;
    private nodes;
    private types;
    private nodesFilter;
    constructor(contract: Contract, artifacts?: BuildArtifacts, props?: ContractASTProps);
    getContractNode(): Node;
    getImports(): Set<string>;
    getMethods(attributes?: string[]): any[];
    getBaseContractsRecursively(): Node[];
    getLinearizedBaseContracts(mostDerivedFirst?: boolean): Node[];
    getNode(id: string, type: string): Node | never;
    private _collectImports;
    private _collectNodes;
    private _isValidMethodName;
}
export {};
