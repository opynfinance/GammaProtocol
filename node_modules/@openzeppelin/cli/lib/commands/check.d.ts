declare function action(contractAlias: string, options: any): Promise<void>;
declare const _default: {
    name: string;
    signature: string;
    description: string;
    register: (program: any) => any;
    action: typeof action;
};
export default _default;
