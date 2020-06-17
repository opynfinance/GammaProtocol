"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typechain_1 = require("typechain");
const ts_generator_1 = require("ts-generator");
const path_1 = require("path");
const generation_1 = require("./generation");
const DEFAULT_OUT_PATH = "./types/truffle-contracts/";
class Truffle extends ts_generator_1.TsGeneratorPlugin {
    constructor(ctx) {
        super(ctx);
        this.name = "Truffle";
        this.contracts = [];
        const { cwd, rawConfig } = ctx;
        this.outDirAbs = path_1.resolve(cwd, rawConfig.outDir || DEFAULT_OUT_PATH);
    }
    transformFile(file) {
        const abi = typechain_1.extractAbi(file.contents);
        const isEmptyAbi = abi.length === 0;
        if (isEmptyAbi) {
            return;
        }
        const name = typechain_1.getFilename(file.path);
        const contract = typechain_1.parse(abi, name);
        this.contracts.push(contract);
    }
    afterRun() {
        return [
            {
                path: path_1.join(this.outDirAbs, "index.d.ts"),
                contents: generation_1.codegen(this.contracts),
            },
            {
                path: path_1.join(this.outDirAbs, "merge.d.ts"),
                contents: generation_1.generateArtifactHeaders(this.contracts),
            },
        ];
    }
}
exports.default = Truffle;
