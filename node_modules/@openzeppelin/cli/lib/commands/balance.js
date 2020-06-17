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
const balance_1 = __importDefault(require("../scripts/balance"));
const prompt_1 = require("../prompts/prompt");
const ConfigManager_1 = __importDefault(require("../models/config/ConfigManager"));
const Session_1 = __importDefault(require("../models/network/Session"));
const telemetry_1 = __importDefault(require("../telemetry"));
const name = 'balance';
const signature = `${name} [address]`;
const description = 'query the balance of the specified account';
const register = program => program
    .command(signature, undefined, { noHelp: true })
    .usage('--network <network> [options]')
    .description(description)
    .option('--erc20 <contractAddress>', 'query the balance of an ERC20 token instead of ETH')
    .withNetworkOptions()
    .withNonInteractiveOption()
    .action(action);
function action(accountAddress, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const { network: networkInOpts, erc20: contractAddress, interactive } = options;
        const { network: networkInSession, expired } = Session_1.default.getNetwork();
        const opts = {
            network: networkInOpts || (!expired ? networkInSession : undefined),
        };
        const args = { accountAddress };
        const props = getCommandProps();
        const defaults = { network: networkInSession };
        const promptedConfig = yield prompt_1.promptIfNeeded({ args, opts, props, defaults }, interactive);
        const { network } = yield ConfigManager_1.default.initNetworkConfiguration(Object.assign(Object.assign({}, options), promptedConfig));
        yield telemetry_1.default.report('balance', Object.assign(Object.assign({}, promptedConfig), { contractAddress, network }), interactive);
        yield balance_1.default({ accountAddress: promptedConfig.accountAddress, contractAddress });
        if (!options.dontExitProcess && process.env.NODE_ENV !== 'test')
            process.exit(0);
    });
}
function getCommandProps() {
    return Object.assign(Object.assign({}, prompt_1.networksList('network', 'list')), { accountAddress: {
            type: 'input',
            message: 'Enter an address to query its balance',
        } });
}
exports.default = { name, signature, description, register, action };
//# sourceMappingURL=balance.js.map