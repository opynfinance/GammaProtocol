"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = __importDefault(require("fs-extra"));
const push_1 = __importDefault(require("./push"));
const init_1 = __importDefault(require("../scripts/init"));
const semver_1 = __importDefault(require("semver"));
const prompt_1 = require("../prompts/prompt");
const ProjectFile_1 = __importDefault(require("../models/files/ProjectFile"));
const validators_1 = require("../prompts/validators");
const telemetry_1 = __importDefault(require("../telemetry"));
const typechain_1 = require("../prompts/typechain");
const name = 'init';
const signature = `${name} [project-name] [version]`;
const description = `initialize your OpenZeppelin project. Provide a <project-name> and optionally an initial [version] name`;
const register = program => program
    .command(signature, undefined, { noHelp: true })
    .usage('<project-name> [version]')
    .description(description)
    .option('--publish', 'automatically publish your project upon pushing it to a network')
    .option('--force', 'overwrite existing project if there is one')
    .option('--typechain <target>', 'enable typechain support with specified target (web3-v1, ethers, or truffle)')
    .option('--typechain-outdir <path>', 'set output directory for typechain compilation (defaults to types/contracts)')
    .option('--link <dependency>', 'link to a dependency')
    .option('--no-install', 'skip installing packages dependencies locally')
    .withPushOptions()
    .withNonInteractiveOption()
    .action(action);
function action(projectName, version, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const { publish, force, link, install: installDependencies, interactive, typechainOutdir, typechain } = options;
        const args = {
            name: projectName,
            version,
            typechainEnabled: typechain ? true : typechain,
            typechainTarget: typechain,
            typechainOutdir,
        };
        const props = getCommandProps();
        const defaults = fs_extra_1.default.readJsonSync('package.json', { throws: false }) || { version: '1.0.0' };
        const prompted = yield prompt_1.promptIfNeeded({ args, defaults, props }, interactive);
        const dependencies = link ? link.split(',') : [];
        const flags = { dependencies, installDependencies, force, publish };
        const initArguments = Object.assign(Object.assign({}, prompted), flags);
        yield telemetry_1.default.report('init', initArguments, interactive);
        yield init_1.default(initArguments);
        yield push_1.default.runActionIfRequested(options);
    });
}
function runActionIfNeeded(options) {
    return __awaiter(this, void 0, void 0, function* () {
        const { interactive } = options;
        const projectFile = new ProjectFile_1.default();
        if (interactive && !projectFile.exists()) {
            yield action(undefined, undefined, { dontExitProcess: true });
        }
    });
}
function getCommandProps() {
    return Object.assign({ name: {
            message: 'Welcome to the OpenZeppelin SDK! Choose a name for your project',
            type: 'input',
            validate: validators_1.notEmpty,
        }, version: {
            message: 'Initial project version',
            type: 'input',
            validate: input => {
                if (semver_1.default.parse(input))
                    return true;
                return `Invalid semantic version: ${input}`;
            },
        } }, typechain_1.TypechainQuestions);
}
exports.default = {
    name,
    signature,
    description,
    register,
    action,
    runActionIfNeeded,
};
//# sourceMappingURL=init.js.map