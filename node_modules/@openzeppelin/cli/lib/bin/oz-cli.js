#! /usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = __importDefault(require("fs-extra"));
const upgrades_1 = require("@openzeppelin/upgrades");
const lockfile_1 = require("lockfile");
const program_1 = __importDefault(require("./program"));
const helpers_1 = __importDefault(require("./helpers"));
const errors_1 = __importDefault(require("./errors"));
const constants_1 = require("../models/files/constants");
const IGNORED_COMMANDS_IN_ROOT_DIR = ['init', 'unpack'];
const [nodePath, binPath, command] = process.argv;
if (!IGNORED_COMMANDS_IN_ROOT_DIR.includes(command)) {
    const currentPath = process.cwd();
    const rootDirectory = helpers_1.default(currentPath) || currentPath;
    if (rootDirectory !== process.cwd())
        process.chdir(rootDirectory);
}
// Acquire file lock to ensure no other instance is running
try {
    fs_extra_1.default.ensureDirSync(constants_1.OPEN_ZEPPELIN_FOLDER);
    lockfile_1.lockSync(constants_1.LOCK_FILE_PATH, { retries: 0 });
}
catch (e) {
    console.error(`Cannot run more than one instance of 'openzeppelin' at the same time.\nIf you are sure that no other instances are actually running, manually remove the file ${constants_1.LOCK_FILE_PATH} and try again.`);
    process.exit(1);
}
upgrades_1.Loggy.silent(false);
if (binPath.match(/zos$/)) {
    upgrades_1.Loggy.noSpin.warn(__filename, 'oz-cli', `deprecated-zos-bin`, `'zos' command is deprecated and will be removed in the next major version. Please use 'openzeppelin' or 'oz' instead.`);
}
errors_1.default(program_1.default);
program_1.default.parse(process.argv);
if (program_1.default.args.length === 0)
    program_1.default.help();
//# sourceMappingURL=oz-cli.js.map