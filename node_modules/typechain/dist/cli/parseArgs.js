"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commandLineArgs = require("command-line-args");
const DEFAULT_GLOB_PATTERN = "**/*.abi";
function parseArgs() {
    const optionDefinitions = [
        { name: "glob", type: String, defaultOption: true },
        { name: "target", type: String },
        { name: "outDir", type: String },
    ];
    const rawOptions = commandLineArgs(optionDefinitions);
    return {
        files: rawOptions.glob || DEFAULT_GLOB_PATTERN,
        outDir: rawOptions.outDir,
        target: rawOptions.target,
    };
}
exports.parseArgs = parseArgs;
