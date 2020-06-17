export declare enum LogType {
    Info = 0,
    Warn = 1,
    Err = 2
}
export declare enum LogLevel {
    Normal = 0,
    Verbose = 1,
    Silent = 2
}
export declare enum SpinnerAction {
    Add = "spinning",
    Update = "update",
    Fail = "fail",
    Succeed = "succeed",
    NonSpinnable = "non-spinnable"
}
interface LogInfo {
    logType?: LogType;
    logLevel?: LogLevel;
    spinnerAction?: SpinnerAction;
}
interface UpdateParams {
    spinnerAction?: SpinnerAction;
    text?: string;
}
declare const logTypes: {
    info: LogType;
    warn: LogType;
    error: LogType;
};
export declare class Loggy {
    private static logs;
    private static isSilent;
    private static isVerbose;
    private static isTesting;
    static silent(value: boolean): void;
    static verbose(value: boolean): void;
    static testing(value: boolean): void;
    static add(file: string, fnName: string, reference: string, text: string, { logLevel, logType, spinnerAction }?: LogInfo): void;
    static update(reference: string, { spinnerAction, text }: UpdateParams, file?: string): void;
    static succeed(reference: string, text?: string): void;
    static fail(reference: string, text?: string): void;
    static stopAll(spinnerAction?: SpinnerAction): void;
    static onVerbose(file: string, fnName: string, reference: string, text: string): void;
    private static log;
    private static actionToText;
    private static getColorFor;
    static spin: LogSpinFunction;
    static noSpin: LogSpinFunction;
}
declare type LogFunction = (file: string, fnName: string, reference: string, text: string) => void;
declare type LogTypeFunctions = {
    [t in keyof typeof logTypes]: LogFunction & {
        onVerbose: LogFunction;
    };
};
declare type LogSpinFunction = LogFunction & LogTypeFunctions & {
    onVerbose: LogFunction;
};
export {};
