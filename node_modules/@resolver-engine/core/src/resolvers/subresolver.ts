export interface ResolverContext {
  cwd?: string;
}

// Resolver takes a short-cut name of the file (URI), and returns a cannonical location (URL) of where the source exists
// https://stackoverflow.com/questions/176264/what-is-the-difference-between-a-uri-a-url-and-a-urn/1984225#1984225
export type SubResolver = (what: string, context: ResolverContext) => Promise<string | null>;
