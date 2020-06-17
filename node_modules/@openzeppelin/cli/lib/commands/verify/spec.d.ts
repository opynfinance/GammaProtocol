import { Arg, Option } from '../../register-command';
import { TxParams } from '@openzeppelin/upgrades';
import NetworkFile from '../../models/files/NetworkFile';
export declare const name = "verify";
export declare const description = "verify a contract's source with Etherscan or Etherchain";
export interface Args {
    contract: string;
}
declare type OptimizerOptions = {
    optimizer: false;
} | {
    optimizer: true;
    optimizerRuns: number;
};
declare type RemoteOptions = {
    remote: 'etherscan';
    apiKey: string;
} | {
    remote: 'etherchain';
};
interface OtherOptions {
    network: string;
    networkFile?: NetworkFile;
    txParams?: TxParams;
    userNetworkName?: string;
}
export declare type Options = OptimizerOptions & RemoteOptions & OtherOptions;
export declare const args: Arg[];
export declare const options: Option[];
export {};
