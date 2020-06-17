interface NetworkConfigInterface extends ConfigInterface {
    artifactDefaults: ArtifactDefaults;
    network: Network;
}
interface ConfigInterface {
    networks: {
        [network: string]: Network;
    };
    provider: Provider;
    buildDir: string;
}
interface NetworkCamelCase<T> {
    networkId: T;
}
interface NetworkSnakeCase<T> {
    network_id: T;
}
declare type NetworkId<T> = NetworkCamelCase<T> | NetworkSnakeCase<T> | (NetworkCamelCase<T> & NetworkSnakeCase<T>);
declare type NetworkURL = {
    url: string;
};
declare type NetworkURLParts = {
    host: string;
    port?: number | string;
    protocol?: string;
    path?: string;
};
declare type NetworkConnection = NetworkURL | NetworkURLParts;
declare type Network = NetworkConnection & NetworkId<string | number> & {
    from?: number | string;
    gas?: number | string;
    gasPrice?: number | string;
    provider?: string | (() => any);
};
interface ArtifactDefaults {
    from?: number | string;
    gas?: number | string;
    gasPrice?: number | string;
}
declare type Provider = string | ((any: any) => any);
declare const NetworkConfig: {
    name: string;
    initialize(root?: string): void;
    exists(root?: string): boolean;
    getConfig(root?: string): ConfigInterface;
    getBuildDir(): string;
    loadNetworkConfig(networkName: string, root?: string): NetworkConfigInterface;
    getProvider(network: Network): Provider;
    getURL(network: Network): string;
    getArtifactDefaults(zosConfigFile: ConfigInterface, network: Network): ArtifactDefaults;
    createContractsDir(root: string): void;
    createNetworkConfigFile(root: string): void;
    createDir(dir: string): void;
    getConfigFileName(root: string): string;
};
export default NetworkConfig;
