import Contract from '../artifacts/Contract';
import ImplementationDirectory from '../application/ImplementationDirectory';
import Package from '../application/Package';
import { TxParams } from '../artifacts/ZWeb3';
export default abstract class BasePackageProject {
    protected txParams: TxParams;
    version: string;
    package: Package;
    protected directory: ImplementationDirectory;
    constructor(txParams: any);
    newVersion(version: string): Promise<ImplementationDirectory>;
    freeze(): Promise<void>;
    setImplementation(contract: Contract, contractName: string): Promise<Contract>;
    unsetImplementation(contractName: string): Promise<void>;
    registerImplementation(contractName: string, { address }: {
        address: string;
    }): Promise<void>;
    abstract getCurrentDirectory(): Promise<any>;
    abstract getProjectPackage(): Promise<any>;
    abstract getCurrentVersion(): Promise<any>;
}
