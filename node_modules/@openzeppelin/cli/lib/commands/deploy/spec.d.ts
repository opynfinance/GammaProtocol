import { Arg, Option } from '../../register-command';
import { TxParams } from '@openzeppelin/upgrades';
import NetworkFile from '../../models/files/NetworkFile';
declare const kinds: ({
    name: string;
    value: "regular";
    short: "regular";
} | {
    name: string;
    value: "upgradeable";
    short: "upgradeable";
} | {
    name: string;
    value: "minimal";
    short: "minimal";
})[];
declare type Kind = typeof kinds[number]['value'];
export interface Args {
    contract: string;
    arguments: string[];
}
export interface Options {
    from?: string;
    network?: string;
    skipCompile?: boolean;
    kind?: Kind;
    networkFile?: NetworkFile;
    txParams?: TxParams;
}
export declare const name = "deploy";
export declare const description = "deploy a contract instance";
export declare const args: Arg[];
export declare const options: Option[];
export {};
