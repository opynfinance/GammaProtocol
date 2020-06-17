import { ParamType } from 'ethers/utils/abi-coder';
export declare function encodeParams(types?: (string | ParamType)[], rawValues?: any[]): string;
export default function encodeCall(name: string, types?: (string | ParamType)[], rawValues?: any[]): string;
export declare function decodeCall(types?: (string | ParamType)[], data?: any[]): any[];
