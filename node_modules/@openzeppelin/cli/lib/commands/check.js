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
const check_1 = __importDefault(require("../scripts/check"));
const Compiler_1 = require("../models/compiler/Compiler");
const ConfigManager_1 = __importDefault(require("../models/config/ConfigManager"));
const telemetry_1 = __importDefault(require("../telemetry"));
const name = 'check';
const signature = `${name} [contract]`;
const description = 'checks your contracts for potential issues';
const register = program => program
    .command(signature, undefined, { noHelp: true })
    .usage('[contract] [options]')
    .description(description)
    .option('--skip-compile', 'skips contract compilation')
    .action(action);
function action(contractAlias, options) {
    return __awaiter(this, void 0, void 0, function* () {
        ConfigManager_1.default.initStaticConfiguration();
        if (!options.skipCompile)
            yield Compiler_1.compile();
        yield telemetry_1.default.report('check', { contractAlias }, options.interactive);
        check_1.default({ contractAlias });
    });
}
exports.default = { name, signature, description, register, action };
//# sourceMappingURL=check.js.map