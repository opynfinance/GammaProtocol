import { ProjectCompilerOptions } from '../compiler/ProjectCompilerOptions';
interface ConfigFileCompilerOptions {
    manager: string;
    solcVersion: string;
    contractsDir: string;
    artifactsDir: string;
    compilerSettings: {
        evmVersion: string;
        optimizer: {
            enabled: boolean;
            runs?: string;
        };
    };
    typechain: {
        enabled: boolean;
        outDir?: string;
        target?: string;
    };
}
interface ProjectFileData {
    name: string;
    version: string;
    manifestVersion?: string;
    zosversion?: string;
    dependencies: {
        [name: string]: string;
    };
    contracts: {
        [alias: string]: string;
    };
    publish: boolean;
    compiler: Partial<ConfigFileCompilerOptions>;
    telemetryOptIn?: boolean;
}
export declare const PROJECT_FILE_NAME = "project.json";
export declare const PROJECT_FILE_PATH: string;
export declare const LEGACY_PROJECT_FILE_NAME = "zos.json";
export default class ProjectFile {
    filePath: string;
    root: string;
    data: ProjectFileData;
    static getLinkedDependencies(filePath?: string): string[];
    static getExistingProject(folder: string): ProjectFile;
    constructor(filePath?: string, root?: string);
    exists(): boolean;
    set manifestVersion(version: string);
    set publish(publish: boolean);
    set name(name: string);
    get name(): string;
    set telemetryOptIn(optIn: boolean);
    get telemetryOptIn(): boolean | undefined;
    set version(version: string);
    get version(): string;
    set contracts(contracts: {
        [alias: string]: string;
    });
    get contracts(): {
        [alias: string]: string;
    };
    get dependencies(): {
        [name: string]: string;
    };
    get dependenciesNames(): string[];
    getDependencyVersion(name: string): string;
    hasDependency(name: string): boolean;
    hasDependencies(): boolean;
    get contractAliases(): string[];
    get contractNames(): string[];
    get isPublished(): boolean;
    get compilerOptions(): ProjectCompilerOptions;
    get linkedDependencies(): string[];
    setCompilerOptions(options: ProjectCompilerOptions): void;
    normalizeContractAlias(nameOrAlias: string): string;
    contract(alias: string): string;
    hasName(name: string): boolean;
    dependencyMatches(name: string, version: string): boolean;
    isCurrentVersion(version: string): boolean;
    hasContract(alias: string): boolean;
    hasContracts(): boolean;
    setDependency(name: string, version: string): void;
    unsetDependency(name: string): void;
    addContract(alias: string, name: string | undefined): void;
    unsetContract(alias: string): void;
    write(): void;
    private hasChanged;
}
export {};
