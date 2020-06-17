"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = __importDefault(require("fs-extra"));
const upgrades_1 = require("@openzeppelin/upgrades");
const Dependency_1 = __importDefault(require("../dependency/Dependency"));
const ProjectFile_1 = __importDefault(require("../files/ProjectFile"));
const ConfigManager_1 = __importDefault(require("../config/ConfigManager"));
const path_1 = __importDefault(require("path"));
class ContractManager {
    constructor(projectFile = new ProjectFile_1.default()) {
        this.projectFile = projectFile;
    }
    getContractClass(packageName, contractAlias) {
        if (!packageName || packageName === this.projectFile.name) {
            const contractName = this.projectFile.normalizeContractAlias(contractAlias);
            return upgrades_1.Contracts.getFromLocal(contractName);
        }
        else {
            const dependency = new Dependency_1.default(packageName);
            const contractName = dependency.projectFile.normalizeContractAlias(contractAlias);
            return upgrades_1.Contracts.getFromNodeModules(packageName, contractName);
        }
    }
    hasContract(packageName, contractAlias) {
        if (!packageName || packageName === this.projectFile.name) {
            return !!this.projectFile.contract(contractAlias);
        }
        else {
            const dependency = new Dependency_1.default(packageName);
            return !!dependency.projectFile.contract(contractAlias);
        }
    }
    getContractNames(root = process.cwd()) {
        const buildDir = ConfigManager_1.default.getBuildDir();
        const contractsDir = upgrades_1.Contracts.getLocalContractsDir();
        if (fs_extra_1.default.existsSync(buildDir)) {
            return fs_extra_1.default
                .readdirSync(buildDir, 'utf8')
                .filter(name => name.match(/\.json$/))
                .map(name => (fs_extra_1.default.existsSync(`${buildDir}/${name}`) ? fs_extra_1.default.readJsonSync(`${buildDir}/${name}`) : null))
                .filter(contract => {
                return (this.isLocalContract(contractsDir, contract, root) &&
                    !this.isLibrary(contract) &&
                    !this.isAbstractContract(contract));
            })
                .map(({ contractName }) => contractName);
        }
        else
            return [];
    }
    isLocalContract(contractsDir, contract, root) {
        const cwd = root || process.cwd();
        const contractFullPath = path_1.default.resolve(cwd, contract.sourcePath);
        return contractFullPath.indexOf(contractsDir) === 0;
    }
    isAbstractContract(contract) {
        return contract && contract.bytecode.length <= 2;
    }
    isLibrary(contract) {
        return (contract &&
            contract.ast &&
            !!contract.ast.nodes.find(node => node.contractKind === 'library' && node.name === contract.contractName));
    }
}
exports.default = ContractManager;
//# sourceMappingURL=ContractManager.js.map