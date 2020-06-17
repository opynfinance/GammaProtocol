interface VerifierOptions {
    contractName: string;
    compilerVersion: string;
    optimizer: boolean;
    optimizerRuns: string;
    contractSource: string;
    contractAddress: string;
    network: string;
    apiKey?: string;
}
declare const Verifier: {
    verifyAndPublish(remote: string, params: VerifierOptions): Promise<void>;
};
export default Verifier;
