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
const upgrades_1 = require("@openzeppelin/upgrades");
const session_1 = __importDefault(require("../scripts/session"));
const prompt_1 = require("../prompts/prompt");
const ConfigManager_1 = __importDefault(require("../models/config/ConfigManager"));
const telemetry_1 = __importDefault(require("../telemetry"));
const defaults_1 = require("../models/network/defaults");
const name = 'session';
const signature = name;
const description = 'by providing network options, commands like create, freeze, push, and update will use them unless overridden. Use --close to undo.';
const register = program => program
    .command(signature, undefined, { noHelp: true })
    .usage('[options]')
    .description(description)
    .option('--expires <expires>', 'expiration of the session in seconds (defaults to 900, 15 minutes)')
    .option('--close', 'closes the current session, removing all network options set')
    .withNetworkOptions()
    .withNonInteractiveOption()
    .action(action);
function action(options) {
    return __awaiter(this, void 0, void 0, function* () {
        const { network: networkInOpts, expires, timeout, blockTimeout, from, close, interactive } = options;
        if (close) {
            yield telemetry_1.default.report('session', { close }, options.interactive);
            session_1.default({ close });
        }
        else {
            const promptedNetwork = yield prompt_1.promptIfNeeded({ opts: { network: networkInOpts }, props: getCommandProps() }, interactive);
            const { network } = yield ConfigManager_1.default.initNetworkConfiguration(promptedNetwork, true);
            const accounts = yield upgrades_1.ZWeb3.eth.getAccounts();
            const promptedSession = yield prompt_1.promptIfNeeded({ opts: { timeout, blockTimeout, from, expires }, props: getCommandProps(accounts) }, interactive);
            yield telemetry_1.default.report('session', Object.assign(Object.assign(Object.assign({ close }, promptedNetwork), promptedSession), { network }), options.interactive);
            session_1.default(Object.assign(Object.assign({ close }, promptedNetwork), promptedSession));
        }
        if (!options.dontExitProcess && process.env.NODE_ENV !== 'test')
            process.exit(0);
    });
}
function getCommandProps(accounts = []) {
    return Object.assign(Object.assign({}, prompt_1.networksList('network', 'list')), { from: {
            type: 'list',
            message: 'Choose the account to send transactions from',
            choices: accounts.map((account, index) => ({
                name: `(${index}) ${account}`,
                value: account,
            })),
        }, timeout: {
            type: 'input',
            message: 'Enter a timeout in seconds to use for http-based web3 transactions',
            default: defaults_1.DEFAULT_TX_TIMEOUT,
        }, blockTimeout: {
            type: 'input',
            message: 'Enter a timeout in blocks to use for websocket-based web3 transactions',
            default: defaults_1.DEFAULT_TX_BLOCK_TIMEOUT,
        }, expires: {
            type: 'input',
            message: 'Enter an expiration time for this session (in seconds)',
            default: 3600,
        } });
}
exports.default = { name, signature, description, register, action };
//# sourceMappingURL=session.js.map