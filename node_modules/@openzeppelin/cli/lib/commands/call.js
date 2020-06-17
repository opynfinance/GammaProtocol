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
const lodash_1 = require("lodash");
const upgrades_1 = require("@openzeppelin/upgrades");
const call_1 = __importDefault(require("../scripts/call"));
const contract_1 = require("../utils/contract");
const prompt_1 = require("../prompts/prompt");
const ConfigManager_1 = __importDefault(require("../models/config/ConfigManager"));
const method_params_1 = __importDefault(require("../prompts/method-params"));
const telemetry_1 = __importDefault(require("../telemetry"));
const name = 'call';
const signature = name;
const description = 'call a method of the specified contract instance. Provide the [address], method to call and its arguments if needed';
const register = program => program
    .command(signature, undefined, { noHelp: true })
    .usage('--to <to> --method <method> [options]')
    .description(description)
    .option('--to <to>', 'address of the contract that will receive the call')
    .option('--method <method>', `name of the method to execute in the contract`)
    .option('--args <arg1, arg2, ...>', 'arguments to the method to execute')
    .withNetworkOptions()
    .withNonInteractiveOption()
    .action(action);
function action(options) {
    return __awaiter(this, void 0, void 0, function* () {
        const { interactive, to: proxyAddress } = options;
        const networkOpts = yield prompt_1.promptForNetwork(options, () => getCommandProps());
        const { network, txParams } = yield ConfigManager_1.default.initNetworkConfiguration(Object.assign(Object.assign({}, options), networkOpts));
        const { contractFullName, proxyReference } = yield promptForProxy(proxyAddress, network, options);
        const methodParams = yield method_params_1.default(contractFullName, options, {}, upgrades_1.ContractMethodMutability.Constant);
        const args = lodash_1.pickBy(Object.assign(Object.assign({}, methodParams), { proxyAddress: proxyReference }));
        yield telemetry_1.default.report('call', Object.assign(Object.assign({}, args), { network, txParams }), interactive);
        yield call_1.default(Object.assign(Object.assign({}, args), { network, txParams }));
        if (!options.dontExitProcess && process.env.NODE_ENV !== 'test')
            process.exit(0);
    });
}
function promptForProxy(proxyAddress, network, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const { interactive } = options;
        const opts = { proxy: proxyAddress };
        const props = getCommandProps(network);
        const { proxy: promptedProxy } = yield prompt_1.promptIfNeeded({ opts, props }, interactive);
        return promptedProxy;
    });
}
function getCommandProps(network) {
    return Object.assign(Object.assign({}, prompt_1.networksList('network', 'list')), { proxy: {
            message: 'Pick an instance',
            type: 'list',
            choices: prompt_1.proxiesList('byAddress', network),
            normalize: input => (typeof input !== 'object' ? prompt_1.proxyInfo(contract_1.parseContractReference(input), network) : input),
        } });
}
exports.default = { name, signature, description, register, action };
//# sourceMappingURL=call.js.map