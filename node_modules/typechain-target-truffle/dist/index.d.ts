import { TsGeneratorPlugin, TContext, TFileDesc } from "ts-generator";
export interface ITruffleCfg {
    outDir?: string;
}
export default class Truffle extends TsGeneratorPlugin {
    name: string;
    private readonly outDirAbs;
    private contracts;
    constructor(ctx: TContext<ITruffleCfg>);
    transformFile(file: TFileDesc): TFileDesc | void;
    afterRun(): TFileDesc[];
}
