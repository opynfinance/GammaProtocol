export interface Opcode {
    name: string;
    fee: number;
    isAsync: boolean;
}
export interface OpcodeList {
    [code: number]: Opcode;
}
export declare function getOpcodesForHF(hf: string): {
    [x: number]: Opcode;
};
