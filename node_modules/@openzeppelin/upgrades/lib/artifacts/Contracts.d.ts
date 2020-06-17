import Contract from './Contract';
export default class Contracts {
    private static DEFAULT_BUILD_DIR;
    private static DEFAULT_CONTRACTS_DIR;
    private static buildDir;
    private static contractsDir;
    private static projectRoot;
    private static artifactDefaults;
    private static defaultFromAddress;
    static getLocalBuildDir(): string;
    static getLocalContractsDir(): string;
    static getProjectRoot(): string;
    static getDefaultTxParams(): Promise<any>;
    static getArtifactsDefaults(): any;
    static getLocalPath(contractName: string): string;
    static getLibPath(contractName: string): string;
    static getNodeModulesPath(dependency: string, contractName: string): string;
    static getFromLocal(contractName: string): Contract;
    static getFromLib(contractName: string): Contract;
    static getFromNodeModules(dependency: string, contractName: string): Contract;
    static getDefaultFromAddress(): Promise<string>;
    static listBuildArtifacts(pathName?: string): string[];
    static setLocalBuildDir(dir: string): void;
    static setLocalContractsDir(dir: string): void;
    static setProjectRoot(dir: string): void;
    static setArtifactsDefaults(defaults: any): void;
    private static _getFromPath;
}
