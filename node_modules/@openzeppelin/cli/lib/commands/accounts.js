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
const accounts_1 = __importDefault(require("../scripts/accounts"));
const prompt_1 = require("../prompts/prompt");
const ConfigManager_1 = __importDefault(require("../models/config/ConfigManager"));
const telemetry_1 = __importDefault(require("../telemetry"));
const name = 'accounts';
const signature = name;
const description = 'list the accounts of the selected network';
const register = program => program
    .command(signature, undefined, { noHelp: true })
    .description(description)
    .withNetworkOptions()
    .withNonInteractiveOption()
    .action(action);
function action(options) {
    return __awaiter(this, void 0, void 0, function* () {
        const networkOpts = yield prompt_1.promptForNetwork(options, () => getCommandProps());
        const { network } = yield ConfigManager_1.default.initNetworkConfiguration(Object.assign(Object.assign({}, options), networkOpts));
        yield telemetry_1.default.report('accounts', { network }, options.interactive);
        yield accounts_1.default({ network });
        if (!options.dontExitProcess && process.env.NODE_ENV !== 'test')
            process.exit(0);
    });
}
function getCommandProps() {
    return Object.assign({}, prompt_1.networksList('network', 'list'));
}
exports.default = { name, signature, description, register, action };
//# sourceMappingURL=accounts.js.map