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
const LocalController_1 = __importDefault(require("../models/local/LocalController"));
function bumpVersion({ version, projectFile }) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!version)
            throw Error('A version name must be provided to initialize a new version.');
        const controller = new LocalController_1.default(projectFile);
        controller.bumpVersion(version);
        controller.writePackage();
    });
}
exports.default = bumpVersion;
//# sourceMappingURL=bump.js.map