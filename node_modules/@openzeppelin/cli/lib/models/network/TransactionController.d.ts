import { TxParams } from '@openzeppelin/upgrades';
import ProjectFile from '../files/ProjectFile';
import NetworkFile from '../files/NetworkFile';
export default class TransactionController {
    txParams: TxParams;
    projectFile: ProjectFile;
    networkFile: NetworkFile;
    constructor(txParams?: TxParams, network?: string, networkFile?: NetworkFile);
    transfer(to: string, amount: string, unit: string): Promise<void | never>;
    getBalanceOf(accountAddress: string, contractAddress?: string): Promise<string | never>;
    callContractMethod(proxyAddress: string, methodName: string, methodArgs: string[]): Promise<string[] | object | string | never>;
    sendTransaction(proxyAddress: string, methodName: string, methodArgs: string[]): Promise<void | never>;
    private getTokenInfo;
    private getContractAndMethod;
    private parseFunctionCallResult;
}
