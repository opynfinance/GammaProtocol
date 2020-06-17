"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const find_up_1 = __importDefault(require("find-up"));
const constants_1 = require("../models/files/constants");
function findRootDirectory(cwd) {
    const filePath = find_up_1.default.sync(['package.json', constants_1.OPEN_ZEPPELIN_FOLDER], { cwd });
    if (!filePath)
        return null;
    return path_1.default.dirname(filePath);
}
exports.default = findRootDirectory;
//# sourceMappingURL=helpers.js.map