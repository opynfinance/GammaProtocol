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
const freeze_1 = __importDefault(require("../scripts/freeze"));
const ConfigManager_1 = __importDefault(require("../models/config/ConfigManager"));
const telemetry_1 = __importDefault(require("../telemetry"));
const name = 'freeze';
const signature = name;
const description = 'freeze current release version of your published project';
const register = program => program
    .command(signature, undefined, { noHelp: true })
    .usage('--network <network> [options]')
    .description(description)
    .withNetworkOptions()
    .action(action);
function action(options) {
    return __awaiter(this, void 0, void 0, function* () {
        const { network, txParams } = yield ConfigManager_1.default.initNetworkConfiguration(options);
        yield telemetry_1.default.report('freeze', { network, txParams }, options.interactive);
        yield freeze_1.default({ network, txParams });
        if (!options.dontExitProcess && process.env.NODE_ENV !== 'test')
            process.exit(0);
    });
}
exports.default = { name, signature, description, register, action };
//# sourceMappingURL=freeze.js.map