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
const Transactions_1 = __importDefault(require("./Transactions"));
const encodeCall_1 = __importDefault(require("../helpers/encodeCall"));
const Logger_1 = require("../utils/Logger");
function migrate(appAddress, proxyAddress, proxyAdminAddress, txParams = {}) {
    return __awaiter(this, void 0, void 0, function* () {
        const data = encodeCall_1.default('changeProxyAdmin', ['address', 'address'], [proxyAddress, proxyAdminAddress]);
        Logger_1.Loggy.spin(__filename, 'migrate', 'migrate-version', `Proxy ${proxyAddress} admin changed to ${proxyAdminAddress}`);
        yield Transactions_1.default.sendRawTransaction(appAddress, { data }, Object.assign({}, txParams));
        Logger_1.Loggy.succeed('migrate-version', `Proxy ${proxyAddress} admin changed to ${proxyAdminAddress}`);
    });
}
exports.default = migrate;
//# sourceMappingURL=Migrator.js.map