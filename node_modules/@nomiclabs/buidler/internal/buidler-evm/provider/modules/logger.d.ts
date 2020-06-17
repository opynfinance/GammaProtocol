export declare class ModulesLogger {
    private _logs;
    private _titleLength;
    log(message: string): void;
    logWithTitle(title: string, message: string): void;
    debug(...args: any[]): void;
    clearLogs(): void;
    hasLogs(): boolean;
    getLogs(): string[];
}
//# sourceMappingURL=logger.d.ts.map