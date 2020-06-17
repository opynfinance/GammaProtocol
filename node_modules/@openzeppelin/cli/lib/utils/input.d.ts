import { MethodArgType } from '../prompts/prompt';
export declare function parseArgs(args: string): string[] | never;
declare type NestedArray<T> = T[] | NestedArray<T>[];
export declare function parseMultipleArgs(args: NestedArray<string>, types: MethodArgType[]): unknown[];
export declare function parseArg(input: string | NestedArray<string>, { type, components }: MethodArgType): any;
export declare function stripBrackets(inputMaybeWithBrackets: string): string;
export declare function stripParens(inputMaybeWithParens: string): string;
/**
 * Parses a string as an arbitrarily nested array of strings. Handles
 * unquoted strings in the input, or quotes using both simple and double quotes.
 * @param input string to parse
 * @returns parsed ouput.
 */
export declare function parseArray(input: string, open?: string, close?: string): NestedArray<string>;
export declare function parseMethodParams(options: any, defaultMethod?: string): {
    methodName: any;
    methodArgs: any[];
};
export declare function validateSalt(salt: string, required?: boolean): void;
export declare function getSampleInput(arg: MethodArgType): string | null;
export {};
