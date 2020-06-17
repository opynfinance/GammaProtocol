declare function action(proxyReference: string, newAdmin: string, options: any): Promise<void | never>;
declare const _default: {
    name: string;
    signature: string;
    description: string;
    register: (program: any) => any;
    action: typeof action;
};
export default _default;
