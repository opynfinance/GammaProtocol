import { CompilerOptimizerOptions, CompilerInfo } from 'solc-wrapper';
import { SolcBuild } from './CompilerProvider';
export interface CompiledContract {
    fileName: string;
    contractName: string;
    source: string;
    sourcePath: string;
    sourceMap: string;
    abi: any[];
    ast: any;
    legacyAST?: any;
    bytecode: string;
    deployedBytecode: string;
    deployedSourceMap: string;
    compiler: CompilerInfo;
}
export interface RawContract {
    filePath: string;
    source: string;
    lastModified?: number;
    dependency?: string;
}
export interface CompilerVersionOptions {
    optimizer?: CompilerOptimizerOptions;
    evmVersion?: string;
}
export interface CompilerOptions extends CompilerVersionOptions {
    version?: string;
}
export declare function defaultEVMVersion(version: any): "byzantium" | "petersburg";
export declare const DEFAULT_OPTIMIZER: {
    enabled: boolean;
};
export declare function compile(contracts: RawContract[], options?: CompilerOptions): Promise<CompiledContract[]>;
export declare function resolveCompilerVersion(contracts: RawContract[], options?: CompilerOptions): Promise<SolcBuild>;
export declare function compileWith(compilerVersion: SolcBuild, contracts: RawContract[], options?: CompilerVersionOptions): Promise<CompiledContract[]>;
