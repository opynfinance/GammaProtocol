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
const lodash_1 = require("lodash");
const inquirer_1 = __importDefault(require("inquirer"));
const upgrades_1 = require("@openzeppelin/upgrades");
const errors_1 = require("@openzeppelin/upgrades/lib/errors");
const Session_1 = __importDefault(require("../models/network/Session"));
const ConfigManager_1 = __importDefault(require("../models/config/ConfigManager"));
const ProjectFile_1 = __importDefault(require("../models/files/ProjectFile"));
const ContractManager_1 = __importDefault(require("../models/local/ContractManager"));
const naming_1 = require("../utils/naming");
const NetworkFile_1 = __importDefault(require("../models/files/NetworkFile"));
const choices = __importStar(require("./choices"));
exports.DISABLE_INTERACTIVITY = !process.stdin.isTTY ||
    !!process.env.OPENZEPPELIN_NON_INTERACTIVE ||
    !!process.env.ZOS_NON_INTERACTIVE ||
    process.env.DEBIAN_FRONTEND === 'noninteractive';
/*
 * This function will parse and wrap both arguments and options into inquirer questions, where
 * the 'arguments' are the parameters sent right after the command name, e.g., * zos create Foo
 * (Foo is the argument) and the options are the parameters sent right after a flag * e.g.,
 * zos push --network local (local is the option). In addition to this, `props` is an object with some
 * inquirer questions attributes (such as question type, message and name) and `defaults` is an object with
 * default values for each args/props attributes.
 * */
