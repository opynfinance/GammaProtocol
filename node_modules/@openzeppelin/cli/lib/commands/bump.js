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
const bump_1 = __importDefault(require("../scripts/bump"));
const telemetry_1 = __importDefault(require("../telemetry"));
const name = 'bump';
const signature = `${name} <version>`;
const description = 'bump your project to a new <version>';
const register = program => program
    .command(signature, undefined, { noHelp: true })
    .usage('<version> [options]')
    .description(description)
    .withPushOptions()
    .action(action);
function action(version, options) {
    return __awaiter(this, void 0, void 0, function* () {
        yield telemetry_1.default.report('bump', { version }, options.interactive);
        yield bump_1.default({ version });
        yield push_1.default.runActionIfRequested(options);
    });
}
exports.default = { name, signature, description, register, action };
//# sourceMappingURL=bump.js.map