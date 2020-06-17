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
Object.defineProperty(exports, "__esModule", { value: true });
const name = 'status';
const signature = name;
const description = 'print information about the local status of your app in a specific network';
const register = program => program
    .command(signature, undefined, { noHelp: true })
    .description(description)
    .usage('--network <network>')
    .option('--fetch', 'retrieve app information directly from the network instead of from the local network file')
    .option('--fix', 'update local network file with information retrieved from the network')
    .withNetworkOptions()
    .action(action);
function action(options) {
    return __awaiter(this, void 0, void 0, function* () {
        throw Error('Status command has been removed.');
        if (!options.dontExitProcess && process.env.NODE_ENV !== 'test')
            process.exit(0);
    });
}
exports.default = { name, signature, description, register, action };
//# sourceMappingURL=status.js.map