"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const commander_1 = __importDefault(require("commander"));
const upgrades_1 = require("@openzeppelin/upgrades");
const commands_1 = __importDefault(require("../commands"));
const lodash_1 = require("lodash");
// Do not use import here or Typescript will create wrong build folder
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { version } = require('../../package.json');
require('./options');
let commandsList = Object.values(commands_1.default);
commandsList = lodash_1.sortBy(commandsList, 'name');
commandsList.forEach((command) => command.register(commander_1.default));
// Remove the status command from the command list
commandsList = commandsList.filter(c => c.name !== 'status');
const maxLength = Math.max(...commandsList.map(command => command.signature.length));
commander_1.default
    .name('openzeppelin|oz')
    .usage('<command> [options]')
    .description(`where <command> is one of: ${commandsList.map(c => c.name).join(', ')}`)
    .version(version, '--version')
    .option('-v, --verbose', 'verbose mode on: output errors stacktrace and detailed log.')
    .option('-s, --silent', 'silent mode: no output sent to stderr.')
    .on('option:verbose', () => upgrades_1.Loggy.verbose(true))
    .on('option:silent', () => upgrades_1.Loggy.silent(true))
    .on('--help', () => commandsList.forEach(c => console.log(`   ${chalk_1.default.bold(c.signature.padEnd(maxLength))}\t${c.description}\n`)));
exports.default = commander_1.default;
//# sourceMappingURL=program.js.map