function promptIfNeeded({ args = {}, opts = {}, defaults, props }, interactive) {
    return __awaiter(this, void 0, void 0, function* () {
        const argsAndOpts = Object.assign(Object.assign({}, args), opts);
        if (exports.DISABLE_INTERACTIVITY)
            interactive = false;
        const argsAndOptsQuestions = Object.keys(argsAndOpts)
            .filter(name => typeof argsAndOpts[name] !== 'boolean' && lodash_1.isEmpty(argsAndOpts[name]))
            .filter(name => props[name] && !hasEmptyChoices(props[name]))
            .map(name => promptFor(name, defaults, props));
        return yield answersFor(argsAndOpts, argsAndOptsQuestions, props, interactive);
    });
}
exports.promptIfNeeded = promptIfNeeded;
function networksList(name, type, message) {
    message = message || 'Pick a network';
    const networks = ConfigManager_1.default.getNetworkNamesFromConfig();
    if (lodash_1.isEmpty(networks)) {
        throw new Error(`No 'networks' found in your configuration file ${ConfigManager_1.default.getConfigFileName()}`);
    }
    return inquirerQuestion(name, message, type, networks);
}
exports.networksList = networksList;
// Returns a list of all proxies, grouped by package
function proxiesList(pickProxyBy, network, filter, projectFile) {
    projectFile = projectFile || new ProjectFile_1.default();
    const networkFile = new NetworkFile_1.default(projectFile, network);
    const proxies = networkFile.getProxies(filter || {});
    const groupedByPackage = lodash_1.groupBy(proxies, 'package');
    const list = Object.keys(groupedByPackage).map(packageName => {
        const separator = packageName === projectFile.name ? 'Your contracts' : packageName;
        const packageList = groupedByPackage[packageName].map(({ contract, address }) => {
            const name = pickProxyBy === 'byAddress' ? `${contract} at ${address}` : contract;
            const contractFullName = packageName === projectFile.name ? `${contract}` : `${packageName}/${contract}`;
            const proxyReference = pickProxyBy === 'byAddress' ? address : contractFullName;
            return {
                name,
                value: {
                    address,
                    contractFullName,
                    proxyReference,
                },
            };
        });
        return [new inquirer_1.default.Separator(` = ${separator} =`), ...lodash_1.uniqBy(packageList, 'name')];
    });
    return lodash_1.flatten(list);
}
exports.proxiesList = proxiesList;
// Generate a list of contracts names
function contractsList(name, message, type, source) {
    return inquirerQuestion(name, message, type, choices.contracts(source));
}
exports.contractsList = contractsList;
// Generate a list of methods names for a particular contract
function methodsList(contractFullName, constant, projectFile) {
    return contractMethods(contractFullName, constant, projectFile)
        .map(({ name, hasInitializer, inputs, selector }) => {
        const initializable = hasInitializer ? '* ' : '';
        const args = inputs.map(argLabel);
        const label = `${initializable}${name}(${args.join(', ')})`;
        return { name: label, value: { name, selector } };
    })
        .sort((a, b) => {
        if (a.name.startsWith('*') && !b.name.startsWith('*'))
            return -1;
        else if ((a.name.startsWith('*') && b.name.startsWith('*')) ||
            (!a.name.startsWith('*') && !b.name.startsWith('*')))
            return 0;
        else if (!a.name.startsWith('*') && b.name.startsWith('*'))
            return 1;
    });
}
exports.methodsList = methodsList;
function argLabelWithIndex(arg, index) {
    const prefix = arg.name || `#${index}`;
    return `${prefix}: ${upgrades_1.ABI.getArgTypeLabel(arg)}`;
}
exports.argLabelWithIndex = argLabelWithIndex;
function argLabel(arg) {
    return arg.name ? `${arg.name}: ${upgrades_1.ABI.getArgTypeLabel(arg)}` : upgrades_1.ABI.getArgTypeLabel(arg);
}
exports.argLabel = argLabel;
// Returns an inquirer question with a list of arguments for a particular method
function argsList(contractFullName, methodIdentifier, constant, projectFile) {
    const method = contractMethods(contractFullName, constant, projectFile).find(({ name, selector }) => selector === methodIdentifier || name === methodIdentifier);
    if (method) {
        return method.inputs.map((input, index) => {
            return input.name ? input : Object.assign(Object.assign({}, input), { name: `#${index}` });
        });
    }
    return [];
}
exports.argsList = argsList;
function contractMethods(contractFullName, constant = upgrades_1.ContractMethodMutability.NotConstant, projectFile) {
    const { contract: contractAlias, package: packageName } = naming_1.fromContractFullName(contractFullName);
    const contractManager = new ContractManager_1.default(projectFile);
    try {
        const contract = contractManager.getContractClass(packageName, contractAlias);
        return upgrades_1.contractMethodsFromAbi(contract, constant);
    }
    catch (e) {
        if (e instanceof errors_1.ContractNotFound) {
            return [];
        }
        else {
            throw e;
        }
    }
}
function proxyInfo(contractInfo, network) {
    const { contractAlias, proxyAddress, packageName } = contractInfo;
    const projectFile = new ProjectFile_1.default();
    const networkFile = new NetworkFile_1.default(projectFile, network);
    const proxyParams = {
        contract: contractAlias,
        address: proxyAddress,
        package: packageName,
    };
    if (!proxyAddress && !contractAlias) {
        return { proxyReference: undefined, contractFullName: undefined };
    }
    else if (!networkFile.hasProxies(proxyParams)) {
        const contractFullName = naming_1.toContractFullName(packageName, contractAlias);
        return {
            proxyReference: proxyAddress || contractFullName,
            contractFullName,
        };
    }
    else {
        const proxies = networkFile.getProxies(proxyParams);
        const proxy = proxies[0] || {};
        const contractFullName = naming_1.toContractFullName(proxy.package, proxy.contract);
        return {
            contractFullName,
            address: proxy.address,
            proxyReference: proxyAddress || contractFullName,
        };
    }
}
exports.proxyInfo = proxyInfo;
function promptForNetwork(options, getCommandProps) {
    return __awaiter(this, void 0, void 0, function* () {
        const { network: networkInOpts, interactive } = options;
        const { network: networkInSession, expired } = Session_1.default.getNetwork();
        const defaults = { network: networkInSession };
        const opts = {
            network: networkInOpts || (!expired ? networkInSession : undefined),
        };
        const props = getCommandProps();
        return promptIfNeeded({ opts, defaults, props }, interactive);
    });
}
exports.promptForNetwork = promptForNetwork;
function answersFor(inputs, questions, props, interactive) {
    return __awaiter(this, void 0, void 0, function* () {
        const merged = interactive ? Object.assign(Object.assign({}, inputs), (yield inquirer_1.default.prompt(questions))) : inputs;
        Object.keys(merged).forEach(propName => {
            if (props[propName] && props[propName].normalize)
                merged[propName] = props[propName].normalize(merged[propName]);
        });
        return merged;
    });
}
function inquirerQuestion(name, message, type, choices) {
    return { [name]: { type, message, choices } };
}
function promptFor(name, defaults, props) {
    const defaultValue = defaults ? defaults[name] : undefined;
    return Object.assign(Object.assign({ isInquirerQuestion: true, name }, props[name]), { default: defaultValue || props[name].default });
}
function hasEmptyChoices({ choices }) {
    return choices && lodash_1.isEmpty(choices) && typeof choices !== 'function';
}
//# sourceMappingURL=prompt.js.map