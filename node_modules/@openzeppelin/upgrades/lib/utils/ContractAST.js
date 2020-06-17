"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const BuildArtifacts_1 = require("../artifacts/BuildArtifacts");
exports.ContractDefinitionFilter = {
    nodesFilter: ['ContractDefinition'],
};
exports.FunctionDefinitionFilter = {
    nodesFilter: ['ContractDefinition', 'FunctionDefinition'],
};
class NodeNotFoundError extends Error {
    constructor(id, type) {
        super(`No AST nodes of type ${type} with id ${id} found.`);
    }
}
class MultipleNodesFoundError extends Error {
    constructor(id, type) {
        super(`Found more than one node of type ${type} with the same id ${id}. Try clearing your build artifacts and recompiling your contracts.`);
    }
}
class ContractAST {
    constructor(contract, artifacts, props = {}) {
        const { directory } = contract.schema;
        this.artifacts = artifacts || BuildArtifacts_1.getBuildArtifacts(directory);
        this.contract = contract;
        // Transitive closure of source files imported from the contract.
        this.imports = new Set();
        // Map from ast id to nodeset across all visited contracts.
        // (Note that more than one node may have the same id, due to how truffle compiles artifacts).
        this.nodes = {};
        // Types info being collected for the current contract.
        this.types = {};
        // Node types to collect, null for all
        this.nodesFilter = props.nodesFilter;
        this._collectImports(this.contract.schema.ast);
        this._collectNodes(this.contract.schema.ast);
    }
    getContractNode() {
        return this.contract.schema.ast.nodes.find((node) => node.nodeType === 'ContractDefinition' && node.name === this.contract.schema.contractName);
    }
    getImports() {
        return this.imports;
    }
    getMethods(attributes) {
        const baseContracts = this.getLinearizedBaseContracts();
        return lodash_1.flatten(baseContracts.map(contract => contract.nodes))
            .filter(({ nodeType, name }) => nodeType === 'FunctionDefinition' && this._isValidMethodName(name))
            .map(node => {
            // filter attributes
            const selectedAttributes = attributes ? lodash_1.pick(node, attributes) : node;
            // get method parameters
            const { parameters } = node.parameters;
            const inputs = parameters.map(({ name, typeDescriptions }) => ({
                name,
                type: typeDescriptions.typeString,
            }));
            // generate the method selector
            const selectorArgs = inputs ? inputs.map(({ type }) => type).join(',') : '';
            const selector = `${node.name}(${selectorArgs})`;
            return Object.assign({ selector, inputs }, selectedAttributes);
        });
    }
    // This method is used instead of getLinearizedBaseContracts only because
    // it keeps track of the names as well as the IDs of the ancestor contracts,
    // and can yield a better error message to the user than "AST node NN not found"
    getBaseContractsRecursively() {
        const mapBaseContracts = baseContracts => baseContracts.map(c => ({
            id: c.baseName.referencedDeclaration,
            name: c.baseName.name,
        }));
        const baseContractsToVisit = mapBaseContracts(this.getContractNode().baseContracts);
        const visitedBaseContracts = {};
        while (baseContractsToVisit.length > 0) {
            const { id, name } = baseContractsToVisit.pop();
            if (visitedBaseContracts[id])
                continue;
            try {
                const node = this.getNode(id, 'ContractDefinition');
                visitedBaseContracts[id] = node;
                baseContractsToVisit.push(...mapBaseContracts(node.baseContracts));
            }
            catch (err) {
                if (err instanceof NodeNotFoundError) {
                    throw new Error(`Cannot find source data for contract ${name} (base contract of ${this.contract.schema.contractName}). This often happens because either:\n- An incremental compilation step went wrong. Clear your build folder and recompile.\n- There is more than one contract named ${name} in your project (including dependencies). Make sure all contracts have a unique name, and that you are not importing dependencies with duplicated contract names (for example, @openzeppelin/contracts-ethereum-package and @openzeppelin/contracts).`);
                }
                else {
                    throw err;
                }
            }
        }
        return Object.values(visitedBaseContracts);
    }
    getLinearizedBaseContracts(mostDerivedFirst = false) {
        const contracts = this.getContractNode().linearizedBaseContracts.map(id => this.getNode(id, 'ContractDefinition'));
        return mostDerivedFirst ? contracts : lodash_1.reverse(contracts);
    }
    getNode(id, type) {
        if (!this.nodes[id])
            throw new NodeNotFoundError(id, type);
        const candidates = this.nodes[id].filter((node) => node.nodeType === type);
        switch (candidates.length) {
            case 0:
                throw new NodeNotFoundError(id, type);
            case 1:
                return candidates[0];
            default:
                throw new MultipleNodesFoundError(id, type);
        }
    }
    _collectImports(ast) {
        ast.nodes
            .filter(node => node.nodeType === 'ImportDirective')
            .map(node => node.absolutePath)
            .forEach((importPath) => {
            if (this.imports.has(importPath))
                return;
            this.imports.add(importPath);
            this.artifacts.getArtifactsFromSourcePath(importPath).forEach(importedArtifact => {
                this._collectNodes(importedArtifact.ast);
                this._collectImports(importedArtifact.ast);
            });
        });
    }
    _collectNodes(node) {
        // Return if we have already seen this node
        if (lodash_1.some(this.nodes[node.id] || [], n => lodash_1.isEqual(n, node)))
            return;
        // Only process nodes of the filtered types (or SourceUnits)
        if (node.nodeType !== 'SourceUnit' && this.nodesFilter && !lodash_1.includes(this.nodesFilter, node.nodeType))
            return;
        // Add node to collection with this id otherwise
        if (!this.nodes[node.id])
            this.nodes[node.id] = [];
        this.nodes[node.id].push(node);
        // Call recursively to children
        if (node.nodes)
            node.nodes.forEach(this._collectNodes.bind(this));
    }
    _isValidMethodName(name) {
        return name !== '' && name !== 'isConstructor';
    }
}
exports.default = ContractAST;
//# sourceMappingURL=ContractAST.js.map