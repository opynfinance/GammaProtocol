export type SubParser<R> = (url: string) => Promise<R | null>;
