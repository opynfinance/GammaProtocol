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
const publish_1 = __importDefault(require("../scripts/publish"));
const ConfigManager_1 = __importDefault(require("../models/config/ConfigManager"));
const migrations_1 = require("../prompts/migrations");
const prompt_1 = require("../prompts/prompt");
const Session_1 = __importDefault(require("../models/network/Session"));
const telemetry_1 = __importDefault(require("../telemetry"));
const name = 'publish';
const signature = `${name}`;
const description = 'publishes your project to the selected network';
const register = program => program
    .command(signature, undefined, { noHelp: true })
    .usage('--network <network> [options]')
    .description(description)
    .withNetworkOptions()
    .withNonInteractiveOption()
    .action(action);
function action(options) {
    return __awaiter(this, void 0, void 0, function* () {
        const { network: networkInArgs, interactive } = options;
        const { network: networkInSession } = Session_1.default.getOptions();
        const defaults = { network: Session_1.default.getNetwork() };
        const opts = { network: networkInSession || networkInArgs };
        const props = getCommandProps();
        const promptedOpts = yield prompt_1.promptIfNeeded({ opts, defaults, props }, interactive);
        const { network, txParams } = yield ConfigManager_1.default.initNetworkConfiguration(promptedOpts);
        if (!(yield migrations_1.hasToMigrateProject(network)))
            process.exit(0);
        yield telemetry_1.default.report('publish', { network, txParams }, interactive);
        yield publish_1.default({ network, txParams });
        if (!options.dontExitProcess && process.env.NODE_ENV !== 'test')
            process.exit(0);
    });
}
function getCommandProps() {
    return prompt_1.networksList('network', 'list');
}
exports.default = { name, signature, description, register, action };
//# sourceMappingURL=publish.js.map