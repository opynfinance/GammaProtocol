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
const process_1 = __importDefault(require("process"));
const KitController_1 = __importDefault(require("../models/local/KitController"));
const nameToRepo = {
    // TODO-v3: Remove legacy zepkit support
    zepkit: 'openzeppelin/starter-kit',
    starter: 'openzeppelin/starter-kit',
    tutorial: 'openzeppelin/tutorial-kit',
    gsn: 'openzeppelin/starter-kit-gsn',
};
// https://github.com/openzeppelin/starter-kit.git
function unpack({ repoOrName }) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!repoOrName)
            throw Error('A kit name or GitHub repo must be provided to unpack to the current directory.');
        repoOrName = repoOrName.toLowerCase();
        if (!repoOrName.includes('/') && !repoOrName.includes('#')) {
            // predefined name has been passed
            // check if it is registered
            if (!nameToRepo.hasOwnProperty(repoOrName)) {
                throw new Error(`Kit named ${repoOrName} doesn't exist`);
            }
            repoOrName = nameToRepo[repoOrName];
        }
        let branchName = 'stable';
        if (repoOrName.includes('#')) {
            [repoOrName, branchName] = repoOrName.split('#', 2);
        }
        const url = `https://github.com/${repoOrName}.git`;
        const controller = new KitController_1.default();
        const config = yield controller.verifyRepo(url, branchName);
        yield controller.unpack(url, branchName, process_1.default.cwd(), config);
    });
}
exports.default = unpack;
//# sourceMappingURL=unpack.js.map