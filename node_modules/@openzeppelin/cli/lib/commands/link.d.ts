declare function action(dependencies: string[], options: any): Promise<void>;
declare function runActionIfNeeded(contractFullName: string, options: any): Promise<void>;
declare const _default: {
    name: string;
    signature: string;
    description: string;
    register: (program: any) => any;
    action: typeof action;
    runActionIfNeeded: typeof runActionIfNeeded;
};
export default _default;
