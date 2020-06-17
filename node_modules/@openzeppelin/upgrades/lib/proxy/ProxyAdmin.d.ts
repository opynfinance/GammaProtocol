import Contract from '../artifacts/Contract';
import { TxParams } from '../artifacts/ZWeb3';
export default class ProxyAdmin {
    contract: Contract;
    address: string;
    txParams: TxParams;
    static fetch(address: string, txParams?: TxParams): ProxyAdmin;
    static deploy(txParams?: TxParams): Promise<ProxyAdmin>;
    constructor(contract: any, txParams?: TxParams);
    getProxyImplementation(proxyAddress: string): Promise<string>;
    changeProxyAdmin(proxyAddress: string, newAdmin: string): Promise<void>;
    upgradeProxy(proxyAddress: string, implementationAddress: string, contract: Contract, initMethodName: string, initArgs: any): Promise<Contract>;
    transferOwnership(newAdminOwner: string): Promise<void>;
    getOwner(): Promise<string>;
    private checkOwner;
    private _upgradeProxy;
    private _upgradeProxyAndCall;
}
