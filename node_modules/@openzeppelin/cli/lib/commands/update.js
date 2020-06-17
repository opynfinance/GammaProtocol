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
const NetworkFile_1 = __importDefault(require("../models/files/NetworkFile"));
const push_1 = __importDefault(require("./push"));
const update_1 = __importDefault(require("../scripts/update"));
const contract_1 = require("../utils/contract");
const migrations_1 = require("../prompts/migrations");
const ConfigManager_1 = __importDefault(require("../models/config/ConfigManager"));
const prompt_1 = require("../prompts/prompt");
const method_params_1 = __importDefault(require("../prompts/method-params"));
const telemetry_1 = __importDefault(require("../telemetry"));
const interfaces_1 = require("../scripts/interfaces");
const ProjectFile_1 = __importDefault(require("../models/files/ProjectFile"));
const name = 'upgrade';
const signature = `${name} [alias-or-address]`;
const description = 'upgrade contract to a new logic. Provide the [alias] or [package]/[alias] you added your contract with, its [address], or use --all flag to upgrade all contracts in your project.';
const register = program => program
    .command(signature, undefined, { noHelp: true })
    .alias('update')
    .usage('[alias-or-address] --network <network> [options]')
    .description(description)
    .option('--init [function]', `call function after upgrading contract. If no name is given, 'initialize' will be used`)
    .option('--args <arg1, arg2, ...>', 'provide initialization arguments for your contract if required')
    .option('--all', 'upgrade all contracts in the application')
    .option('--force', 'ignore contracts validation errors')
    .withNetworkOptions()
    .withSkipCompileOption()
    .withNonInteractiveOption()
    .action(commandActions);
function commandActions(proxyReference, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const { network: promptedNetwork } = yield prompt_1.promptForNetwork(options, () => getCommandProps());
        const { network, txParams } = yield ConfigManager_1.default.initNetworkConfiguration(Object.assign(Object.assign({}, options), { network: promptedNetwork }));
        yield action(proxyReference, Object.assign(Object.assign({}, options), { network, txParams, promptedNetwork }));
        if (!options.dontExitProcess && process.env.NODE_ENV !== 'test')
            process.exit(0);
    });
}
function action(proxyReference, options) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const { network, txParams, force, interactive, all, init: rawInitMethod } = options;
        if (!(yield migrations_1.hasToMigrateProject(network)))
            process.exit(0);
        const promptedProxyInfo = yield promptForProxies(proxyReference, network, options);
        const parsedContractReference = contract_1.parseContractReference(promptedProxyInfo.proxyReference);
        const additionalOpts = {
            askForMethodParams: rawInitMethod,
            askForMethodParamsMessage: 'Call a function on the instance after upgrading it?',
        };
        const initMethodParams = promptedProxyInfo.proxyReference && !promptedProxyInfo.all
            ? yield method_params_1.default(promptedProxyInfo.contractFullName, options, additionalOpts)
            : {};
        const args = lodash_1.pickBy(Object.assign(Object.assign({ all: promptedProxyInfo.all, force }, parsedContractReference), initMethodParams));
        const projectFile = new ProjectFile_1.default();
        const networkFile = new NetworkFile_1.default(projectFile, network);
        const proxies = networkFile.getProxies({
            package: (_a = parsedContractReference.packageName, (_a !== null && _a !== void 0 ? _a : (parsedContractReference.contractAlias && projectFile.name))),
            contract: parsedContractReference.contractAlias,
            address: parsedContractReference.proxyAddress,
            kind: interfaces_1.ProxyType.Upgradeable,
        });
        yield push_1.default.runActionIfNeeded(lodash_1.uniq(proxies.map(proxy => proxy.contract)), network, Object.assign(Object.assign({}, options), { network: options.promptedNetwork }));
        yield telemetry_1.default.report('update', Object.assign(Object.assign({}, args), { network, txParams }), interactive);
        yield update_1.default(Object.assign(Object.assign({}, args), { network, txParams }));
    });
}
function promptForProxies(proxyReference, network, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const { all, interactive } = options;
        const pickProxyBy = all ? 'all' : undefined;
        const args = { pickProxyBy, proxy: proxyReference };
        const props = getCommandProps({ proxyReference, network, all });
        const { pickProxyBy: promptedPickProxyBy, proxy: promptedProxy } = yield prompt_1.promptIfNeeded({ args, props }, interactive);
        return Object.assign(Object.assign({}, promptedProxy), { all: promptedPickProxyBy === 'all' });
    });
}
function getCommandProps({ proxyReference, network, all } = {}) {
    return Object.assign(Object.assign({}, prompt_1.networksList('network', 'list')), { pickProxyBy: {
            message: 'Which instances would you like to upgrade?',
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
            when: () => !proxyReference && prompt_1.proxiesList('byAddress', network, { kind: interfaces_1.ProxyType.Upgradeable }).length,
        }, proxy: {
            message: 'Pick an instance to upgrade',
            type: 'list',
            choices: ({ pickProxyBy }) => prompt_1.proxiesList(pickProxyBy, network, { kind: interfaces_1.ProxyType.Upgradeable }),
            when: ({ pickProxyBy }) => !all && pickProxyBy && pickProxyBy !== 'all',
            normalize: input => (typeof input !== 'object' ? prompt_1.proxyInfo(contract_1.parseContractReference(input), network) : input),
        } });
}
exports.default = { name, signature, description, register, action };
//# sourceMappingURL=update.js.map