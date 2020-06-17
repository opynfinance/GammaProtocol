export interface SessionOptions {
    network?: string;
    from?: string;
    timeout?: number;
    blockTimeout?: number;
    expires?: Date;
}
declare const Session: {
    getOptions(overrides?: SessionOptions, silent?: boolean): SessionOptions;
    setDefaultNetworkIfNeeded(network: string): void;
    getNetwork(): {
        network: string;
        expired: boolean;
    };
    open({ network, from, timeout, blockTimeout }: SessionOptions, expires?: number, logInfo?: boolean): void;
    close(): void;
    ignoreFile(): void;
    _parseSession(): SessionOptions;
    _setDefaults(session: SessionOptions): SessionOptions;
    _hasExpired(session: SessionOptions): boolean;
};
export default Session;
