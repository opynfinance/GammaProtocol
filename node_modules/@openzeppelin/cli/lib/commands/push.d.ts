declare function action(options: any): Promise<void>;
declare function runActionIfRequested(externalOptions: any): Promise<void>;
declare function runActionIfNeeded(contracts: string[], network: string, options: any): Promise<void>;
declare const _default: {
    name: string;
    signature: string;
    description: string;
    register: (program: any) => any;
    action: typeof action;
    runActionIfRequested: typeof runActionIfRequested;
    runActionIfNeeded: typeof runActionIfNeeded;
};
export default _default;
