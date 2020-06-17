export declare function createAction(contractFullName: string, options: any): Promise<void>;
declare function action(contractFullName: string, options: any): Promise<void>;
declare const _default: {
    name: string;
    signature: string;
    description: string;
    register: (program: any) => any;
    action: typeof action;
};
export default _default;
