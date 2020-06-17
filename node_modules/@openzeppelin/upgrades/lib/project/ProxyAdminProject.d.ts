import ProxyAdmin from '../proxy/ProxyAdmin';
import BaseSimpleProject from './BaseSimpleProject';
import { ContractInterface } from './AppProject';
import Contract from '../artifacts/Contract';
import ProxyFactory from '../proxy/ProxyFactory';
import { TxParams } from '../artifacts/ZWeb3';
declare class BaseProxyAdminProject extends BaseSimpleProject {
    proxyAdmin: ProxyAdmin;
    static fetch(name?: string, txParams?: TxParams, proxyAdminAddress?: string, proxyFactoryAddress?: string): Promise<ProxyAdminProject>;
    constructor(name: string, proxyAdmin: ProxyAdmin, proxyFactory?: ProxyFactory, txParams?: any);
    createProxy(contract: Contract, contractParams?: ContractInterface): Promise<Contract>;
    createProxyWithSalt(contract: Contract, salt: string, signature?: string, contractParams?: ContractInterface): Promise<Contract>;
    upgradeProxy(proxyAddress: string, contract: Contract, contractParams?: ContractInterface): Promise<Contract>;
    getAdminAddress(): Promise<string>;
    ensureProxyAdmin(): Promise<ProxyAdmin>;
}
declare const ProxyAdminProject_base: {
    new (...args: any[]): {
        proxyAdmin: ProxyAdmin;
        transferAdminOwnership(newAdminOwner: string): Promise<void>;
        changeProxyAdmin(proxyAddress: string, newAdmin: string): Promise<void>;
    };
} & typeof BaseProxyAdminProject;
export default class ProxyAdminProject extends ProxyAdminProject_base {
}
export {};
