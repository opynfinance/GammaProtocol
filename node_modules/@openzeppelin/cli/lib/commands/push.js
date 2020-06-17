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
const add_1 = __importDefault(require("./add"));
const push_1 = __importDefault(require("../scripts/push"));
const Session_1 = __importDefault(require("../models/network/Session"));
const Compiler_1 = require("../models/compiler/Compiler");
const Dependency_1 = __importDefault(require("../models/dependency/Dependency"));
const ConfigManager_1 = __importDefault(require("../models/config/ConfigManager"));
const prompt_1 = require("../prompts/prompt");
const telemetry_1 = __importDefault(require("../telemetry"));
const name = 'push';
const signature = name;
const description = 'deploys your project to the specified <network>';
const register = program => program
    .command(signature, undefined, { noHelp: true })
    .description(description)
    .usage('--network <network> [options]')
    .option('--skip-compile', 'skips contract compilation')
    .option('-d, --deploy-dependencies', 'deploys dependencies to the network if there is no existing deployment')
    .option('--reset', 'redeploys all contracts (not only the ones that changed)')
    .option('--force', 'ignores validation errors and deploys contracts')
    .option('--deploy-proxy-admin', "eagerly deploys the project's proxy admin (if not deployed yet on the provided network)")
    .option('--deploy-proxy-factory', "eagerly deploys the project's proxy factory (if not deployed yet on the provided network)")
    .withNetworkOptions()
    .withNonInteractiveOption()
    .action(commandActions);
function commandActions(options) {
    return __awaiter(this, void 0, void 0, function* () {
        yield add_1.default.runActionIfNeeded(null, options);
        yield action(options);
    });
}
function action(options) {
    return __awaiter(this, void 0, void 0, function* () {
        const { contracts, force, deployDependencies, reset: reupload, network: networkInOpts, deployProxyAdmin, deployProxyFactory, interactive, } = options;
        const { network: networkInSession, expired } = Session_1.default.getNetwork();
        const opts = {
            network: networkInOpts || (!expired ? networkInSession : undefined),
        };
        const defaults = { network: networkInSession };
        const props = getCommandProps();
        if (!options.skipCompile)
            yield Compiler_1.compile();
        const prompted = yield prompt_1.promptIfNeeded({ opts, defaults, props }, interactive);
        const { network, txParams } = yield ConfigManager_1.default.initNetworkConfiguration(Object.assign(Object.assign({}, options), prompted));
        const promptDeployDependencies = yield promptForDeployDependencies(deployDependencies, network, interactive);
        const pushArguments = Object.assign({ deployProxyAdmin,
            deployProxyFactory,
            force,
            reupload,
            network,
            txParams }, promptDeployDependencies);
        if (contracts)
            pushArguments.contractAliases = contracts;
        if (!options.skipTelemetry)
            yield telemetry_1.default.report('push', pushArguments, interactive);
        yield push_1.default(pushArguments);
        if (!options.dontExitProcess && process.env.NODE_ENV !== 'test')
            process.exit(0);
    });
}
function runActionIfRequested(externalOptions) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!externalOptions.push)
            return;
        const options = lodash_1.omit(externalOptions, 'push');
        const network = lodash_1.isString(externalOptions.push) ? externalOptions.push : undefined;
        if (network)
            options.network = network;
        return action(options);
    });
}
function runActionIfNeeded(contracts, network, options) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!options.interactive)
            return;
        yield action(Object.assign(Object.assign({}, options), { dontExitProcess: true, skipTelemetry: true, contracts }));
    });
}
function promptForDeployDependencies(deployDependencies, network, interactive) {
    return __awaiter(this, void 0, void 0, function* () {
        if (yield upgrades_1.ZWeb3.isGanacheNode())
            return { deployDependencies: true };
        if (Dependency_1.default.hasDependenciesForDeploy(network)) {
            const opts = { deployDependencies };
            const props = getCommandProps(network);
            return prompt_1.promptIfNeeded({ opts, props }, interactive);
        }
        return { deployDependencies: undefined };
    });
}
function getCommandProps(networkName) {
    return Object.assign(Object.assign({}, prompt_1.networksList('network', 'list')), { deployDependencies: {
            type: 'confirm',
            message: `One or more linked dependencies are not yet deployed on ${networkName}.\nDo you want to deploy them now?`,
            default: true,
        } });
}
exports.default = {
    name,
    signature,
    description,
    register,
    action,
    runActionIfRequested,
    runActionIfNeeded,
};
//# sourceMappingURL=push.js.map