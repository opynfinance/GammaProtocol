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
const create_1 = __importDefault(require("../scripts/create"));
const query_deployment_1 = __importDefault(require("../scripts/query-deployment"));
const query_signed_deployment_1 = __importDefault(require("../scripts/query-signed-deployment"));
const input_1 = require("../utils/input");
const naming_1 = require("../utils/naming");
const migrations_1 = require("../prompts/migrations");
const ConfigManager_1 = __importDefault(require("../models/config/ConfigManager"));
const telemetry_1 = __importDefault(require("../telemetry"));
const name = 'create2';
const signature = `${name} [alias]`;
const description = 'deploys a new upgradeable contract instance using CREATE2 at a predetermined address given a numeric <salt> and a <from> address. Provide the <alias> you added your contract with, or <package>/<alias> to create a contract from a linked package. A <signature> can be provided to derive the deployment address from a signer different to the <from> address. Warning: support for this feature is experimental.';
const register = program => program
    .command(signature, undefined, { noHelp: true })
    .usage('[alias] --network <network> --salt <salt> [options]')
    .description(description)
    .option('--salt <salt>', `salt used to determine the deployment address (required)`)
    .option('--query [sender]', `do not create the contract and just return the deployment address, optionally specifying the sender used to derive the deployment address (defaults to 'from')`)
    .option('--init [function]', `initialization function to call after creating contract (defaults to 'initialize', skips initialization if not set)`)
    .option('--args <arg1, arg2, ...>', 'arguments to the initialization function')
    .option('--admin <admin>', "admin of the proxy (uses the project's proxy admin if not set)")
    .option('--signature <signature>', `signature of the request, uses the signer to derive the deployment address (uses the sender to derive deployment address if not set)`)
    .option('--force', 'force creation even if contracts have local modifications')
    .withNetworkOptions()
    .action(action);
function action(contractFullName, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const { network, txParams } = yield ConfigManager_1.default.initNetworkConfiguration(options);
        if (!(yield migrations_1.hasToMigrateProject(network)))
            process.exit(0);
        if (!options.salt)
            throw new Error("option `--salt' is required");
        const { methodName, methodArgs } = input_1.parseMethodParams(options, 'initialize');
        const { contract: contractAlias, package: packageName } = naming_1.fromContractFullName(contractFullName);
        const opts = Object.assign(Object.assign({}, options), { methodName,
            methodArgs,
            contractAlias,
            packageName });
        yield telemetry_1.default.report('create2', Object.assign(Object.assign({}, opts), { network, txParams }), options.interactive);
        if (options.query && options.signature)
            yield runSignatureQuery(opts, network, txParams);
        else if (options.query)
            yield runQuery(opts, network, txParams);
        else
            yield runCreate(opts, network, txParams);
        if (!options.dontExitProcess && process.env.NODE_ENV !== 'test')
            process.exit(0);
    });
}
exports.default = { name, signature, description, register, action };
function runQuery(options, network, txParams) {
    return __awaiter(this, void 0, void 0, function* () {
        const sender = typeof options.query === 'boolean' ? null : options.query;
        yield query_deployment_1.default({ salt: options.salt, sender, network, txParams });
    });
}
function runSignatureQuery(options, network, txParams) {
    return __awaiter(this, void 0, void 0, function* () {
        const { query, methodName, methodArgs, contractAlias, packageName, force, salt, signature: signatureOption, admin, } = options;
        if (!contractAlias)
            throw new Error('missing required argument: alias');
        if (typeof query === 'string')
            throw new Error("cannot specify argument `sender' as it is inferred from `signature'");
        const args = lodash_1.pickBy({
            packageName,
            contractAlias,
            methodName,
            methodArgs,
            force,
            salt,
            signature: signatureOption,
            admin,
        });
        yield query_signed_deployment_1.default(Object.assign(Object.assign({}, args), { network, txParams }));
    });
}
function runCreate(options, network, txParams) {
    return __awaiter(this, void 0, void 0, function* () {
        const { methodName, methodArgs, contractAlias, packageName, force, salt, signature: signatureOption, admin, } = options;
        if (!contractAlias)
            throw new Error('missing required argument: alias');
        const args = lodash_1.pickBy({
            packageName,
            contractAlias,
            methodName,
            methodArgs,
            force,
            salt,
            signature: signatureOption,
            admin,
        });
        yield create_1.default(Object.assign(Object.assign({}, args), { network, txParams }));
    });
}
//# sourceMappingURL=create2.js.map