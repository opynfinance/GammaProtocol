import App from '../application/App';
import Package from '../application/Package';
import ProxyAdmin from '../proxy/ProxyAdmin';
import ImplementationDirectory from '../application/ImplementationDirectory';
import BasePackageProject from './BasePackageProject';
import SimpleProject from './SimpleProject';
import Contract from '../artifacts/Contract';
import ProxyAdminProject from './ProxyAdminProject';
import ProxyFactory from '../proxy/ProxyFactory';
import { TxParams } from '../artifacts/ZWeb3';
export interface ContractInterface {
    packageName?: string;
    contractName?: string;
    initMethod?: string;
    initArgs?: string[];
    redeployIfChanged?: boolean;
    admin?: string;
}
interface ExistingAddresses {
    appAddress?: string;
    packageAddress?: string;
    proxyAdminAddress?: string;
    proxyFactoryAddress?: string;
}
declare class BaseAppProject extends BasePackageProject {
    private name;
    private app;
    proxyAdmin: ProxyAdmin;
    proxyFactory: ProxyFactory;
    static fetchOrDeploy(name?: string, version?: string, txParams?: TxParams, { appAddress, packageAddress, proxyAdminAddress, proxyFactoryAddress }?: ExistingAddresses): Promise<AppProject | never>;
    static fromProxyAdminProject(proxyAdminProject: ProxyAdminProject, version?: string, existingAddresses?: ExistingAddresses): Promise<AppProject>;
    static fromSimpleProject(simpleProject: SimpleProject, version?: string, existingAddresses?: ExistingAddresses): Promise<AppProject>;
    constructor(app: App, name: string, version: string, proxyAdmin: ProxyAdmin, proxyFactory: ProxyFactory, txParams?: TxParams);
    newVersion(version: any): Promise<ImplementationDirectory>;
    getAdminAddress(): Promise<string>;
    getApp(): App;
    ensureProxyAdmin(): Promise<ProxyAdmin>;
    ensureProxyFactory(): Promise<ProxyFactory>;
    getProjectPackage(): Promise<Package>;
    getCurrentDirectory(): Promise<ImplementationDirectory>;
    getCurrentVersion(): Promise<string>;
    getImplementation({ packageName, contractName, contract, }: {
        contractName?: string;
        packageName?: string;
        contract?: Contract;
    }): Promise<string>;
    createProxy(contract: Contract, contractInterface?: ContractInterface): Promise<Contract>;
    protected getContractInterface(contract: Contract, opts?: ContractInterface): ContractInterface;
    createProxyWithSalt(contract: Contract, salt: string, signature?: string, contractInterface?: ContractInterface): Promise<Contract>;
    createMinimalProxy(contract: Contract, contractInterface?: ContractInterface): Promise<Contract>;
    getProxyDeploymentAddress(salt: string, sender?: string): Promise<string>;
    getProxyDeploymentSigner(contract: any, salt: string, signature: string, { packageName, contractName, initMethod, initArgs, admin }?: ContractInterface): Promise<string>;
    upgradeProxy(proxyAddress: string, contract: Contract, contractInterface?: ContractInterface): Promise<Contract>;
    getDependencyPackage(name: string): Promise<Package>;
    getDependencyVersion(name: string): Promise<string>;
    hasDependency(name: any): Promise<boolean>;
    setDependency(name: string, packageAddress: string, version: string): Promise<boolean>;
    unsetDependency(name: string): Promise<any>;
    protected getAndLogInitCallData(contract: Contract, initMethodName?: string, initArgs?: string[], implementationAddress?: string, actionLabel?: string, proxyAddress?: string): string | null;
}
declare const AppProject_base: {
    new (...args: any[]): {
        proxyAdmin: ProxyAdmin;
        transferAdminOwnership(newAdminOwner: string): Promise<void>;
        changeProxyAdmin(proxyAddress: string, newAdmin: string): Promise<void>;
    };
} & typeof BaseAppProject;
export default class AppProject extends AppProject_base {
}
export {};
