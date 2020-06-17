import Contract from '../artifacts/Contract';
import { TxParams } from '../artifacts/ZWeb3';
export default class ImplementationDirectory {
    directoryContract: Contract;
    txParams: TxParams;
    static deploy(txParams?: TxParams): Promise<ImplementationDirectory>;
    static fetch(address: string, txParams?: TxParams): ImplementationDirectory;
    static getContract(): Contract;
    constructor(directory: Contract, txParams?: TxParams);
    get contract(): Contract;
    get address(): string;
    owner(): Promise<string>;
    getImplementation(contractName: string): Promise<string | never>;
    setImplementation(contractName: string, implementationAddress: string): Promise<any>;
    unsetImplementation(contractName: string): Promise<any>;
    freeze(): Promise<any>;
    isFrozen(): Promise<boolean>;
}
