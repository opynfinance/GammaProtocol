"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const upgrades_1 = require("@openzeppelin/upgrades");
const LocalController_1 = __importDefault(require("../models/local/LocalController"));
function check({ contractAlias, projectFile }) {
    const controller = new LocalController_1.default(projectFile);
    const success = contractAlias ? controller.validate(contractAlias) : controller.validateAll();
    if (success) {
        upgrades_1.Loggy.noSpin(__filename, 'check', 'check-script', 'No issues were found');
    }
}
exports.default = check;
//# sourceMappingURL=check.js.map