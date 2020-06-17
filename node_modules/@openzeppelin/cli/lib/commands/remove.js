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
const remove_1 = __importDefault(require("../scripts/remove"));
const push_1 = __importDefault(require("./push"));
const prompt_1 = require("../prompts/prompt");
const telemetry_1 = __importDefault(require("../telemetry"));
const name = 'remove';
const signature = `${name} [contracts...]`;
const description = 'removes one or more contracts from your project. Provide a list of whitespace-separated contract names.';
const register = program => program
    .command(signature, undefined, { noHelp: true })
    .alias('rm')
    .usage('[contract1 ... contractN] [options]')
    .description(description)
    .withPushOptions()
    .withNonInteractiveOption()
    .action(action);
function action(contracts, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const { interactive } = options;
        const args = { contracts };
        const props = getCommandProps();
        const prompted = yield prompt_1.promptIfNeeded({ args, props }, interactive);
        yield telemetry_1.default.report('remove', prompted, interactive);
        remove_1.default(prompted);
        yield push_1.default.runActionIfRequested(options);
    });
}
function getCommandProps() {
    return prompt_1.contractsList('contracts', 'Choose one or more contracts', 'checkbox', 'added');
}
exports.default = { name, signature, description, register, action };
//# sourceMappingURL=remove.js.map