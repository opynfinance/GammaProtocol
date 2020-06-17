import { RawContract, CompiledContract } from './SolidityContractsCompiler';
import { SolcBuild } from './CompilerProvider';
import { ProjectCompilerOptions } from '../ProjectCompilerOptions';
export declare function compileProject(options?: ProjectCompilerOptions): Promise<ProjectCompileResult>;
export interface ProjectCompileResult {
    compilerVersion: SolcBuild;
    contracts: RawContract[];
    artifacts: CompiledContract[];
}
