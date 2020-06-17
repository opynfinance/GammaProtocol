declare function inLogs(logs: any, eventName: string, eventArgs?: any): any;
declare function inTransaction(tx: any, eventName: string, eventArgs?: {}): Promise<any>;
declare const _default: {
    inLogs: typeof inLogs;
    inTransaction: typeof inTransaction;
};
export default _default;
