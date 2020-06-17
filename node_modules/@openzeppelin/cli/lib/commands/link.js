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
const push_1 = __importDefault(require("./push"));
const link_1 = __importDefault(require("../scripts/link"));
const Dependency_1 = __importDefault(require("../models/dependency/Dependency"));
const ProjectFile_1 = __importDefault(require("../models/files/ProjectFile"));
const prompt_1 = require("../prompts/prompt");
const naming_1 = require("../utils/naming");
const telemetry_1 = __importDefault(require("../telemetry"));
const name = 'link';
const signature = `${name} [dependencies...]`;
const description = 'links project with a list of dependencies each located in its npm package';
const register = program => program
    .command(signature, undefined, { noHelp: true })
    .usage('[dependencyName1 ... dependencyNameN] [options]')
    .description(description)
    .option('--no-install', 'skip installing packages dependencies locally')
    .withPushOptions()
    .withNonInteractiveOption()
    .action(action);
function action(dependencies, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const { install, forceInstall, interactive } = options;
        const installDependencies = install || forceInstall;
        const args = { dependencies };
        const props = getCommandProps();
        const defaults = {
            dependencies: [yield Dependency_1.default.fetchVersionFromNpm('@openzeppelin/contracts-ethereum-package')],
        };
        const prompted = yield prompt_1.promptIfNeeded({ args, props, defaults }, interactive);
        const linkArguments = Object.assign(Object.assign({}, prompted), { installDependencies });
        if (!options.skipTelemetry)
            yield telemetry_1.default.report('push', linkArguments, interactive);
        yield link_1.default(linkArguments);
        yield push_1.default.runActionIfRequested(options);
    });
}
function runActionIfNeeded(contractFullName, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const { interactive } = options;
        const projectFile = new ProjectFile_1.default();
        const { contract: contractAlias, package: packageName } = naming_1.fromContractFullName(contractFullName);
        if (interactive && packageName && !projectFile.hasDependency(packageName)) {
            yield action([packageName], Object.assign(Object.assign({}, options), { forceInstall: true, skipTelemetry: true }));
        }
    });
}
function getCommandProps() {
    return {
        dependencies: {
            type: 'input',
            message: 'Provide an Ethereum Package name and version',
            normalize: input => (typeof input === 'string' ? [input] : input),
        },
    };
}
exports.default = {
    name,
    signature,
    description,
    register,
    action,
    runActionIfNeeded,
};
//# sourceMappingURL=link.js.map