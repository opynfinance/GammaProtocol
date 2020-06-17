"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = __importDefault(require("util"));
const child_process_1 = __importDefault(require("child_process"));
const exec = util_1.default.promisify(child_process_1.default.exec);
exports.default = {
    exec,
    execSync: child_process_1.default.execSync,
};
//# sourceMappingURL=child.js.map