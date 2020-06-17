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
const contract_1 = require("../utils/contract");
const set_admin_1 = __importDefault(require("../scripts/set-admin"));
const prompt_1 = require("../prompts/prompt");
const migrations_1 = require("../prompts/migrations");
const ConfigManager_1 = __importDefault(require("../models/config/ConfigManager"));
const interfaces_1 = require("../scripts/interfaces");
const telemetry_1 = __importDefault(require("../telemetry"));
const name = 'set-admin';
const signature = `${name} [alias-or-address] [new-admin-address]`;
const description = `change upgradeability admin of a contract instance, all instances or proxy admin. Provide the [alias] or [package]/[alias] of the contract to change the ownership of all its instances, or its [address] to change a single one, or none to change all contract instances to a new admin. Note that if you transfer to an incorrect address, you may irreversibly lose control over upgrading your contract.`;
const register = program => program
    .command(signature, undefined, { noHelp: true })
    .usage('[alias-or-address] [new-admin-address] --network <network> [options]')
    .description(description)
    .option('--force', 'bypass a manual check')
    .withNetworkOptions()
    .withNonInteractiveOption()
    .action(action);
function action(proxyReference, newAdmin, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const { force, interactive } = options;
        if (!interactive && !force)
            throw new Error('Either enable an interactivity mode or set a force flag.');
        const networkOpts = yield prompt_1.promptForNetwork(options, () => getCommandProps());
        const { network, txParams } = yield ConfigManager_1.default.initNetworkConfiguration(Object.assign(Object.assign({}, options), networkOpts));
        if (!(yield migrations_1.hasToMigrateProject(network)))
            process.exit(0);
        const { proxyReference: pickedProxyReference, newAdmin: pickedNewAdmin } = yield promptForProxies(proxyReference, newAdmin, network, options);
        const parsedContractReference = contract_1.parseContractReference(pickedProxyReference);
        if (!pickedNewAdmin)
            throw Error('You have to specify at least a new admin address.');
        // has to be a standalone question from interactivity
        // because it is security related and can't be disabled with interactivity set to false
        if (!force) {
            const { address } = yield prompt_1.promptIfNeeded({
                args: { address: '' },
                props: {
                    address: {
                        type: 'string',
                        message: 'Warning! If you provide a wrong address, you will lose control over your contracts. Please double check your address and type the last 4 characters of the new admin address.',
                    },
                },
            }, interactive);
            if (address.toLowerCase() !== pickedNewAdmin.slice(-4).toLowerCase()) {
                throw new Error('Last 4 characters of the admin address do not match');
            }
        }
        // has to check if a new admin address has balance or wallet
        // if not display yet another warning
        const balance = yield upgrades_1.ZWeb3.eth.getBalance(pickedNewAdmin);
        const code = yield upgrades_1.ZWeb3.eth.getCode(pickedNewAdmin);
        if (!force && balance === (0x0).toString() && code === '0x') {
            const { certain } = yield prompt_1.promptIfNeeded({
                args: { certain: undefined },
                props: {
                    certain: {
                        type: 'confirm',
                        message: 'The new admin address has no funds nor wallet. Are you sure you want to continue?',
                    },
                },
            }, interactive);
            if (!certain) {
                throw Error('Aborted by user');
            }
        }
        const args = lodash_1.pickBy(Object.assign(Object.assign({}, parsedContractReference), { newAdmin: pickedNewAdmin }));
        yield telemetry_1.default.report('set-admin', Object.assign(Object.assign({}, args), { network, txParams }), options.interactive);
        yield set_admin_1.default(Object.assign(Object.assign({}, args), { network, txParams }));
        if (!options.dontExitProcess && process.env.NODE_ENV !== 'test')
            process.exit(0);
    });
}
function promptForProxies(proxyReference, newAdmin, network, options) {
    return __awaiter(this, void 0, void 0, function* () {
        // we assume if newAdmin is empty it was specified as first argument
        if (!newAdmin) {
            newAdmin = proxyReference;
            proxyReference = '';
        }
        const { interactive } = options;
        const pickProxyBy = newAdmin ? 'all' : undefined;
        const args = { pickProxyBy, proxy: proxyReference, newAdmin };
        const props = getCommandProps({ network, all: !!newAdmin });
        const { pickProxyBy: pickedProxyBy, proxy: pickedProxy, newAdmin: pickedNewAdmin } = yield prompt_1.promptIfNeeded({ args, props }, interactive);
        return Object.assign({ newAdmin: pickedNewAdmin, all: pickedProxyBy === 'all' }, pickedProxy);
    });
}
function getCommandProps({ network, all } = {}) {
    return Object.assign(Object.assign({}, prompt_1.networksList('network', 'list')), { pickProxyBy: {
            message: 'For which instances would you like to transfer ownership?',
            type: 'list',
            choices: [
                {
                    name: 'All instances',
                    value: 'all',
                },
                {
                    name: 'Choose by name',
                    value: 'byName',
                },
                {
                    name: 'Choose by address',
                    value: 'byAddress',
                },
            ],
        }, proxy: {
            message: 'Choose an instance',
            type: 'list',
            choices: ({ pickProxyBy }) => prompt_1.proxiesList(pickProxyBy, network, { kind: interfaces_1.ProxyType.Upgradeable }),
            when: ({ pickProxyBy }) => !all && pickProxyBy && pickProxyBy !== 'all',
            normalize: input => (typeof input !== 'object' ? prompt_1.proxyInfo(contract_1.parseContractReference(input), network) : input),
        }, newAdmin: {
            type: 'input',
            message: 'Enter an address of a new upgradeability admin',
        } });
}
exports.default = { name, signature, description, register, action };
//# sourceMappingURL=set-admin.js.map