import { CompilerVersionOptions } from '../models/compiler/solidity/SolidityContractsCompiler';
export declare function getPragma(source: string): string;
export declare function compilerVersionsMatch(v1: string, v2: string): boolean;
export declare function compilerSettingsMatch(s1: CompilerVersionOptions, s2: CompilerVersionOptions): boolean;
export declare function getImports(source: string): string[];
