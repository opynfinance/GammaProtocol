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
const NetworkController_1 = __importDefault(require("../models/network/NetworkController"));
/**
 * Initializes a zOS application testing and deploying it to the test network,
 * along with dependencies (if specified)
 * @param txParams optional txParams (from, gas, gasPrice) to use on every transaction
 * @param networkFile optional `NetworkFile` object to use, instead of zos.test.json
 */
function default_1(txParams = {}, networkFile) {
    return __awaiter(this, void 0, void 0, function* () {
        const controller = new NetworkController_1.default('test', txParams, networkFile);
        yield controller.deployDependencies();
        yield controller.push(undefined, { reupload: false, force: true });
        return controller.project;
    });
}
exports.default = default_1;
//# sourceMappingURL=TestHelper.js.map