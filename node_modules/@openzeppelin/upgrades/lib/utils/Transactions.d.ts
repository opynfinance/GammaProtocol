import Contract from '../artifacts/Contract';
import { TxParams } from '../artifacts/ZWeb3';
export declare const state: any;
interface GenericFunction {
    [id: string]: any;
    (...a: any[]): any;
}
interface TransactionParams {
    data?: string;
    value?: any;
}
declare const _default: {
    /**
     * Makes a raw transaction to the blockchain using web3 sendTransaction method
     * @param address of the contract or account with which you are going to interact
     * @param data encoded function call
     * @param txParams other transaction parameters (from, gasPrice, etc)
     * @param retries number of transaction retries
     */
    sendRawTransaction(address: string, { data, value }: TransactionParams, txParams?: TxParams, retries?: number): Promise<any>;
    /**
     * Sends a transaction to the blockchain, estimating the gas to be used.
     * Uses the node's estimateGas RPC call, and adds a 20% buffer on top of it, capped by the block gas limit.
     * @param contractFn contract function to be executed as the transaction
     * @param args arguments of the call (if any)
     * @param txParams other transaction parameters (from, gasPrice, etc)
     * @param retries number of transaction retries
     */
    sendTransaction(contractFn: GenericFunction, args?: any[], txParams?: TxParams, retries?: number): Promise<any>;
    /**
     * Deploys a contract to the blockchain, estimating the gas to be used.
     * Uses the node's estimateGas RPC call, and adds a 20% buffer on top of it, capped by the block gas limit.
     * @param contract truffle contract to be deployed
     * @param args arguments of the constructor (if any)
     * @param txParams other transaction parameters (from, gasPrice, etc)
     * @param retries number of deploy retries
     */
    deployContract(contract: Contract, args?: any[], txParams?: TxParams, retries?: number): Promise<any>;
    estimateGas(txParams: TxParams, retries?: number): Promise<any>;
    estimateActualGasFnCall(contractFn: GenericFunction, args: any[], txParams: TxParams, retries?: number): Promise<any>;
    estimateActualGas(txParams: TxParams): Promise<any>;
    awaitConfirmations(transactionHash: string, confirmations?: number, interval?: number, timeout?: number): Promise<any>;
    _getETHGasStationPrice(): Promise<any>;
    _fixGasPrice(txParams: TxParams): Promise<any>;
    _getBlockGasLimit(): Promise<number>;
    _calculateActualGas(estimatedGas: number): Promise<number>;
};
export default _default;
