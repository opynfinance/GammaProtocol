export declare function setupLoader({ provider, defaultSender, defaultGas, }: {
    provider: any;
    defaultSender: string;
    defaultGas: number;
}): {
    web3: {
        fromABI: (abi: object, bytecode?: string) => any;
        fromArtifacts: (contract: string) => any;
    };
    truffle: {
        fromABI: (abi: object, bytecode?: string) => any;
        fromArtifacts: (contract: string) => any;
    };
};
