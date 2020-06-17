import { ContractMethodMutability as Mutability } from '@openzeppelin/upgrades';
import ProjectFile from '../models/files/ProjectFile';
import { ProxyInterface } from '../models/files/NetworkFile';
import * as choices from './choices';
declare type ChoicesT = string[] | {
    [key: string]: any;
};
export interface InquirerQuestions {
    [key: string]: InquirerQuestion;
}
interface InquirerQuestion {
    type: string;
    message: string;
    isInquirerQuestion?: boolean;
    default?: any;
    choices?: ChoicesT;
    when?: (answers: {
        [key: string]: any;
    }) => boolean;
    transformer?: (value: string, answers: {
        [key: string]: any;
    }) => string;
    normalize?: (input?: any) => any;
    validate?: (input?: any) => boolean | string;
}
interface PromptParam {
    [key: string]: any;
}
interface PromptParams {
    args?: PromptParam;
    opts?: PromptParam;
    defaults?: PromptParam;
    props?: InquirerQuestions;
}
export interface MethodArgType {
    type: string;
    internalType?: string;
    components?: MethodArg[];
}
export interface MethodArg extends MethodArgType {
    name: string;
}
export declare const DISABLE_INTERACTIVITY: boolean;
export declare function promptIfNeeded({ args, opts, defaults, props }: PromptParams, interactive: any): Promise<any>;
export declare function networksList(name: string, type: string, message?: string): {
    [key: string]: any;
};
export declare function proxiesList(pickProxyBy: string, network: string, filter?: ProxyInterface, projectFile?: ProjectFile): {
    [key: string]: any;
};
export declare function contractsList(name: string, message: string, type: string, source?: choices.ContractsSource): {
    [key: string]: any;
};
export declare function methodsList(contractFullName: string, constant?: Mutability, projectFile?: ProjectFile): {
    [key: string]: any;
};
export declare function argLabelWithIndex(arg: MethodArg, index: number): string;
export declare function argLabel(arg: MethodArg): string;
export declare function argsList(contractFullName: string, methodIdentifier: string, constant?: Mutability, projectFile?: ProjectFile): MethodArg[];
export declare function proxyInfo(contractInfo: any, network: string): any;
export declare function promptForNetwork(options: any, getCommandProps: () => any): Promise<{
    network: string;
}>;
export {};
