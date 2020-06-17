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
const link_1 = __importDefault(require("./link"));
const add_1 = __importDefault(require("./add"));
const push_1 = __importDefault(require("./push"));
const create_1 = __importDefault(require("../scripts/create"));
const Session_1 = __importDefault(require("../models/network/Session"));
const Compiler_1 = require("../models/compiler/Compiler");
const naming_1 = require("../utils/naming");
const migrations_1 = require("../prompts/migrations");
const ConfigManager_1 = __importDefault(require("../models/config/ConfigManager"));
const prompt_1 = require("../prompts/prompt");
const method_params_1 = __importDefault(require("../prompts/method-params"));
const interfaces_1 = require("../scripts/interfaces");
const telemetry_1 = __importDefault(require("../telemetry"));
const name = 'create';
const signature = `${name} [alias]`;
const description = 'deploys a new upgradeable contract instance. Provide the <alias> you added your contract with, or <package>/<alias> to create a contract from a linked package.';
const register = program => program
    .command(signature, undefined, { noHelp: true })
    .usage('[alias] --network <network> [options]')
    .description(description)
    .option('--init [function]', `call function after creating contract. If none is given, 'initialize' will be used`)
    .option('--args <arg1, arg2, ...>', 'provide initialization arguments for your contract if required')
    .option('--force', 'ignore contracts validation errors')
    .option('--minimal', 'creates a cheaper but non-upgradeable instance instead, using a minimal proxy')
    .withNetworkOptions()
    .withSkipCompileOption()
    .withNonInteractiveOption()
    .action(createAction);
function createAction(contractFullName, options) {
    return __awaiter(this, void 0, void 0, function* () {
        if (options.minimal) {
            upgrades_1.Loggy.noSpin.warn(__filename, 'action', 'create-minimal-proxy', 'Minimal proxy support is still experimental.');
        }
        if (!options.noDeprecationWarning) {
            upgrades_1.Loggy.noSpin.warn(__filename, 'action', 'create-deprecation', 'The create command is deprecated. Use deploy instead.');
        }
        const { skipCompile } = options;
        if (!skipCompile)
            yield Compiler_1.compile();
        const { network: promptedNetwork, contractFullName: promptedContractFullName } = yield promptForCreate(contractFullName, options);
        const { network, txParams } = yield ConfigManager_1.default.initNetworkConfiguration(Object.assign(Object.assign({}, options), { network: promptedNetwork }));
        yield link_1.default.runActionIfNeeded(promptedContractFullName, options);
        yield add_1.default.runActionIfNeeded(promptedContractFullName, options);
        yield push_1.default.runActionIfNeeded([promptedContractFullName], network, Object.assign(Object.assign({}, options), { network: promptedNetwork }));
        yield action(promptedContractFullName, Object.assign(Object.assign({}, options), { network, txParams }));
        if (!options.dontExitProcess && process.env.NODE_ENV !== 'test')
            process.exit(0);
    });
}
exports.createAction = createAction;
function action(contractFullName, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const { force, network, txParams, init: rawInitMethod } = options;
        const { contract: contractAlias, package: packageName } = naming_1.fromContractFullName(contractFullName);
        const additionalOpts = {
            askForMethodParams: rawInitMethod,
            askForMethodParamsMessage: 'Call a function to initialize the instance after creating it?',
        };
        const { methodName, methodArgs } = yield method_params_1.default(contractFullName, options, additionalOpts);
        const args = lodash_1.pickBy({
            packageName,
            contractAlias,
            methodName,
            methodArgs,
            force,
        });
        if (options.minimal)
            args.kind = interfaces_1.ProxyType.Minimal;
        if (!(yield migrations_1.hasToMigrateProject(network)))
            process.exit(0);
        yield telemetry_1.default.report('create', Object.assign(Object.assign({}, args), { network, txParams }), options.interactive);
        yield create_1.default(Object.assign(Object.assign({}, args), { network, txParams }));
        Session_1.default.setDefaultNetworkIfNeeded(network);
    });
}
function promptForCreate(contractFullName, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const { force, network: networkInOpts, interactive } = options;
        const { network: networkInSession, expired } = Session_1.default.getNetwork();
        const defaultOpts = { network: networkInSession };
        const args = { contractFullName };
        const opts = {
            network: networkInOpts || (!expired ? networkInSession : undefined),
        };
        return prompt_1.promptIfNeeded({ args, opts, defaults: defaultOpts, props: getCommandProps() }, interactive);
    });
}
function getCommandProps() {
    return Object.assign(Object.assign({}, prompt_1.networksList('network', 'list')), prompt_1.contractsList('contractFullName', 'Pick a contract to instantiate', 'list', 'all'));
}
exports.default = { name, signature, description, register, action };
//# sourceMappingURL=create.js.map