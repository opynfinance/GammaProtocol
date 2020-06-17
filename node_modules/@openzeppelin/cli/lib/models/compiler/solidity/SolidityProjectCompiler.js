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
const path_1 = __importDefault(require("path"));
const lodash_1 = require("lodash");
const glob_1 = __importDefault(require("glob"));
const util_1 = require("util");
const fs_extra_1 = require("fs-extra");
const fs_1 = require("fs");
const upgrades_1 = require("@openzeppelin/upgrades");
const SolidityContractsCompiler_1 = require("./SolidityContractsCompiler");
const SourcesGatherer_1 = require("./SourcesGatherer");
const solidity_1 = require("../../../utils/solidity");
const try_1 = require("../../../utils/try");
function compileProject(options = {}) {
    return __awaiter(this, void 0, void 0, function* () {
        const projectCompiler = new SolidityProjectCompiler(Object.assign(Object.assign({}, options), { inputDir: options.inputDir || upgrades_1.Contracts.getLocalContractsDir(), outputDir: options.outputDir || upgrades_1.Contracts.getLocalBuildDir(), workingDir: options.workingDir || process.cwd() }));
        yield projectCompiler.call();
        return {
            contracts: projectCompiler.contracts,
            compilerVersion: projectCompiler.compilerVersion,
            artifacts: projectCompiler.compilerOutput,
        };
    });
}
exports.compileProject = compileProject;
class SolidityProjectCompiler {
    constructor(options = {}) {
        this.contracts = [];
        this.compilerOutput = [];
        this.options = options;
    }
    get inputDir() {
        return this.options.inputDir;
    }
    get outputDir() {
        return this.options.outputDir;
    }
    get workingDir() {
        return this.options.workingDir;
    }
    call() {
        return __awaiter(this, void 0, void 0, function* () {
            const roots = yield this.loadProjectSoliditySources();
            this.contracts = yield this.loadSolidityDependencies(roots);
            if (this.contracts.length === 0) {
                upgrades_1.Loggy.noSpin(__filename, 'call', 'compile-contracts', 'No contracts found to compile.');
                return;
            }
            this.compilerVersion = yield SolidityContractsCompiler_1.resolveCompilerVersion(this.contracts, this.options);
            if (!this.shouldCompile()) {
                upgrades_1.Loggy.noSpin(__filename, 'call', `compile-contracts`, 'Nothing to compile, all contracts are up to date.');
                return;
            }
            upgrades_1.Loggy.spin(__filename, 'call', 'compile-contracts', `Compiling contracts with solc ${this.compilerVersion.version} (${this.compilerVersion.build})`);
            this.compilerOutput = yield SolidityContractsCompiler_1.compileWith(this.compilerVersion, this.contracts, this.options);
            yield this.writeOutput();
            upgrades_1.Loggy.succeed('compile-contracts', `Compiled contracts with solc ${this.compilerVersion.version} (${this.compilerVersion.build})`);
        });
    }
    loadProjectSoliditySources() {
        return __awaiter(this, void 0, void 0, function* () {
            const dir = this.inputDir;
            if (!fs_1.existsSync(dir) || !fs_1.lstatSync(dir).isDirectory)
                return [];
            return util_1.promisify(glob_1.default)('**/*.sol', { cwd: dir, absolute: true });
        });
    }
    loadSolidityDependencies(roots) {
        return __awaiter(this, void 0, void 0, function* () {
            const importFiles = yield SourcesGatherer_1.gatherSources(roots, this.workingDir);
            return importFiles.map(file => ({
                fileName: path_1.default.basename(file.name),
                filePath: file.name,
                source: file.content,
                lastModified: try_1.tryFunc(() => fs_1.statSync(file.url).mtimeMs),
                dependency: file.dependency,
            }));
        });
    }
    shouldCompile() {
        if (this.options.force)
            return true;
        const artifacts = this.listArtifacts();
        const artifactsWithMtimes = artifacts.map(artifact => ({
            artifact,
            mtime: fs_1.statSync(artifact).mtimeMs,
        }));
        // We pick a single artifact (the most recent one) to get the version it was compiled with
        const latestArtifact = lodash_1.maxBy(artifactsWithMtimes, 'mtime');
        const latestSchema = latestArtifact && fs_extra_1.readJsonSync(latestArtifact.artifact);
        const artifactCompiledVersion = latestSchema && latestSchema.compiler.version;
        const artifactSettings = latestSchema && lodash_1.pick(latestSchema.compiler, 'evmVersion', 'optimizer');
        // Build current settings based on defaults
        const currentSettings = Object.assign({ optimizer: SolidityContractsCompiler_1.DEFAULT_OPTIMIZER, evmVersion: SolidityContractsCompiler_1.defaultEVMVersion(this.compilerVersion.longVersion) }, lodash_1.omitBy(this.options, lodash_1.isUndefined));
        // Gather artifacts vs sources modified times
        const maxArtifactsMtimes = latestArtifact && latestArtifact.mtime;
        const maxSourcesMtimes = lodash_1.max(this.contracts.map(({ lastModified }) => lastModified));
        // Compile if there are no previous artifacts, or no mtimes could be collected for sources,
        // or sources were modified after artifacts, or compiler version changed, or compiler settings changed
        return (!maxArtifactsMtimes ||
            !maxSourcesMtimes ||
            maxArtifactsMtimes <= maxSourcesMtimes ||
            !artifactCompiledVersion ||
            !solidity_1.compilerVersionsMatch(artifactCompiledVersion, this.compilerVersion.longVersion) ||
            !solidity_1.compilerSettingsMatch(currentSettings, artifactSettings));
    }
    writeOutput() {
        return __awaiter(this, void 0, void 0, function* () {
            // Create directory if not exists, or clear it of artifacts if it does,
            // preserving networks deployment info
            const networksInfo = {};
            if (!fs_1.existsSync(this.outputDir)) {
                fs_extra_1.ensureDirSync(this.outputDir);
            }
            else {
                const artifacts = this.listArtifacts();
                yield Promise.all(artifacts.map((filePath) => __awaiter(this, void 0, void 0, function* () {
                    const name = path_1.default.basename(filePath, '.json');
                    const schema = yield fs_extra_1.readJSON(filePath);
                    if (schema.networks)
                        networksInfo[name] = schema.networks;
                    yield fs_extra_1.unlink(filePath);
                })));
            }
            // Check and warn for repeated artifacts
            const artifactsByName = lodash_1.groupBy(this.compilerOutput, (artifact) => artifact.contractName);
            const repeatedArtifacts = Object.keys(lodash_1.pickBy(artifactsByName, (artifacts) => artifacts.length > 1));
            if (repeatedArtifacts.length > 0) {
                for (const repeatedArtifact of repeatedArtifacts) {
                    upgrades_1.Loggy.noSpin.warn(__filename, 'writeOutput', `repeated-artifact-${repeatedArtifact}`, `There is more than one contract named ${repeatedArtifact}. The compiled artifact for only one of them will be generated.`);
                }
            }
            // Delete repeated artifacts, sorting them by local first, assuming that artifacts from dependencies are less used
            const sortedArtifactsByLocal = lodash_1.sortBy(this.compilerOutput, (artifact) => { var _a, _b; return _b = (_a = this.contracts.find(c => c.filePath === artifact.sourcePath)) === null || _a === void 0 ? void 0 : _a.dependency, (_b !== null && _b !== void 0 ? _b : ''); });
            const uniqueArtifacts = lodash_1.uniqBy(sortedArtifactsByLocal, (artifact) => artifact.contractName);
            // Write compiler output, saving networks info if present
            yield Promise.all(uniqueArtifacts.map((data) => __awaiter(this, void 0, void 0, function* () {
                const name = data.contractName;
                const buildFileName = `${this.outputDir}/${name}.json`;
                if (networksInfo[name])
                    Object.assign(data, { networks: networksInfo[name] });
                yield fs_extra_1.writeJson(buildFileName, data, { spaces: 2 });
                return { filePath: buildFileName, contractName: name };
            })));
        });
    }
    listArtifacts() {
        if (!fs_1.existsSync(this.outputDir))
            return [];
        return fs_1.readdirSync(this.outputDir)
            .map(fileName => path_1.default.resolve(this.outputDir, fileName))
            .filter(fileName => !fs_1.lstatSync(fileName).isDirectory())
            .filter(fileName => path_1.default.extname(fileName) === '.json');
    }
}
//# sourceMappingURL=SolidityProjectCompiler.js.map