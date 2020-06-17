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
const utils_1 = require("../utils");
const defaults_1 = require("../../models/network/defaults");
const chalk_1 = __importDefault(require("chalk"));
function kindChoice(kind, description) {
    return {
        name: `${kind}\t${chalk_1.default.reset.dim(description)}`,
        value: kind,
        short: kind,
    };
}
const kinds = [
    kindChoice('regular', 'standard non-upgradeable contract'),
    kindChoice('upgradeable', 'upgradeable instance using a delegating proxy (EIP1967)'),
    kindChoice('minimal', 'non-upgradeable minimal proxy instance (EIP1167)'),
];
exports.name = 'deploy';
exports.description = 'deploy a contract instance';
exports.args = [
    {
        name: 'contract',
        details() {
            return __awaiter(this, void 0, void 0, function* () {
                const choices = yield Promise.resolve().then(() => __importStar(require('../../prompts/choices')));
                const contracts = choices.contracts('all');
                return {
                    prompt: 'Pick a contract to deploy',
                    choices: contracts,
                };
            });
        },
    },
    {
        name: 'arguments',
        variadic: true,
        details(params) {
            return __awaiter(this, void 0, void 0, function* () {
                // If the user requests an upgradeable deploy, we will internally call
                // the create command and let it handle its own argument parsing.
                if (params.kind && params.kind !== 'regular') {
                    return [];
                }
                const { fromContractFullName } = yield Promise.resolve().then(() => __importStar(require('../../utils/naming')));
                const { default: ContractManager } = yield Promise.resolve().then(() => __importStar(require('../../models/local/ContractManager')));
                const { argLabelWithIndex } = yield Promise.resolve().then(() => __importStar(require('../../prompts/prompt')));
                const { parseArg, getSampleInput } = yield Promise.resolve().then(() => __importStar(require('../../utils/input')));
                const { getConstructorInputs } = yield Promise.resolve().then(() => __importStar(require('@openzeppelin/upgrades')));
                const contractName = params.contract;
                const { package: packageName, contract: contractAlias } = fromContractFullName(contractName);
                const contract = new ContractManager().getContractClass(packageName, contractAlias);
                const constructorInputs = getConstructorInputs(contract);
                return constructorInputs.map((arg, index) => ({
                    prompt: `${argLabelWithIndex(arg, index)}:`,
                    validationError: (value) => {
                        try {
                            parseArg(value, arg);
                        }
                        catch (err) {
                            const placeholder = getSampleInput(arg);
                            if (placeholder) {
                                return `Enter a valid ${arg.type} such as: ${placeholder}`;
                            }
                            else {
                                return `Enter a valid ${arg.type}`;
                            }
                        }
                    },
                }));
            });
        },
    },
];
exports.options = [
    {
        format: '--skip-compile',
        description: 'use existing compilation artifacts',
        default: false,
    },
    {
        format: '-k, --kind <kind>',
        description: `the kind of deployment (${kinds.map(k => k.value).join(', ')})`,
        details() {
            return __awaiter(this, void 0, void 0, function* () {
                return {
                    prompt: 'Choose the kind of deployment',
                    choices: kinds,
                };
            });
        },
    },
    {
        format: '-n, --network <network>',
        description: 'network to use',
        details() {
            return __awaiter(this, void 0, void 0, function* () {
                const { default: ConfigManager } = yield Promise.resolve().then(() => __importStar(require('../../models/config/ConfigManager')));
                const { default: Session } = yield Promise.resolve().then(() => __importStar(require('../../models/network/Session')));
                const networks = ConfigManager.getNetworkNamesFromConfig();
                const { network: lastNetwork, expired } = Session.getNetwork();
                if (expired || lastNetwork === undefined) {
                    return {
                        prompt: 'Pick a network',
                        choices: networks,
                        preselect: lastNetwork,
                    };
                }
            });
        },
    },
    {
        format: '--timeout <timeout>',
        description: `timeout in seconds for each transaction (default: ${defaults_1.DEFAULT_TX_TIMEOUT})`,
    },
    {
        format: '-f, --from <address>',
        description: 'sender for the contract creation transaction',
        after(options) {
            return __awaiter(this, void 0, void 0, function* () {
                // Once we have all required params (network, timeout, from) we initialize the config.
                // We need to do this because it's necessary for the details of 'arguments' later.
                // We skip it for regular deploys because the create command action will take care of it.
                if (process.env.NODE_ENV !== 'test' && options.kind === 'regular') {
                    const { default: ConfigManager } = yield Promise.resolve().then(() => __importStar(require('../../models/config/ConfigManager')));
                    const config = yield ConfigManager.initNetworkConfiguration(options);
                    Object.assign(options, config);
                }
            });
        },
    },
    {
        format: '--migrate-manifest',
        description: 'enable automatic migration of manifest format',
        details(options) {
            return __awaiter(this, void 0, void 0, function* () {
                const { isMigratableManifestVersion } = yield Promise.resolve().then(() => __importStar(require('../../models/files/ManifestVersion')));
                const { default: NetworkFile } = yield Promise.resolve().then(() => __importStar(require('../../models/files/NetworkFile')));
                const version = NetworkFile.getManifestVersion(options.network);
                if (isMigratableManifestVersion(version)) {
                    return {
                        prompt: 'An old manifest version was detected and needs to be migrated to the latest one. Proceed?',
                        promptType: 'confirm',
                        validationError: (migrate) => migrate ? undefined : 'Cannot proceed without migrating the manifest file.',
                    };
                }
            });
        },
    },
    utils_1.commonOptions.noInteractive,
];
//# sourceMappingURL=spec.js.map