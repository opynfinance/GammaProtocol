"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const upgrades_1 = require("@openzeppelin/upgrades");
const LocalController_1 = __importDefault(require("../models/local/LocalController"));
function add({ contractsData, projectFile }) {
    if (contractsData.length === 0)
        throw new Error('At least one contract name must be provided to add.');
    contractsData = contractsData.map(data => (typeof data === 'string' ? { name: data, alias: data } : data));
    const controller = new LocalController_1.default(projectFile);
    contractsData.forEach(({ name, alias }) => {
        controller.checkCanAdd(name);
        controller.add(alias || name, name);
    });
    if (contractsData.length > 1) {
        upgrades_1.Loggy.noSpin(__filename, 'add', 'add-contracts', 'All the selected contracts have been added to the project');
    }
    controller.writePackage();
}
exports.default = add;
//# sourceMappingURL=add.js.map