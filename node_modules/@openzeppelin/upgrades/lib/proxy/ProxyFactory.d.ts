import Contract from '../artifacts/Contract';
import Proxy from './Proxy';
import { TxParams } from '../artifacts/ZWeb3';
import MinimalProxy from './MinimalProxy';
export default class ProxyFactory {
    contract: Contract;
    address: string;
    txParams: TxParams;
    static tryFetch(address: string, txParams?: TxParams): ProxyFactory | null;
    static fetch(address: string, txParams?: TxParams): ProxyFactory;
    static deploy(txParams?: TxParams): Promise<ProxyFactory>;
    constructor(contract: any, txParams?: TxParams);
    createMinimalProxy(logicAddress: string, initData?: string): Promise<MinimalProxy>;
    createProxy(salt: string, logicAddress: string, proxyAdmin: string, initData?: string, signature?: string): Promise<Proxy>;
    getSigner(salt: string, logicAddress: string, proxyAdmin: string, initData: string, signature: string): Promise<string>;
    getDeploymentAddress(salt: string, sender?: string): Promise<string>;
    getDefaultSender(): Promise<string>;
}
