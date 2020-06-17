declare const TruffleConfig: {
    name: string;
    exists(path?: string): boolean;
    isTruffleProject(path?: string): boolean;
    loadNetworkConfig(network: string, force?: boolean, path?: string): Promise<any>;
    getBuildDir(): string;
    getConfig(force?: boolean): any;
    checkHdWalletProviderVersion(provider: any, path?: string): Promise<void>;
    getArtifactDefaults(config: any): {
        [x: string]: any;
    };
    getConfigFileName(path: string): string;
};
export default TruffleConfig;
