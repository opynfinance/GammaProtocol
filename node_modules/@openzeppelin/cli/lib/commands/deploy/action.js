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
const upgrades_1 = require("@openzeppelin/upgrades");
const Session_1 = __importDefault(require("../../models/network/Session"));
const Compiler_1 = require("../../models/compiler/Compiler");
const naming_1 = require("../../utils/naming");
const NetworkController_1 = __importDefault(require("../../models/network/NetworkController"));
const stdout_1 = __importDefault(require("../../utils/stdout"));
const input_1 = require("../../utils/input");
const create_1 = require("../create");
const upgrades_2 = require("@openzeppelin/upgrades");
function preAction(params) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!params.skipCompile) {
            yield Compiler_1.compile();
        }
        // If the user requests upgradeability via flag, we short circuit to the
        // create action. This avoid issues parsing deploy arguments due to the
        // deploy action being unaware of initializer functions.
        if (params.kind && params.kind !== 'regular') {
            return () => runCreate(params);
        }
    });
}
exports.preAction = preAction;
function action(params) {
    return __awaiter(this, void 0, void 0, function* () {
        if (params.kind && params.kind !== 'regular') {
            return runCreate(params);
        }
        const { contract: contractName, arguments: deployArgs } = params;
        if (params.network === undefined) {
            const { network: lastNetwork, expired } = Session_1.default.getNetwork();
            if (!expired) {
                params.network = lastNetwork;
            }
        }
        const { network, txParams } = params;
        // Used for network preselection in subsequent runs.
        Session_1.default.setDefaultNetworkIfNeeded(network);
        const { package: packageName, contract: contractAlias } = naming_1.fromContractFullName(contractName);
        const controller = new NetworkController_1.default(network, txParams, params.networkFile);
        const contract = controller.contractManager.getContractClass(packageName, contractAlias);
        const constructorInputs = upgrades_1.getConstructorInputs(contract);
        const args = input_1.parseMultipleArgs(deployArgs, constructorInputs);
        try {
            const instance = yield controller.createInstance(packageName, contractAlias, args);
            if (params.kind === 'upgradeable') {
                upgrades_2.Loggy.noSpin(__filename, 'deploy', 'deploy-hint', `To upgrade this instance run 'oz upgrade'`);
            }
            stdout_1.default(instance.address);
        }
        finally {
            controller.writeNetworkPackageIfNeeded();
        }
    });
}
exports.action = action;
function runCreate(params) {
    return __awaiter(this, void 0, void 0, function* () {
        // The syntax params['key'] is used to circumvent the type checker.
        // This hack is temporary and should be removed once we remove the create command.
        if (params.arguments.length > 0) {
            // Translate arguments to syntax expected by create.
            params['args'] = params.arguments.join(',');
        }
        if (params.kind === 'minimal') {
            params['minimal'] = true;
        }
        params.skipCompile = true;
        params['noDeprecationWarning'] = true;
        yield create_1.createAction(params.contract, params);
    });
}
//# sourceMappingURL=action.js.map