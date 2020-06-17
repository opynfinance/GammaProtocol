import ImplementationDirectory from '../application/ImplementationDirectory';
import Contract from '../artifacts/Contract';
import { TxParams } from '../artifacts/ZWeb3';
export default class Package {
    private packageContract;
    private txParams;
    static fetch(address: string, txParams?: TxParams): Package | null;
    static deploy(txParams?: TxParams): Promise<Package>;
    constructor(packageContract: Contract, txParams?: TxParams);
    get contract(): Contract;
    get address(): string;
    hasVersion(version: string): Promise<boolean>;
    isFrozen(version: string): Promise<boolean | never>;
    freeze(version: string): Promise<any | never>;
    getImplementation(version: string, contractName: string): Promise<string | never>;
    newVersion(version: string, content?: string): Promise<ImplementationDirectory>;
    getDirectory(version: string): Promise<ImplementationDirectory | never>;
}
