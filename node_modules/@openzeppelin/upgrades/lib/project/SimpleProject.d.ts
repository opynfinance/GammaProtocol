import Proxy from '../proxy/Proxy';
import Contract from '../artifacts/Contract';
import { ContractInterface } from './AppProject';
import BaseSimpleProject from './BaseSimpleProject';
import ProxyFactory from '../proxy/ProxyFactory';
import { TxParams } from '../artifacts/ZWeb3';
export default class SimpleProject extends BaseSimpleProject {
    constructor(name?: string, proxyFactory?: ProxyFactory, txParams?: TxParams);
    upgradeProxy(proxyAddress: string, contract: Contract, contractParams?: ContractInterface): Promise<Contract>;
    changeProxyAdmin(proxyAddress: string, newAdmin: string): Promise<Proxy>;
    getAdminAddress(): Promise<string>;
}
