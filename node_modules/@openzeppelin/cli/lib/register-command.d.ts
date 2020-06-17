import { Command } from 'commander';
import { Choice } from './prompts/choices';
export declare function generateSignature(name: string, args: Arg[]): string;
export interface ParamDetails {
    prompt?: string;
    promptType?: 'confirm' | 'list' | 'input';
    choices?: readonly Choice[];
    preselect?: string | boolean;
    validationError?: (value: string | boolean) => string | undefined;
}
declare type Param = ParamSimple | ParamVariadic;
interface ParamSimple {
    variadic?: false;
    details?: (params: object) => Promise<ParamDetails | undefined>;
    after?: (params: object) => Promise<void>;
}
interface ParamVariadic {
    variadic: true;
    details?: (params: object) => Promise<ParamDetails[]>;
    after?: (params: object) => Promise<void>;
}
export declare type Arg = Param & {
    name: string;
};
export interface Option extends ParamSimple {
    format: string;
    description: string;
    default?: string | boolean;
}
declare type AbortFunction = () => Promise<void>;
interface Action {
    action: (params: object) => Promise<void>;
    preAction?: (params: object) => Promise<void | AbortFunction>;
}
interface CommandSpec {
    name: string;
    description: string;
    args: Arg[];
    options: Option[];
}
export declare function register(program: Command, spec: CommandSpec, getAction: () => Promise<Action>): void;
export {};
