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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../utils");
exports.name = 'verify';
exports.description = "verify a contract's source with Etherscan or Etherchain";
const endpoints = ['etherscan', 'etherchain'];
exports.args = [
    {
        name: 'contract',
        details() {
            return __awaiter(this, void 0, void 0, function* () {
                const choices = yield Promise.resolve().then(() => __importStar(require('../../prompts/choices')));
                const contracts = choices.contracts('all');
                return {
                    prompt: 'Pick a contract to verify',
                    choices: contracts,
                };
            });
        },
    },
];
exports.options = [
    {
        format: '-n, --network <network>',
        description: 'network to verify contracts in',
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
        after(params) {
            return __awaiter(this, void 0, void 0, function* () {
                if (process.env.NODE_ENV !== 'test') {
                    const { default: ConfigManager } = yield Promise.resolve().then(() => __importStar(require('../../models/config/ConfigManager')));
                    const { network } = yield ConfigManager.initNetworkConfiguration(params);
                    const userNetworkName = params.network;
                    Object.assign(params, { network, userNetworkName });
                }
            });
        },
    },
    {
        format: '-o, --optimizer <enabled>',
        description: `whether compilation optimizations were enabled`,
        details() {
            var _a, _b;
            return __awaiter(this, void 0, void 0, function* () {
                const { default: ProjectFile } = yield Promise.resolve().then(() => __importStar(require('../../models/files/ProjectFile')));
                const compilerConfig = new ProjectFile().compilerOptions;
                const optimizerDefault = (_b = (_a = compilerConfig.optimizer) === null || _a === void 0 ? void 0 : _a.enabled, (_b !== null && _b !== void 0 ? _b : false));
                return {
                    prompt: 'Was your contract compiled with optimizations enabled?',
                    promptType: 'confirm',
                    preselect: optimizerDefault,
                };
            });
        },
    },
    {
        format: '--optimizer-runs <runs>',
        description: `the number of runs for the optimizer`,
        details(params) {
            var _a, _b;
            return __awaiter(this, void 0, void 0, function* () {
                if (params.optimizer) {
                    const { default: ProjectFile } = yield Promise.resolve().then(() => __importStar(require('../../models/files/ProjectFile')));
                    const compilerConfig = new ProjectFile().compilerOptions;
                    const optimizerRunsDefault = (_b = (_a = compilerConfig.optimizer) === null || _a === void 0 ? void 0 : _a.runs, (_b !== null && _b !== void 0 ? _b : 200));
                    return {
                        prompt: "Specify the optimizer 'runs' parameter",
                        preselect: optimizerRunsDefault,
                    };
                }
            });
        },
    },
    {
        format: '--remote <remote>',
        description: `the remote endpoint to use for verification (${endpoints.join(', ')})`,
        details() {
            return __awaiter(this, void 0, void 0, function* () {
                return {
                    prompt: 'Choose a remote endpoint',
                    choices: endpoints,
                    preselect: 'etherscan',
                };
            });
        },
    },
    {
        format: '--api-key <key>',
        description: `Etherscan API key (get one at https://etherscan.io/myapikey)`,
        details(params) {
            return __awaiter(this, void 0, void 0, function* () {
                if (params.remote == 'etherscan') {
                    return {
                        prompt: 'Enter your Etherscan API key (get one at https://etherscan.io/myapikey)',
                    };
                }
            });
        },
    },
    utils_1.commonOptions.noInteractive,
];
//# sourceMappingURL=spec.js.map