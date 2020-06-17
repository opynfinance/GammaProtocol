"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const upgrades_1 = require("@openzeppelin/upgrades");
const LocalController_1 = __importDefault(require("../models/local/LocalController"));
function remove({ contracts, projectFile }) {
    if (contracts.length === 0)
        throw new Error('At least one contract name must be provided to remove.');
    const controller = new LocalController_1.default(projectFile);
    contracts.forEach(alias => controller.remove(alias));
    upgrades_1.Loggy.noSpin(__filename, 'remove', 'remove-contracts', `All specified contracts have been removed from the project. To add them again, run 'openzeppelin add'.`);
    controller.writePackage();
}
exports.default = remove;
//# sourceMappingURL=remove.js.map