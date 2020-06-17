import BasePackageProject from './BasePackageProject';
import Package from '../application/Package';
import ImplementationDirectory from '../application/ImplementationDirectory';
import { TxParams } from '../artifacts/ZWeb3';
export default class PackageProject extends BasePackageProject {
    static fetch(packageAddress: string, version: string, txParams: TxParams): Promise<PackageProject>;
    static fetchOrDeploy(version?: string, txParams?: TxParams, { packageAddress }?: {
        packageAddress?: string;
    }): Promise<PackageProject | never>;
    constructor(thepackage: Package, version?: string, txParams?: TxParams);
    getImplementation({ contractName }: {
        contractName: string;
    }): Promise<string>;
    getProjectPackage(): Promise<Package>;
    getCurrentDirectory(): Promise<ImplementationDirectory>;
    getCurrentVersion(): Promise<string>;
}
