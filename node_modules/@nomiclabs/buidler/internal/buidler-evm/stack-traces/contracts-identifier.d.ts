import { EvmMessageTrace } from "./message-trace";
import { Bytecode } from "./model";
export declare class ContractsIdentifier {
    private readonly _enableCache;
    private _trie;
    private _cache;
    constructor(_enableCache?: boolean);
    addBytecode(bytecode: Bytecode): void;
    getBytecodeFromMessageTrace(trace: EvmMessageTrace): Bytecode | undefined;
    private _searchBytecode;
}
//# sourceMappingURL=contracts-identifier.d.ts.map