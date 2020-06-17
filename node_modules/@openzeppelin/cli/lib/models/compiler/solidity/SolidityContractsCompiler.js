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
const semver_1 = __importDefault(require("semver"));
const upgrades_1 = require("@openzeppelin/upgrades");
const CompilerProvider_1 = require("./CompilerProvider");
const solidity_1 = require("../../../utils/solidity");
function defaultEVMVersion(version) {
    return semver_1.default.gte(version.split('+')[0], '0.5.5') ? 'petersburg' : 'byzantium';
}
exports.defaultEVMVersion = defaultEVMVersion;
exports.DEFAULT_OPTIMIZER = { enabled: false };
const OUTPUT_SELECTION = {
    '*': {
        '': ['ast'],
        '*': [
            'abi',
            'evm.bytecode.object',
            'evm.bytecode.sourceMap',
            'evm.deployedBytecode.object',
            'evm.deployedBytecode.sourceMap',
        ],
    },
};
function compile(contracts, options = {}) {
    return __awaiter(this, void 0, void 0, function* () {
        const version = yield resolveCompilerVersion(contracts, options);
        const compiler = yield CompilerProvider_1.fetchCompiler(version);
        return new SolidityContractsCompiler(compiler, contracts, options).call();
    });
}
exports.compile = compile;
function resolveCompilerVersion(contracts, options = {}) {
    return __awaiter(this, void 0, void 0, function* () {
        return CompilerProvider_1.resolveCompilerVersion(options.version || contracts.map(c => solidity_1.getPragma(c.source)));
    });
}
exports.resolveCompilerVersion = resolveCompilerVersion;
function compileWith(compilerVersion, contracts, options = {}) {
    return __awaiter(this, void 0, void 0, function* () {
        const compiler = yield CompilerProvider_1.fetchCompiler(compilerVersion);
        return new SolidityContractsCompiler(compiler, contracts, options).call();
    });
}
exports.compileWith = compileWith;
class SolidityContractsCompiler {
    constructor(compiler, contracts, { optimizer, evmVersion } = {}) {
        this.errors = [];
        this.contracts = contracts;
        this.optimizer = optimizer || exports.DEFAULT_OPTIMIZER;
        this.evmVersion = evmVersion || defaultEVMVersion(compiler.version());
        this.compiler = compiler;
        this.settings = {
            optimizer: this.optimizer,
            evmVersion: this.evmVersion,
            outputSelection: OUTPUT_SELECTION,
        };
    }
    call() {
        return __awaiter(this, void 0, void 0, function* () {
            // TODO: Support docker compiler
            const solcOutput = yield this._compile();
            return this._buildContractsSchemas(solcOutput);
        });
    }
    _compile() {
        return __awaiter(this, void 0, void 0, function* () {
            const input = this._buildCompilerInput();
            const output = yield this.compiler.compile(input);
            const outputErrors = output.errors || [];
            if (outputErrors.length === 0)
                return output;
            const errors = outputErrors.filter(finding => finding.severity !== 'warning');
            const warnings = outputErrors.filter(finding => finding.severity === 'warning');
            const errorMessages = errors.map(error => error.formattedMessage).join('\n');
            const warningMessages = warnings.map(warning => warning.formattedMessage).join('\n');
            if (warnings.length > 0)
                upgrades_1.Loggy.noSpin.warn(__filename, '_compile', `compile-warnings`, `Compilation warnings: \n${warningMessages}`);
            if (errors.length > 0)
                throw Error(`Compilation errors: \n${errorMessages}`);
            return output;
        });
    }
    _buildCompilerInput() {
        return {
            language: 'Solidity',
            settings: this.settings,
            sources: this._buildSources(),
        };
    }
    _buildSources() {
        return this.contracts.reduce((sources, contract) => {
            upgrades_1.Loggy.onVerbose(__filename, '_buildSources', `compile-contract-file-${contract.filePath}`, `Compiling ${contract.filePath}`);
            sources[contract.filePath] = { content: contract.source };
            return sources;
        }, {});
    }
    _buildContractsSchemas(solcOutput) {
        const paths = Object.keys(solcOutput.contracts);
        return lodash_1.flatMap(paths, (fileName) => {
            const contractNames = Object.keys(solcOutput.contracts[fileName]);
            return contractNames.map(contractName => this._buildContractSchema(solcOutput, fileName, contractName));
        });
    }
    _buildContractSchema(solcOutput, filePath, contractName) {
        const output = solcOutput.contracts[filePath][contractName];
        const source = solcOutput.sources[filePath];
        const fileName = path_1.default.basename(filePath);
        const contract = this.contracts.find(aContract => aContract.filePath === filePath);
        return {
            fileName,
            contractName,
            source: contract.source,
            sourcePath: contract.filePath,
            sourceMap: output.evm.bytecode.sourceMap,
            deployedSourceMap: output.evm.deployedBytecode.sourceMap,
            abi: output.abi,
            ast: source.ast,
            bytecode: `0x${this._solveLibraryLinks(output.evm.bytecode)}`,
            deployedBytecode: `0x${this._solveLibraryLinks(output.evm.deployedBytecode)}`,
            compiler: {
                name: 'solc',
                version: this.compiler.version(),
                optimizer: this.optimizer,
                evmVersion: this.evmVersion,
            },
        };
    }
    _solveLibraryLinks(outputBytecode) {
        const librariesPaths = Object.keys(outputBytecode.linkReferences);
        if (librariesPaths.length === 0)
            return outputBytecode.object;
        const links = librariesPaths.map(path => outputBytecode.linkReferences[path]);
        return links.reduce((replacedBytecode, link) => {
            return Object.keys(link).reduce((subReplacedBytecode, libraryName) => {
                const linkReferences = link[libraryName] || [];
                return this._replaceLinkReferences(subReplacedBytecode, linkReferences, libraryName);
            }, replacedBytecode);
        }, outputBytecode.object);
    }
    _replaceLinkReferences(bytecode, linkReferences, libraryName) {
        // offset are given in bytes, we multiply it by 2 to work with character offsets
        return linkReferences.reduce((aBytecode, ref) => {
            const start = ref.start * 2;
            const length = ref.length * 2;
            let linkId = `__${libraryName}`;
            linkId += '_'.repeat(length - linkId.length);
            return aBytecode.substring(0, start) + linkId + aBytecode.substring(start + length);
        }, bytecode);
    }
}
//# sourceMappingURL=SolidityContractsCompiler.js.map