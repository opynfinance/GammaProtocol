export declare type SemanticVersion = [number, number, number];
declare type RawSemanticVersion = [any, any, any];
export declare function toSemanticVersion(version: string | RawSemanticVersion): SemanticVersion | never;
export declare function semanticVersionToString(version: string | RawSemanticVersion): string | never;
export declare function semanticVersionEqual(v1: string | RawSemanticVersion, v2: string | RawSemanticVersion): boolean;
declare const _default: {
    toSemanticVersion: typeof toSemanticVersion;
    semanticVersionToString: typeof semanticVersionToString;
    semanticVersionEqual: typeof semanticVersionEqual;
};
export default _default;
