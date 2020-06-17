/// <reference types="node" />
import Contract from '../artifacts/Contract';
import { TxParams } from '../artifacts/ZWeb3';
export default class Proxy {
    private contract;
    private txParams;
    address: string;
    static at(contractOrAddress: string | Contract, txParams?: TxParams): Proxy;
    static deploy(implementation: string, admin: string, initData: string | Buffer | null, txParams?: any): Promise<Proxy>;
    constructor(contract: Contract, txParams?: TxParams);
    upgradeTo(address: string, migrateData: string | null): Promise<any>;
    changeAdmin(newAdmin: string): Promise<any>;
    implementation(): Promise<string>;
    admin(): Promise<string>;
    getStorageAt(position: string): Promise<string>;
    private checkAdmin;
}
