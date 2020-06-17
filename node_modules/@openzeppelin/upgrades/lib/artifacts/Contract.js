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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const web3_utils_1 = require("web3-utils");
const ZWeb3_1 = __importDefault(require("./ZWeb3"));
const Contracts_1 = __importDefault(require("./Contracts"));
const ContractAST_1 = __importStar(require("../utils/ContractAST"));
const ABIs_1 = require("../utils/ABIs");
var ContractMethodMutability;
(function (ContractMethodMutability) {
    ContractMethodMutability[ContractMethodMutability["Constant"] = 0] = "Constant";
    ContractMethodMutability[ContractMethodMutability["NotConstant"] = 1] = "NotConstant";
})(ContractMethodMutability = exports.ContractMethodMutability || (exports.ContractMethodMutability = {}));
function _wrapContractInstance(schema, web3instance) {
    const instance = web3instance;
    instance.schema = schema;
    instance.new = function (...passedArguments) {
        return __awaiter(this, void 0, void 0, function* () {
            const [args, options] = parseArguments(passedArguments, schema.abi);
            if (!schema.linkedBytecode)
                throw new Error(`${schema.contractName} bytecode contains unlinked libraries.`);
            instance.options = Object.assign(Object.assign({}, instance.options), (yield Contracts_1.default.getDefaultTxParams()));
            return new Promise((resolve, reject) => {
                const tx = instance.deploy({
                    data: schema.linkedBytecode,
                    arguments: args,
                });
                let transactionReceipt, transactionHash;
                tx.send(Object.assign({}, options))
                    .on('error', error => reject(error))
                    .on('receipt', receipt => (transactionReceipt = receipt))
                    .on('transactionHash', hash => (transactionHash = hash))
                    .then(web3DeployedInstance => {
                    // instance != deployedInstance
                    const deployedInstance = _wrapContractInstance(schema, web3DeployedInstance);
                    deployedInstance.deployment = { transactionReceipt, transactionHash };
                    resolve(deployedInstance);
                })
                    .catch(error => reject(error));
            });
        });
    };
    instance.at = function (address) {
        if (!web3_utils_1.isAddress(address))
            throw new Error('Given address is not valid: ' + address);
        const newWeb3Instance = instance.clone();
        newWeb3Instance['_address'] = address;
        newWeb3Instance.options.address = address;
        return _wrapContractInstance(instance.schema, newWeb3Instance);
    };
    instance.link = function (libraries) {
        instance.schema.linkedBytecode = instance.schema.bytecode;
        instance.schema.linkedDeployedBytecode = instance.schema.deployedBytecode;
        Object.keys(libraries).forEach((name) => {
            const address = libraries[name].replace(/^0x/, '');
            const regex = new RegExp(`__${name}_+`, 'g');
            instance.schema.linkedBytecode = instance.schema.linkedBytecode.replace(regex, address);
            instance.schema.linkedDeployedBytecode = instance.schema.linkedDeployedBytecode.replace(regex, address);
        });
    };
    // TODO: Remove after web3 adds the getter: https://github.com/ethereum/web3.js/issues/2274
    if (typeof instance.address === 'undefined') {
        Object.defineProperty(instance, 'address', {
            get: () => instance.options.address,
        });
    }
    return instance;
}
function createContract(schema) {
    const contract = new ZWeb3_1.default.eth.Contract(schema.abi, null, Contracts_1.default.getArtifactsDefaults());
    return _wrapContractInstance(schema, contract);
}
exports.createContract = createContract;
function contractMethodsFromAbi(instance, constant = ContractMethodMutability.NotConstant) {
    const isConstant = constant === ContractMethodMutability.Constant;
    const mutabilities = abiStateMutabilitiesFor(constant);
    const methodsFromAst = getAstMethods(instance);
    return instance.schema.abi
        .filter(({ stateMutability, constant: isConstantMethod, type }) => type === 'function' && (isConstant === isConstantMethod || mutabilities.includes(stateMutability)))
        .map(method => {
        const { name, inputs } = method;
        const selector = `${name}(${inputs.map(ABIs_1.getArgTypeLabel).join(',')})`;
        const infoFromAst = methodsFromAst.find(({ selector: selectorFromAst }) => selectorFromAst === selector);
        const modifiers = infoFromAst ? infoFromAst.modifiers : [];
        const initializer = modifiers.find(({ modifierName }) => modifierName.name === 'initializer');
        return Object.assign({ selector, hasInitializer: initializer ? true : false }, method);
    });
}
exports.contractMethodsFromAbi = contractMethodsFromAbi;
// get methods from AST, as there is no info about the modifiers in the ABI
function contractMethodsFromAst(instance, constant = ContractMethodMutability.NotConstant) {
    const mutabilities = abiStateMutabilitiesFor(constant);
    const visibilities = ['public', 'external'];
    return getAstMethods(instance)
        .filter(({ visibility, stateMutability }) => visibilities.includes(visibility) && mutabilities.includes(stateMutability))
        .map(method => {
        const initializer = method.modifiers.find(({ modifierName }) => modifierName.name === 'initializer');
        return Object.assign(Object.assign({}, method), { hasInitializer: initializer ? true : false });
    });
}
exports.contractMethodsFromAst = contractMethodsFromAst;
function getConstructorInputs(contract) {
    var _a, _b;
    return _b = (_a = contract.schema.abi.find(f => f.type === 'constructor')) === null || _a === void 0 ? void 0 : _a.inputs, (_b !== null && _b !== void 0 ? _b : []);
}
exports.getConstructorInputs = getConstructorInputs;
function getAstMethods(instance) {
    return new ContractAST_1.default(instance, null, ContractAST_1.ContractDefinitionFilter).getMethods();
}
function abiStateMutabilitiesFor(constant) {
    return constant === ContractMethodMutability.Constant ? ['view', 'pure'] : ['payable', 'nonpayable'];
}
function parseArguments(passedArguments, abi) {
    const constructorAbi = abi.find(elem => elem.type === 'constructor') || {};
    const constructorArgs = constructorAbi.inputs && constructorAbi.inputs.length > 0 ? constructorAbi.inputs : [];
    let givenOptions = {};
    if (passedArguments.length === constructorArgs.length + 1) {
        const lastArg = passedArguments[passedArguments.length - 1];
        if (typeof lastArg === 'object') {
            givenOptions = passedArguments.pop();
        }
    }
    return [passedArguments, givenOptions];
}
//# sourceMappingURL=Contract.js.map