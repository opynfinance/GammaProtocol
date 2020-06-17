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
const glob_1 = __importDefault(require("glob"));
const path_1 = __importDefault(require("path"));
const Contract_1 = require("./Contract");
const ZWeb3_1 = __importDefault(require("./ZWeb3"));
const Bytecode_1 = require("../utils/Bytecode");
const errors_1 = require("../errors");
class Contracts {
    static getLocalBuildDir() {
        return path_1.default.resolve(Contracts.buildDir || Contracts.DEFAULT_BUILD_DIR);
    }
    static getLocalContractsDir() {
        return path_1.default.resolve(Contracts.contractsDir || Contracts.DEFAULT_CONTRACTS_DIR);
    }
    static getProjectRoot() {
        return path_1.default.resolve(this.projectRoot || process.cwd());
    }
    static getDefaultTxParams() {
        return __awaiter(this, void 0, void 0, function* () {
            const defaults = Object.assign({}, Contracts.getArtifactsDefaults());
            if (!defaults.from)
                defaults.from = yield Contracts.getDefaultFromAddress();
            return defaults;
        });
    }
    static getArtifactsDefaults() {
        return Contracts.artifactDefaults || {};
    }
    static getLocalPath(contractName) {
        return `${Contracts.getLocalBuildDir()}/${contractName}.json`;
    }
    static getLibPath(contractName) {
        return path_1.default.resolve(__dirname, `../../build/contracts/${contractName}.json`);
    }
    static getNodeModulesPath(dependency, contractName) {
        const root = this.getProjectRoot();
        try {
            return require.resolve(`${dependency}/build/contracts/${contractName}.json`, { paths: [root] });
        }
        catch (e) {
            throw new errors_1.ContractNotFound(contractName, dependency);
        }
    }
    static getFromLocal(contractName) {
        return Contracts._getFromPath(Contracts.getLocalPath(contractName), contractName);
    }
    static getFromLib(contractName) {
        return Contracts._getFromPath(Contracts.getLibPath(contractName), contractName);
    }
    static getFromNodeModules(dependency, contractName) {
        return Contracts._getFromPath(Contracts.getNodeModulesPath(dependency, contractName), contractName);
    }
    static getDefaultFromAddress() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!Contracts.defaultFromAddress) {
                Contracts.defaultFromAddress = yield ZWeb3_1.default.defaultAccount();
            }
            return Contracts.defaultFromAddress;
        });
    }
    static listBuildArtifacts(pathName) {
        const buildDir = pathName || Contracts.getLocalBuildDir();
        return glob_1.default.sync(`${buildDir}/*.json`);
    }
    static setLocalBuildDir(dir) {
        Contracts.buildDir = dir;
    }
    static setLocalContractsDir(dir) {
        Contracts.contractsDir = dir;
    }
    static setProjectRoot(dir) {
        Contracts.projectRoot = dir;
    }
    static setArtifactsDefaults(defaults) {
        Contracts.artifactDefaults = Object.assign(Object.assign({}, Contracts.getArtifactsDefaults()), defaults);
    }
    static _getFromPath(targetPath, contractName) {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        if (!fs_extra_1.default.existsSync(targetPath)) {
            throw new errors_1.ContractNotFound(contractName);
        }
        const schema = fs_extra_1.default.readJsonSync(targetPath);
        schema.directory = path_1.default.dirname(targetPath);
        if (schema.bytecode === '')
            throw new Error(`A bytecode must be provided for contract ${schema.contractName}.`);
        if (!Bytecode_1.hasUnlinkedVariables(schema.bytecode)) {
            schema.linkedBytecode = schema.bytecode;
            schema.linkedDeployedBytecode = schema.deployedBytecode;
        }
        return Contract_1.createContract(schema);
    }
}
exports.default = Contracts;
Contracts.DEFAULT_BUILD_DIR = `build/contracts`;
Contracts.DEFAULT_CONTRACTS_DIR = `contracts`;
Contracts.buildDir = Contracts.DEFAULT_BUILD_DIR;
Contracts.contractsDir = Contracts.DEFAULT_CONTRACTS_DIR;
Contracts.projectRoot = null;
Contracts.artifactDefaults = {};
//# sourceMappingURL=Contracts.js.map