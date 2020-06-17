"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const register_command_1 = require("../../register-command");
const spec = __importStar(require("./spec"));
var spec_1 = require("./spec");
exports.name = spec_1.name;
exports.description = spec_1.description;
exports.signature = register_command_1.generateSignature(spec.name, spec.args);
function register(program) {
    register_command_1.register(program, spec, () => Promise.resolve().then(() => __importStar(require('./action'))));
}
exports.register = register;
//# sourceMappingURL=index.js.map