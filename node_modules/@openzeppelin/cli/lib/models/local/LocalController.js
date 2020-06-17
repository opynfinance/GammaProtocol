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
const lodash_1 = require("lodash");
const upgrades_1 = require("@openzeppelin/upgrades");
const Session_1 = __importDefault(require("../network/Session"));
const Dependency_1 = __importDefault(require("../dependency/Dependency"));
const NetworkController_1 = __importDefault(require("../network/NetworkController"));
const ValidationLogger_1 = __importDefault(require("../../interface/ValidationLogger"));
const ConfigManager_1 = __importDefault(require("../config/ConfigManager"));
const ProjectFile_1 = __importDefault(require("../files/ProjectFile"));
const ContractManager_1 = __importDefault(require("./ContractManager"));
const DEFAULT_VERSION = '0.1.0';
class LocalController {
    constructor(projectFile = new ProjectFile_1.default(), init = false) {
        if (!init && !projectFile.exists()) {
            throw Error(`OpenZeppelin file ${projectFile.filePath} not found. Run 'openzeppelin init' first to initialize the project.`);
        }
        this.projectFile = projectFile;
    }
    init(name, version, force = false, publish = false) {
        if (!name)
            throw Error('A project name must be provided to initialize the project.');
        this.initProjectFile(name, version, force, publish);
        Session_1.default.ignoreFile();
        ConfigManager_1.default.initialize();
    }
    initProjectFile(name, version, force = false, publish) {
        if (this.projectFile.exists() && !force) {
            throw Error(`Cannot overwrite existing file ${this.projectFile.filePath}`);
        }
        if (this.projectFile.name && !force) {
            throw Error(`Cannot initialize already initialized package ${this.projectFile.name}`);
        }
        this.projectFile.name = name;
        this.projectFile.version = version || DEFAULT_VERSION;
        this.projectFile.contracts = {};
        if (publish)
            this.projectFile.publish = publish;
        upgrades_1.Loggy.noSpin(__filename, 'initProjectFile', 'init-project-file', `Project initialized. Write a new contract in the contracts folder and run 'openzeppelin deploy' to deploy it.`);
    }
    bumpVersion(version) {
        this.projectFile.version = version;
    }
    add(contractAlias, contractName) {
        upgrades_1.Loggy.spin(__filename, 'add', `add-${contractAlias}`, `Adding ${contractAlias === contractName ? contractAlias : `${contractAlias}:${contractName}`}`);
        this.projectFile.addContract(contractAlias, contractName);
        upgrades_1.Loggy.succeed(`add-${contractAlias}`, `Added contract ${contractAlias}`);
    }
    addAll() {
        const manager = new ContractManager_1.default(this.projectFile);
        manager.getContractNames().forEach(name => this.add(name, name));
    }
    remove(contractAlias) {
        if (!this.projectFile.hasContract(contractAlias)) {
            upgrades_1.Loggy.noSpin.error(__filename, 'remove', `remove-${contractAlias}`, `Contract ${contractAlias} to be removed was not found`);
        }
        else {
            upgrades_1.Loggy.spin(__filename, 'remove', `remove-${contractAlias}`, `Removing ${contractAlias}`);
            this.projectFile.unsetContract(contractAlias);
            upgrades_1.Loggy.succeed(`remove-${contractAlias}`, `Removed contract ${contractAlias}`);
        }
    }
    checkCanAdd(contractName) {
        const path = upgrades_1.Contracts.getLocalPath(contractName);
        if (!fs_extra_1.default.existsSync(path)) {
            throw Error(`Contract ${contractName} not found in path ${path}`);
        }
        if (!this.hasBytecode(path)) {
            throw Error(`Contract ${contractName} is abstract and cannot be deployed.`);
        }
    }
    // Contract model
    validateAll() {
        const buildArtifacts = upgrades_1.getBuildArtifacts();
        return lodash_1.every(lodash_1.map(this.projectFile.contractAliases, contractAlias => this.validate(contractAlias, buildArtifacts)));
    }
    // Contract model
    validate(contractAlias, buildArtifacts) {
        const contractName = this.projectFile.contract(contractAlias);
        const contract = upgrades_1.Contracts.getFromLocal(contractName || contractAlias);
        const warnings = upgrades_1.validate(contract, {}, buildArtifacts);
        new ValidationLogger_1.default(contract).log(warnings, buildArtifacts);
        return upgrades_1.validationPasses(warnings);
    }
    // Contract model
    hasBytecode(contractDataPath) {
        if (!fs_extra_1.default.existsSync(contractDataPath))
            return false;
        const bytecode = fs_extra_1.default.readJsonSync(contractDataPath).bytecode;
        return bytecode && bytecode !== '0x';
    }
    // Contract model
    getContractSourcePath(contractAlias) {
        const contractName = this.projectFile.contract(contractAlias);
        if (contractName) {
            const contractDataPath = upgrades_1.Contracts.getLocalPath(contractName);
            const { compiler, sourcePath } = fs_extra_1.default.readJsonSync(contractDataPath);
            return { sourcePath, compilerVersion: compiler.version };
        }
        else {
            throw Error(`Could not find ${contractAlias} in contracts directory.`);
        }
    }
    writePackage() {
        this.projectFile.write();
    }
    // DependencyController
    linkDependencies(dependencies, installDependencies = false) {
        return __awaiter(this, void 0, void 0, function* () {
            const linkedDependencies = yield Promise.all(dependencies.map((depNameVersion) => __awaiter(this, void 0, void 0, function* () {
                const dependency = installDependencies
                    ? yield Dependency_1.default.install(depNameVersion)
                    : Dependency_1.default.fromNameWithVersion(depNameVersion);
                this.projectFile.setDependency(dependency.name, dependency.requirement);
                return dependency.name;
            })));
            if (linkedDependencies.length > 0) {
                const label = linkedDependencies.length === 1 ? 'Dependency' : 'Dependencies';
                upgrades_1.Loggy.noSpin(__filename, 'linkDependencies', 'link-dependencies', `${label} linked to the project. Run 'openzeppelin deploy' to deploy one of its contracts.`);
            }
        });
    }
    // DependencyController
    unlinkDependencies(dependenciesNames) {
        const unlinkedDependencies = dependenciesNames.map(dep => {
            const dependency = Dependency_1.default.fromNameWithVersion(dep);
            this.projectFile.unsetDependency(dependency.name);
            return dependency.name;
        });
        if (unlinkedDependencies.length > 0) {
            const label = unlinkedDependencies.length === 1 ? 'Dependency' : 'Dependencies';
            upgrades_1.Loggy.noSpin(__filename, 'linkDependencies', 'link-dependencies', `${label} ${unlinkedDependencies.join(', ')} unlinked.`);
        }
    }
    onNetwork(network, txParams, networkFile) {
        return new NetworkController_1.default(network, txParams, networkFile);
    }
}
exports.default = LocalController;
//# sourceMappingURL=LocalController.js.map