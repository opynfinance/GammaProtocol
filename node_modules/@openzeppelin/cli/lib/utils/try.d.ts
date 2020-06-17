export declare function tryFunc<T>(func: () => T, ifException?: T): T;
export declare function tryAwait<T>(func: () => Promise<T>, ifException?: T): Promise<T>;
