import Contract from '../artifacts/Contract';
export interface CalldataInfo {
    method: FunctionInfo;
    callData: string;
}
interface InputInfo {
    name?: string;
    type: string;
    components?: InputInfo[];
}
interface FunctionInfo {
    name: string;
    inputs: InputInfo[];
}
export declare function buildDeploymentCallData(contract: Contract, args: any[]): string;
export declare function buildCallData(contract: Contract, methodName: string, args: any[]): CalldataInfo;
export declare function getABIFunction(contract: Contract, methodName: string, args: any[]): FunctionInfo;
export declare function getArgTypeLabel(arg: InputInfo): string;
export declare function callDescription(method: any, args: string[]): string;
declare const _default: {
    buildCallData: typeof buildCallData;
    getABIFunction: typeof getABIFunction;
    getArgTypeLabel: typeof getArgTypeLabel;
    callDescription: typeof callDescription;
};
export default _default;
