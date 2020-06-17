interface ResolvedFile {
    name: string;
    url: string;
    root: string;
    dependency?: string;
}
interface ResolvedFileWithContent extends ResolvedFile {
    content: string;
}
/**
 * Starts with roots and traverses the whole depedency tree of imports, returning an array of sources
 * @param rootContracts
 * @param workingDir What's the starting working dir for resolving relative imports in roots
 * @param resolver
 */
export declare function gatherSources(rootContracts: string[], workingDir: string): Promise<ResolvedFileWithContent[]>;
export {};
