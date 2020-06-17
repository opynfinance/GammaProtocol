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
const unlink_1 = __importDefault(require("../scripts/unlink"));
const push_1 = __importDefault(require("./push"));
const prompt_1 = require("../prompts/prompt");
const ProjectFile_1 = __importDefault(require("../models/files/ProjectFile"));
const telemetry_1 = __importDefault(require("../telemetry"));
const name = 'unlink';
const signature = `${name} [dependencies...]`;
const description = 'unlinks dependencies from the project. Provide a list of whitespace-separated dependency names';
const register = program => program
    .command(signature, undefined, { noHelp: true })
    .usage('[dependencyName1... dependencyNameN]')
    .description(description)
    .withPushOptions()
    .withNonInteractiveOption()
    .action(action);
function action(dependencies, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const { interactive } = options;
        const installedDependencies = ProjectFile_1.default.getLinkedDependencies();
        const args = { dependencies };
        const props = getCommandProps(installedDependencies);
        const prompted = yield prompt_1.promptIfNeeded({ args, props }, interactive);
        yield telemetry_1.default.report('unlink', prompted, interactive);
        yield unlink_1.default(prompted);
        yield push_1.default.runActionIfRequested(options);
    });
}
function getCommandProps(depNames) {
    return {
        dependencies: {
            message: 'Select the dependencies you want to unlink',
            type: 'checkbox',
            choices: depNames,
        },
    };
}
exports.default = { name, signature, description, register, action };
//# sourceMappingURL=unlink.js.map