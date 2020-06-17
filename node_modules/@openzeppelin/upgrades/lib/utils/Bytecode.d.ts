import Contract from '../artifacts/Contract';
export declare function bodyCode(contract: Contract): string;
export declare function constructorCode(contract: Contract): string;
export declare function bytecodeDigest(rawBytecode: string): string;
export declare function getSolidityLibNames(bytecode: string): string[];
export declare function hasUnlinkedVariables(bytecode: string): boolean;
export declare function tryRemoveMetadata(bytecode: string): string;
export declare function replaceSolidityLibAddress(bytecode: string, address: string): string;
export declare function isSolidityLib(bytecode: string): boolean;
