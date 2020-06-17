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
const add_1 = __importDefault(require("../scripts/add"));
const add_all_1 = __importDefault(require("../scripts/add-all"));
const ConfigManager_1 = __importDefault(require("../models/config/ConfigManager"));
const Compiler_1 = require("../models/compiler/Compiler");
const prompt_1 = require("../prompts/prompt");
const naming_1 = require("../utils/naming");
const ProjectFile_1 = __importDefault(require("../models/files/ProjectFile"));
const telemetry_1 = __importDefault(require("../telemetry"));
const name = 'add';
const signature = `${name} [contractNames...]`;
const description = 'add contract to your project. Provide a list of whitespace-separated contract names';
const register = program => program
    .command(signature, undefined, { noHelp: true })
    .usage('[contractName1[:contractAlias1] ... contractNameN[:contractAliasN]] [options]')
    .description(description)
    .option('--all', 'add all contracts in your build directory')
    .withPushOptions()
    .withNonInteractiveOption()
    .action(action);
function action(contractNames, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const { skipCompile, all, interactive } = options;
        ConfigManager_1.default.initStaticConfiguration();
        if (!skipCompile)
            yield Compiler_1.compile();
        if (all)
            add_all_1.default({});
        else {
            const args = { contractNames };
            const props = getCommandProps();
            const prompted = yield prompt_1.promptIfNeeded({ args, props }, interactive);
            const contractsData = contractNames.length !== 0
                ? contractNames.map(splitContractName)
                : prompted.contractNames.map(contractName => ({ name: contractName }));
            if (!options.skipTelemetry)
                yield telemetry_1.default.report('add', { contractsData }, interactive);
            add_1.default({ contractsData });
        }
        yield push_1.default.runActionIfRequested(options);
    });
}
function runActionIfNeeded(contractName, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const { interactive } = options;
        const { contract: contractAlias, package: packageName } = naming_1.fromContractFullName(contractName);
        const projectFile = new ProjectFile_1.default();
        options = Object.assign(Object.assign({}, options), { skipTelemetry: true });
        if (interactive) {
            if (!packageName && contractAlias && !projectFile.hasContract(contractAlias)) {
                yield action([contractAlias], options);
            }
            else if (!packageName && !projectFile.hasContracts()) {
                yield action([], options);
            }
        }
    });
}
function getCommandProps() {
    return prompt_1.contractsList('contractNames', 'Pick which contracts you want to add', 'checkbox', 'notAdded');
}
function splitContractName(rawData) {
    const [contractName, alias] = rawData.split(':');
    return { name: contractName, alias };
}
exports.default = {
    name,
    signature,
    description,
    register,
    action,
    runActionIfNeeded,
};
//# sourceMappingURL=add.js.map