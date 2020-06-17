export declare function getBuildArtifacts(path?: string): BuildArtifacts;
export interface Artifact {
    abi: any[];
    ast: any;
    bytecode: string;
    compiler: any;
    contractName: string;
    deployedBytecode: string;
    deployedSourceMap: string;
    fileName: string;
    legacyAST?: any;
    networks: any;
    schemaVersion: string;
    source: string;
    sourceMap: string;
    sourcePath: string;
    updatedAt: string;
}
export declare class BuildArtifacts {
    private sourcesToArtifacts;
    constructor(artifactsPaths: string[]);
    listSourcePaths(): string[];
    listArtifacts(): Artifact[];
    getArtifactByName(name: string): Artifact | undefined;
    getArtifactsFromSourcePath(sourcePath: string): Artifact[];
    getSourcePathFromArtifact(artifact: Artifact): string;
    private registerArtifactForSourcePath;
}
