import { CompilerOutput, CompilerInput } from 'solc-wrapper';
export interface SolcCompiler {
    version(): string;
    compile(input: CompilerInput): Promise<CompilerOutput>;
}
export interface SolcBuild {
    path: string;
    version: string;
    build: string;
    longVersion: string;
    keccak256: string;
    urls: string[];
}
export declare function resolveCompilerVersion(requiredSemver: string | string[]): Promise<SolcBuild>;
export declare function fetchCompiler(build: SolcBuild): Promise<SolcCompiler>;
export declare function getCompiler(requiredSemver: string | string[]): Promise<SolcCompiler>;
export declare function getCompilerBinary(compilerPath: string): any;
export declare function setSolcCachePath(value: any): void;
export declare function setSolcBinEnv(value: any): void;
