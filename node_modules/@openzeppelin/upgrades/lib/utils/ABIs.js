"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const encodeCall_1 = __importDefault(require("../helpers/encodeCall"));
const ContractAST_1 = __importDefault(require("./ContractAST"));
const Bytecode_1 = require("./Bytecode");
const ZWeb3_1 = __importDefault(require("../artifacts/ZWeb3"));
function buildDeploymentCallData(contract, args) {
    if (contract.schema.linkedBytecode === '')
        throw new Error(`A bytecode must be provided for contract ${contract.schema.contractName}`);
    if (Bytecode_1.hasUnlinkedVariables(contract.schema.linkedBytecode))
        throw new Error(`${contract.schema.contractName} bytecode contains unlinked libraries: ${Bytecode_1.getSolidityLibNames(contract.schema.linkedBytecode).join(', ')}`);
    return new ZWeb3_1.default.eth.Contract(contract.schema.abi)
        .deploy({ data: contract.schema.linkedBytecode, arguments: args })
        .encodeABI();
}
exports.buildDeploymentCallData = buildDeploymentCallData;
function buildCallData(contract, methodName, args) {
    const method = getABIFunction(contract, methodName, args);
    const argTypes = method.inputs.map(input => input.type);
    const callData = encodeCall_1.default(method.name, argTypes, args);
    return { method, callData };
}
exports.buildCallData = buildCallData;
function getABIFunction(contract, methodName, args) {
    const targetMethod = tryGetTargetFunction(contract, methodName, args);
    if (targetMethod)
        methodName = targetMethod.name;
    const matchArgsTypes = fn => targetMethod &&
        fn.inputs.every((input, index) => targetMethod.inputs[index] && targetMethod.inputs[index].type === input.type);
    const matchNameAndArgsLength = fn => fn.name === methodName && fn.inputs.length === args.length;
    let abiMethods = contract.schema.abi.filter(fn => matchNameAndArgsLength(fn) && matchArgsTypes(fn));
    if (abiMethods.length === 0)
        abiMethods = contract.schema.abi.filter(fn => matchNameAndArgsLength(fn));
    switch (abiMethods.length) {
        case 0:
            throw Error(`Could not find method ${methodName} with ${args.length} arguments in contract ${contract.schema.contractName}`);
        case 1:
            return abiMethods[0];
        default:
            throw Error(`Found more than one match for function ${methodName} with ${args.length} arguments in contract ${contract.schema.contractName}`);
    }
}
exports.getABIFunction = getABIFunction;
function getArgTypeLabel(arg) {
    if (arg.type === 'tuple') {
        return `(${arg.components.map(getArgTypeLabel).join(',')})`;
    }
    else {
        return arg.type;
    }
}
exports.getArgTypeLabel = getArgTypeLabel;
function tryGetTargetFunction(contract, methodName, args) {
    // Match foo(uint256,string) as method name, and look for that in the ABI
    const match = methodName.match(/^\s*(.+?)\((.*)\)\s*$/);
    if (match) {
        const name = match[1];
        const inputs = match[2].split(',').map(arg => ({ type: arg }));
        return { name, inputs };
    }
    // Otherwise, look for the most derived contract
    const methodNode = tryGetFunctionNodeFromMostDerivedContract(contract, methodName, args);
    if (methodNode) {
        const inputs = methodNode.parameters.parameters.map((parameter) => {
            const typeString = parameter.typeDescriptions.typeString;
            const type = typeString.includes('contract') ? 'address' : typeString;
            return { name: parameter.name, type };
        });
        return { name: methodNode.name, inputs };
    }
    // Otherwise, try to get the function by name and method arguments
    const method = contract.schema.abi.find(({ name, inputs }) => name === methodName && inputs.length === args.length);
    if (method)
        return { name: method.name, inputs: method.inputs };
}
function tryGetFunctionNodeFromMostDerivedContract(contract, methodName, args) {
    const linearizedBaseContracts = tryGetLinearizedBaseContracts(contract);
    if (!linearizedBaseContracts)
        return null;
    const nodeMatches = (node) => node.nodeType === 'FunctionDefinition' &&
        node.name === methodName &&
        node.parameters.parameters.length === args.length;
    for (const aContract of linearizedBaseContracts) {
        const funs = aContract.nodes.filter(nodeMatches);
        switch (funs.length) {
            case 0:
                continue;
            case 1:
                return funs[0];
            default:
                throw Error(`Found more than one match for function ${methodName} with ${args.length} arguments in contract ${contract.schema.contractName}`);
        }
    }
}
function tryGetLinearizedBaseContracts(contract) {
    try {
        const ast = new ContractAST_1.default(contract, null, {
            nodesFilter: ['ContractDefinition', 'FunctionDefinition'],
        });
        return ast.getLinearizedBaseContracts(true);
    }
    catch (err) {
        // This lookup may fail on contracts loaded from libraries, so we just silently fail and fall back to other methods
        return null;
    }
}
function callDescription(method, args) {
    const argsDescriptions = method.inputs.map((input, index) => `- ${input.name} (${input.type}): ${JSON.stringify(args[index])}`);
    return args.length ? `'${method.name}' with:\n${argsDescriptions.join('\n')}` : `'${method.name}' with no arguments`;
}
exports.callDescription = callDescription;
exports.default = {
    buildCallData,
    getABIFunction,
    getArgTypeLabel,
    callDescription,
};
//# sourceMappingURL=ABIs.js.map