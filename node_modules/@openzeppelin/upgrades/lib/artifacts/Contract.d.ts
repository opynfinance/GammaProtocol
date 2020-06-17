import { StorageLayoutInfo } from '../validations/Storage';
import { TransactionReceipt } from 'web3-core';
import { Contract as Web3Contract } from 'web3-eth-contract';
import { Artifact } from './BuildArtifacts';
export default interface Contract extends Web3Contract {
    address: string;
    new: (args?: any[], options?: {}) => Promise<Contract>;
    at: (address: string) => Contract;
    link: (libraries: {
        [libAlias: string]: string;
    }) => void;
    deployment?: {
        transactionHash: string;
        transactionReceipt: TransactionReceipt;
    };
    schema: {
        directory: string;
        linkedBytecode: string;
        linkedDeployedBytecode: string;
        storageInfo: StorageLayoutInfo;
        warnings: any;
    } & Artifact;
}
export declare enum ContractMethodMutability {
    Constant = 0,
    NotConstant = 1
}
interface ContractMethod {
    name: string;
    hasInitializer: boolean;
    inputs: string[];
}
export declare function createContract(schema: any): Contract;
export declare function contractMethodsFromAbi(instance: Contract, constant?: ContractMethodMutability): any[];
export declare function contractMethodsFromAst(instance: Contract, constant?: ContractMethodMutability): ContractMethod[];
interface MethodArg {
    type: string;
    internalType?: string;
    components?: MethodArg[];
    name: string;
}
export declare function getConstructorInputs(contract: Contract): MethodArg[];
export {};
