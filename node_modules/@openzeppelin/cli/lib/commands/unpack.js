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
const unpack_1 = __importDefault(require("../scripts/unpack"));
const telemetry_1 = __importDefault(require("../telemetry"));
const name = 'unpack';
const signature = `${name} [kit]`;
const description = `download and install an OpenZeppelin Starter Kit to the current directory`;
const register = program => program
    .command(signature, undefined, { noHelp: true })
    .usage('[kit]')
    .description(description)
    .withNonInteractiveOption()
    .action(action);
function action(kit, options) {
    return __awaiter(this, void 0, void 0, function* () {
        yield telemetry_1.default.report('unpack', { repoOrName: kit }, options.interactive);
        yield unpack_1.default({ repoOrName: kit });
    });
}
exports.default = { name, signature, description, register, action };
//# sourceMappingURL=unpack.js.map