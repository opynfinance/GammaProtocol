"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const inquirer_1 = require("inquirer");
const lodash_1 = require("lodash");
const ProjectFile_1 = __importDefault(require("../models/files/ProjectFile"));
const ContractManager_1 = __importDefault(require("../models/local/ContractManager"));
const Dependency_1 = __importDefault(require("../models/dependency/Dependency"));
// Generate a list of contracts names
function contracts(source = 'built') {
    const localProjectFile = new ProjectFile_1.default();
    const contractManager = new ContractManager_1.default(localProjectFile);
    const contractsFromBuild = contractManager.getContractNames();
    const contractsFromLocal = Object.keys(localProjectFile.contracts)
        .map(alias => ({ name: localProjectFile.contracts[alias], alias }))
        .map(({ name: contractName, alias }) => {
        const label = contractName === alias ? alias : `${alias}[${contractName}]`;
        return { name: label, value: alias };
    });
    // get contracts from build/contracts
    if (source === 'built') {
        return contractsFromBuild;
    }
    // get contracts from project.json file
    if (source === 'added') {
        return contractsFromLocal;
    }
    // get contracts from build/contracts that are not in project.json file
    if (source === 'notAdded') {
        return lodash_1.difference(contractsFromBuild, contractsFromLocal.map(c => c.value));
    }
    // generate a list of built contracts and package contracts
    if (source === 'all') {
        const packageContracts = Object.keys(localProjectFile.dependencies).map(dependencyName => {
            const contractNames = new Dependency_1.default(dependencyName).projectFile.contractAliases.map(contractName => `${dependencyName}/${contractName}`);
            if (contractNames.length > 0) {
                contractNames.unshift(new inquirer_1.Separator(` = ${dependencyName} =`));
            }
            return contractNames;
        });
        if (contractsFromBuild.length > 0) {
            contractsFromBuild.unshift(new inquirer_1.Separator(` = Your contracts =`));
        }
        return [...contractsFromBuild, ...lodash_1.flatten(packageContracts)];
    }
}
exports.contracts = contracts;
//# sourceMappingURL=choices.js.map