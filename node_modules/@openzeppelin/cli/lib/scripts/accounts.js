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
const upgrades_1 = require("@openzeppelin/upgrades");
function accounts({ network }) {
    return __awaiter(this, void 0, void 0, function* () {
        const defaultAccount = yield upgrades_1.ZWeb3.defaultAccount();
        const accounts = yield upgrades_1.ZWeb3.eth.getAccounts();
        if (accounts && accounts.length !== 0) {
            upgrades_1.Loggy.noSpin(__filename, `accounts`, `network-name`, `Accounts for ${network}:`);
            upgrades_1.Loggy.noSpin(__filename, `accounts`, `default-account`, `Default: ${defaultAccount}`);
            upgrades_1.Loggy.noSpin(__filename, `accounts`, `all-accounts`, `All:\n${accounts.map((account, index) => `- ${index}: ${account}`).join('\n')}`);
        }
        else {
            upgrades_1.Loggy.noSpin(__filename, `accounts`, `accounts-msg`, `There are no accounts for ${network}`);
        }
    });
}
exports.default = accounts;
//# sourceMappingURL=accounts.js.map