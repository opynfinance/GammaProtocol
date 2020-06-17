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
const Compiler_1 = require("../models/compiler/Compiler");
const telemetry_1 = __importDefault(require("../telemetry"));
const ProjectFile_1 = __importDefault(require("../models/files/ProjectFile"));
const lodash_1 = require("lodash");
const prompt_1 = require("../prompts/prompt");
const typechain_1 = require("../prompts/typechain");
const name = 'compile';
const signature = `${name}`;
const description = `compiles all contracts in the current project`;
const register = program => program
    .command(signature, undefined, { noHelp: true })
    .description(description)
    .option('--solc-version [version]', 'version of the solc compiler to use (value is written to configuration file for future runs, defaults to most recent release that satisfies contract pragmas)')
    .option('--optimizer [on|off]', 'enables compiler optimizer (value is written to configuration file for future runs, defaults to off)')
    .option('--optimizer-runs [runs]', 'specify number of runs if optimizer enabled (value is written to configuration file for future runs, defaults to 200)')
    .option('--evm-version [evm]', `choose target evm version (value is written to configuration file for future runs, defaults depends on compiler: byzantium prior to 0.5.5, petersburg from 0.5.5)`)
    .option('--typechain [web3-v1|truffle|ethers]', 'enables typechain generation of typescript wrappers for contracts using the chosen target')
    .option('--typechain-outdir [path]', 'path where typechain artifacts are written (defaults to ./types/contracts/)')
    .withNonInteractiveOption()
    .action(action);
function action(options) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        const { evmVersion, solcVersion: version, optimizer, optimizerRuns, interactive } = options;
        // Handle optimizer option:
        //- on --optimizer or --optimizer=on, enable it
        //- on --optimizer=off disable it
        //- if no --optimizer is set, use default from project.json, or false
        //- on any other --optimizer value, throw
        let optimizerEnabled = undefined;
        if (typeof optimizer === 'string') {
            if (optimizer.toLowerCase() === 'on')
                optimizerEnabled = true;
            else if (optimizer.toLowerCase() === 'off')
                optimizerEnabled = false;
            else
                throw new Error(`Invalid value ${optimizer} for optimizer flag (valid values are 'on' or 'off')`);
        }
        else if (typeof optimizer === 'boolean') {
            optimizerEnabled = optimizer;
        }
        const compilerOptions = {
            manager: 'openzeppelin',
            evmVersion,
            version,
            optimizer: {
                enabled: optimizerEnabled,
                runs: optimizerRuns && parseInt(optimizerRuns),
            },
        };
        const isTypechainOptionSet = !lodash_1.isUndefined(options.typechain);
        const projectFile = new ProjectFile_1.default();
        let typechainEnabled = isTypechainOptionSet ? true : undefined;
        let typechainOutdir = options.typechainOutdir;
        let typechainTarget = typeof options.typechain === 'string' ? options.typechain : undefined;
        // If typechain settings are undefined, we are running from an old project, so we ask the user if they want to enable
        // it if we find a ts-config. We also prompt if the user specified any typechain related option in the command line,
        // and hence set typechainEnabled=true.
        if ((projectFile.exists() && lodash_1.isUndefined((_b = (_a = projectFile.compilerOptions) === null || _a === void 0 ? void 0 : _a.typechain) === null || _b === void 0 ? void 0 : _b.enabled)) || isTypechainOptionSet) {
            // We need to define different sets of questions because, if typechainEnabled is set, promptIfNeeded will skip
            // the question, which will cause typechainEnabled *not* to be set in the inquirer questions, so the `when` clause
            // in the typechainTarget and typechainOutdir questions will not pass, and they will never be asked.
            // We will probably be able to simplify this with the new interactive questions built in 2.8.
            ({ typechainEnabled, typechainTarget, typechainOutdir } = yield prompt_1.promptIfNeeded({
                args: { typechainEnabled, typechainTarget, typechainOutdir },
                defaults: { typechainOutdir: './types/contracts' },
                props: isTypechainOptionSet ? typechain_1.TypechainSettingsQuestions(isTypechainOptionSet) : typechain_1.TypechainQuestions,
            }, interactive));
            typechainEnabled = typechainEnabled || isTypechainOptionSet; // We ensure to re-set this option if it was not asked
            compilerOptions.typechain = { enabled: typechainEnabled };
            if (typechainEnabled) {
                // For some reason, the default is ignored if no-interactive is set
                typechainOutdir = typechainOutdir || './types/contracts';
                Object.assign(compilerOptions.typechain, { outDir: typechainOutdir, target: typechainTarget });
                compilerOptions.force = true;
            }
        }
        yield telemetry_1.default.report('compile', { evmVersion, solcVersion: version, optimizer, optimizerRuns, typechain: typechainTarget, typechainOutdir }, options.interactive);
        yield Compiler_1.compile(compilerOptions);
    });
}
exports.default = { name, signature, description, register, action };
//# sourceMappingURL=compile.js.map