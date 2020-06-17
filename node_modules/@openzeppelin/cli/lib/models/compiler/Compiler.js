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
const child_process_1 = require("child_process");
const upgrades_1 = require("@openzeppelin/upgrades");
const TruffleConfig_1 = __importDefault(require("../config/TruffleConfig"));
const SolidityProjectCompiler_1 = require("./solidity/SolidityProjectCompiler");
const find_up_1 = __importDefault(require("find-up"));
const ProjectFile_1 = __importDefault(require("../files/ProjectFile"));
const util_1 = require("util");
const lodash_1 = require("lodash");
const path_1 = require("path");
const Typechain_1 = __importDefault(require("./Typechain"));
const state = { alreadyCompiled: false };
const execFile = util_1.promisify(child_process_1.execFile);
function compile(compilerOptions, projectFile = new ProjectFile_1.default(), force = false) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        if (!force && state.alreadyCompiled)
            return;
        // Merge config file compiler options with those set explicitly
        const resolvedOptions = {
            optimizer: {
                enabled: false,
                runs: 200,
            },
            inputDir: upgrades_1.Contracts.getLocalContractsDir(),
            outputDir: upgrades_1.Contracts.getLocalBuildDir(),
        };
        lodash_1.merge(resolvedOptions, projectFile.compilerOptions, compilerOptions);
        // Validate compiler manager setting
        const { manager } = resolvedOptions;
        if (manager && manager !== 'truffle' && manager !== 'zos' && manager !== 'openzeppelin') {
            throw new Error(`Unknown compiler manager '${manager}' (valid values are 'openzeppelin' or 'truffle')`);
        }
        // We use truffle if set explicitly, or if nothing was set but there is a truffle.js file
        const useTruffle = manager === 'truffle' || (!manager && TruffleConfig_1.default.isTruffleProject());
        // Compile! We use the exports syntax so we can stub them out during tests (nasty, but works!)
        const withTruffle = exports.compileWithTruffle;
        const withSolc = exports.compileWithSolc;
        const compilePromise = useTruffle ? withTruffle() : withSolc(resolvedOptions);
        const compileResult = yield compilePromise;
        const compileVersion = compileResult && compileResult.compilerVersion && compileResult.compilerVersion.version;
        const compileVersionOptions = compileVersion ? { version: compileVersion } : null;
        // Run typechain if requested
        if ((_a = resolvedOptions.typechain) === null || _a === void 0 ? void 0 : _a.enabled) {
            upgrades_1.Loggy.spin(__filename, 'compile', 'compile-typechain', 'Generating typechain artifacts...');
            let filesGlob;
            if (!((_b = compileResult) === null || _b === void 0 ? void 0 : _b.artifacts)) {
                filesGlob = '*.json';
            }
            else if (compileResult.artifacts.length === 1) {
                filesGlob = `${compileResult.artifacts[0].contractName}.json`;
            }
            else {
                const filesList = compileResult.artifacts.map(c => c.contractName).join(',');
                filesGlob = `{${filesList}}.json`;
            }
            const filesPath = path_1.join(resolvedOptions.outputDir, filesGlob);
            console.log(`PATH ${filesPath}`);
            yield Typechain_1.default(filesPath, resolvedOptions.typechain.outDir, resolvedOptions.typechain.target);
            upgrades_1.Loggy.succeed('compile-typechain', `Typechain artifacts generated with ${resolvedOptions.typechain.target}`);
        }
        // If compiled successfully, write back compiler settings to project.json to persist them
        projectFile.setCompilerOptions(Object.assign(Object.assign(Object.assign({}, resolvedOptions), compileVersionOptions), { manager: useTruffle ? 'truffle' : 'openzeppelin' }));
        if (projectFile.exists())
            projectFile.write();
        // Avoid multiple compilations per CLI run
        state.alreadyCompiled = true;
    });
}
exports.compile = compile;
function compileWithSolc(compilerOptions) {
    return __awaiter(this, void 0, void 0, function* () {
        return SolidityProjectCompiler_1.compileProject(compilerOptions);
    });
}
exports.compileWithSolc = compileWithSolc;
function compileWithTruffle() {
    return __awaiter(this, void 0, void 0, function* () {
        upgrades_1.Loggy.spin(__filename, 'compileWithTruffle', `compile-contracts`, 'Compiling contracts with Truffle, using settings from truffle.js file');
        // Attempt to load global truffle if local was not found
        const truffleBin = (yield find_up_1.default('node_modules/.bin/truffle')) || 'truffle';
        let stdout, stderr;
        try {
            const args = { shell: true };
            ({ stdout, stderr } = yield execFile(truffleBin, ['compile', '--all'], args));
        }
        catch (error) {
            if (error.code === 127) {
                upgrades_1.Loggy.fail('compile-contracts', 'Could not find truffle executable. Please install it by running: npm install truffle');
                ({ stdout, stderr } = error);
                throw error;
            }
        }
        finally {
            upgrades_1.Loggy.succeed(`compile-contracts`);
            if (stdout)
                console.log(`Truffle output:\n ${stdout}`);
            if (stderr)
                console.log(`Truffle output:\n ${stderr}`);
        }
        return;
    });
}
exports.compileWithTruffle = compileWithTruffle;
// Used for tests
function resetState() {
    state.alreadyCompiled = false;
}
exports.resetState = resetState;
//# sourceMappingURL=Compiler.js.map