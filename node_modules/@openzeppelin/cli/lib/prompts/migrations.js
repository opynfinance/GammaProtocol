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
const readline_1 = __importDefault(require("readline"));
const ManifestVersion_1 = require("../models/files/ManifestVersion");
const NetworkFile_1 = __importDefault(require("../models/files/NetworkFile"));
function hasToMigrateProject(network) {
    return __awaiter(this, void 0, void 0, function* () {
        const version = NetworkFile_1.default.getManifestVersion(network);
        if (ManifestVersion_1.isMigratableManifestVersion(version)) {
            const response = yield new Promise(resolve => {
                const prompt = readline_1.default.createInterface({
                    input: process.stdin,
                    output: process.stdout,
                });
                prompt.question(`An old @openzeppelin/cli version was detected and needs to be migrated to the latest one.\nDo you want to proceed? [y/n] `, answer => {
                    prompt.close();
                    resolve(answer);
                });
            });
            if (!isValidResponse(response))
                return hasToMigrateProject(network);
            return response === 'y' || response === 'Y';
        }
        return true;
    });
}
exports.hasToMigrateProject = hasToMigrateProject;
function isValidResponse(response) {
    return response === 'y' || response === 'Y' || response === 'n' || response === 'N';
}
//# sourceMappingURL=migrations.js.map