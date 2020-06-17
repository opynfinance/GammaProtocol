import Web3 from 'web3';
import { provider } from 'web3-core';
import { Block, Eth } from 'web3-eth';
export declare const NETWORKS: {
    1: string;
    2: string;
    3: string;
    4: string;
    5: string;
    42: string;
};
export interface TxParams {
    from?: string;
    value?: number | string;
    gas?: number | string;
    gasPrice?: number | string;
}
export interface Web3Options {
    blockTimeout?: number;
    pollingTimeout?: number;
}
declare module 'web3-eth' {
    interface Eth {
        getStorageAt(address: string, position: number | string): Promise<string>;
    }
}
export default class ZWeb3 {
    static provider: provider;
    static web3instance: Web3;
    static web3Options: Web3Options;
    static initialize(provider: provider, web3Options?: Web3Options): void;
    static get web3(): Web3;
    static checkNetworkId(providedNetworkId?: string | number): Promise<void | never>;
    static get eth(): Eth;
    static get version(): string;
    static defaultAccount(): Promise<string>;
    static toChecksumAddress(address: string): string | null;
    static hasBytecode(address: any): Promise<boolean>;
    static isGanacheNode(): Promise<boolean>;
    static getLatestBlock(): Promise<Block>;
    static getLatestBlockNumber(): Promise<number>;
    static isMainnet(): Promise<boolean>;
    static getNetwork(): Promise<number>;
    static getNetworkName(): Promise<string>;
}
