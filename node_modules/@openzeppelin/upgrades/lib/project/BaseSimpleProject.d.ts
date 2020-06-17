import Package from '../application/Package';
import { ContractInterface } from './AppProject';
import Contract from '../artifacts/Contract';
import ProxyFactory from '../proxy/ProxyFactory';
import { TxParams } from '../artifacts/ZWeb3';
interface Implementations {
    [contractName: string]: Implementation;
}
interface Implementation {
    address: string;
    bytecodeHash: string;
}
interface Dependencies {
    [packageName: string]: Dependency;
}
interface Dependency {
    package: string;
    version: string;
}
export default abstract class BaseSimpleProject {
    implementations: Implementations;
    dependencies: Dependencies;
    txParams: TxParams;
    name: string;
    proxyFactory?: ProxyFactory;
    constructor(name: string, proxyFactory?: ProxyFactory, txParams?: TxParams);
    abstract getAdminAddress(): Promise<string>;
    setImplementation(contract: Contract, contractName?: string): Promise<any>;
    unsetImplementation(contractName: string): void;
    registerImplementation(contractName: string, { address, bytecodeHash }: Implementation): Promise<void>;
    getImplementation({ packageName, contractName, contract, }: {
        packageName?: string;
        contractName?: string;
        contract?: Contract;
    }): Promise<string | undefined>;
    getDependencyPackage(name: string): Promise<Package>;
    getDependencyVersion(name: string): [number, number, number];
    hasDependency(name: string): boolean;
    setDependency(name: string, packageAddress: string, version: string): void;
    unsetDependency(name: string): void;
    createProxy(contract: any, { packageName, contractName, initMethod, initArgs, redeployIfChanged, admin }?: ContractInterface): Promise<Contract>;
    createProxyWithSalt(contract: any, salt: string, signature?: string, { packageName, contractName, initMethod, initArgs, redeployIfChanged, admin }?: ContractInterface): Promise<Contract>;
    createMinimalProxy(contract: any, { packageName, contractName, initMethod, initArgs, redeployIfChanged }?: ContractInterface): Promise<Contract>;
    getProxyDeploymentAddress(salt: string, sender?: string): Promise<string>;
    getProxyDeploymentSigner(contract: any, salt: string, signature: string, { packageName, contractName, initMethod, initArgs, admin }?: ContractInterface): Promise<string>;
    ensureProxyFactory(): Promise<ProxyFactory>;
    private _getOrDeployOwnImplementation;
    private _getDependencyImplementation;
    protected _setUpgradeParams(proxyAddress: string, contract: Contract, { packageName, contractName, initMethod: initMethodName, initArgs, redeployIfChanged }?: ContractInterface): Promise<any>;
    protected _getOrDeployImplementation(contract: Contract, packageName: string, contractName?: string, redeployIfChanged?: boolean): Promise<string | never>;
    protected _getAndLogInitCallData(contract: Contract, initMethodName?: string, initArgs?: string[], implementationAddress?: string, actionLabel?: string, proxyAddress?: string): string | null;
}
export {};
