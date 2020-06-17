export interface ParsedContractReference {
    proxyAddress: string | undefined;
    contractAlias: string | undefined;
    packageName: string | undefined;
}
export declare function parseContractReference(contractReference: string): ParsedContractReference;
