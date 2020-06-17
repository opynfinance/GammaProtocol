import Package from '../application/Package';
import ImplementationDirectory from '../application/ImplementationDirectory';
import Contract from '../artifacts/Contract';
import { TxParams } from '../artifacts/ZWeb3';
export default class App {
    appContract: any;
    private txParams;
    static fetch(address: string, txParams?: TxParams): Promise<App>;
    static deploy(txParams?: TxParams): Promise<App>;
    static getContractClass(): Contract;
    constructor(appContract: Contract, txParams?: TxParams);
    getPackage(name: any): Promise<{
        package: Package;
        version: string;
    }>;
    hasPackage(name: string, expectedVersion?: string): Promise<boolean>;
    setPackage(name: string, packageAddress: string, version: string): Promise<any>;
    unsetPackage(name: string): Promise<any>;
    get address(): string;
    get contract(): Contract;
    getImplementation(packageName: string, contractName: string): Promise<string>;
    hasProvider(name: string): Promise<boolean>;
    getProvider(name: string): Promise<ImplementationDirectory>;
    createProxy(contract: Contract, packageName: string, contractName: string, proxyAdmin: string, initMethodName: string, initArgs?: string[]): Promise<Contract>;
    private _createProxy;
    private _createProxyAndCall;
}
