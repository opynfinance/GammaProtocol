import { ProjectCompileResult } from './solidity/SolidityProjectCompiler';
import { ProjectCompilerOptions } from './ProjectCompilerOptions';
import ProjectFile from '../files/ProjectFile';
export declare function compile(compilerOptions?: ProjectCompilerOptions, projectFile?: ProjectFile, force?: boolean): Promise<void>;
export declare function compileWithSolc(compilerOptions?: ProjectCompilerOptions): Promise<ProjectCompileResult>;
export declare function compileWithTruffle(): Promise<undefined>;
export declare function resetState(): void;
