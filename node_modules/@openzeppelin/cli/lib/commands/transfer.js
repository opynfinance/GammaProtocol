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
const transfer_1 = __importDefault(require("../scripts/transfer"));
const prompt_1 = require("../prompts/prompt");
const units_1 = require("../utils/units");
const ConfigManager_1 = __importDefault(require("../models/config/ConfigManager"));
const telemetry_1 = __importDefault(require("../telemetry"));
const name = 'transfer';
const signature = name;
const description = 'send funds to a given address';
const register = program => program
    .command(signature, undefined, { noHelp: true })
    .usage('--network <network> [options]')
    .description(description)
    .option('--to <to>', 'specify recipient address')
    .option('--value <value>', 'the amount of ether units to be transferred')
    .option('--unit <unit>', "unit name. Wei, kwei, gwei, milli and ether are supported among others. If none is given, 'ether' will be used.")
    .withNetworkOptions()
    .withNonInteractiveOption()
    .action(action);
function action(options) {
    return __awaiter(this, void 0, void 0, function* () {
        const { network: networkInOpts, unit, to, value, from, interactive } = options;
        const configOpts = { network: networkInOpts, from };
        const configProps = getCommandProps();
        const promptedConfig = yield prompt_1.promptIfNeeded({ opts: configOpts, props: configProps }, interactive);
        const { network, txParams } = yield ConfigManager_1.default.initNetworkConfiguration(promptedConfig, true);
        const transferOpts = { from, to, value };
        const transferProps = getCommandProps(yield upgrades_1.ZWeb3.eth.getAccounts(), unit);
        const promptedTransfer = yield prompt_1.promptIfNeeded({ opts: transferOpts, props: transferProps }, interactive);
        yield telemetry_1.default.report('transfer', Object.assign(Object.assign({}, promptedTransfer), { unit, network, txParams }), interactive);
        yield transfer_1.default(Object.assign(Object.assign({}, promptedTransfer), { unit, txParams }));
        if (!options.dontExitProcess && process.env.NODE_ENV !== 'test')
            process.exit(0);
    });
}
function getCommandProps(accounts = [], unit = 'ether') {
    return Object.assign(Object.assign({}, prompt_1.networksList('network', 'list')), { from: {
            type: 'list',
            message: 'Choose the account to send transactions from',
            choices: accounts.map((account, index) => ({
                name: `(${index}) ${account}`,
                value: account,
            })),
        }, to: {
            type: 'input',
            message: 'Enter the receiver account',
        }, value: {
            type: 'input',
            message: 'Enter an amount to transfer',
            transformer: value => {
                if (value.length === 0 || !units_1.isValidUnit(unit))
                    return value;
                return `${value} ${unit.toLowerCase()}`;
            },
        } });
}
exports.default = { name, signature, description, register, action };
//# sourceMappingURL=transfer.js.map