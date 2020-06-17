"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const upgrades_1 = require("@openzeppelin/upgrades");
const LocalController_1 = __importDefault(require("../models/local/LocalController"));
function addAll({ projectFile }) {
    const controller = new LocalController_1.default(projectFile);
    controller.addAll();
    upgrades_1.Loggy.noSpin(__filename, 'add', 'add-contracts', 'All local contracts have been added to the project.');
    controller.writePackage();
}
exports.default = addAll;
//# sourceMappingURL=add-all.js.map