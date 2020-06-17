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
const fs_extra_1 = __importDefault(require("fs-extra"));
const v4_1 = __importDefault(require("uuid/v4"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
const env_paths_1 = __importDefault(require("env-paths"));
const lodash_1 = require("lodash");
const inquirer_1 = __importDefault(require("inquirer"));
const child_process_1 = __importDefault(require("child_process"));
const process_1 = __importDefault(require("process"));
const prompt_1 = require("../prompts/prompt");
const ProjectFile_1 = __importDefault(require("../models/files/ProjectFile"));
// We export an object with report and sendToFirebase so that we can stub them in tests.
exports.default = {
    DISABLE_TELEMETRY: !!process_1.default.env.OPENZEPPELIN_DISABLE_TELEMETRY,
    report(commandName, params, interactive) {
        return __awaiter(this, void 0, void 0, function* () {
            const telemetryOptions = yield checkOptIn(interactive);
            if (telemetryOptions === undefined || !telemetryOptions.optIn)
                return;
            // normalize network name
            let network = params.network;
            if (network !== undefined && network.match(/dev-/)) {
                network = 'development';
            }
            // Conceal data before sending it
            const concealedData = concealData(params, telemetryOptions.salt);
            const commandData = Object.assign(Object.assign({}, concealedData), { name: commandName });
            if (network !== undefined)
                commandData.network = network;
            const userEnvironment = yield getUserEnvironment();
            this.sendToFirebase(telemetryOptions.uuid, commandData, userEnvironment);
        });
    },
    sendToFirebase(uuid, commandData, userEnvironment) {
        // We send to Firebase in a child process so that the CLI is not blocked from exiting.
        const child = child_process_1.default.fork(path_1.default.join(__dirname, './send-to-firebase'), [], {
            stdio: ['ignore', 'ignore', 'ignore', 'ipc'],
        });
        child.send({ uuid, commandData, userEnvironment });
        // Allow this process to exit while the child is still alive.
        child.disconnect();
        child.unref();
    },
};
function checkOptIn(interactive) {
    return __awaiter(this, void 0, void 0, function* () {
        // disable via env var for local development
        if (module.exports.DISABLE_TELEMETRY)
            return undefined;
        const project = new ProjectFile_1.default();
        const localOptIn = project.telemetryOptIn;
        const { data: globalDataDir } = env_paths_1.default('openzeppelin-sdk');
        const globalDataPath = path_1.default.join(globalDataDir, 'telemetry.json');
        let globalOptions = yield fs_extra_1.default.readJson(globalDataPath).catch(() => undefined);
        if (localOptIn === false)
            return undefined;
        // disable interactivity manually for tests and CI
        if (prompt_1.DISABLE_INTERACTIVITY)
            interactive = false;
        if (globalOptions === undefined && interactive) {
            const { optIn } = yield inquirer_1.default.prompt({
                name: 'optIn',
                type: 'confirm',
                message: 'Would you like to contribute anonymous usage data to help us improve the OpenZeppelin CLI? Learn more at https://zpl.in/telemetry',
                default: true,
            });
            const salt = crypto_1.default.randomBytes(32);
            globalOptions = { optIn, uuid: v4_1.default(), salt: salt.toString('hex') };
            yield fs_extra_1.default.ensureDir(globalDataDir);
            yield fs_extra_1.default.writeJson(globalDataPath, globalOptions);
        }
        if (project.exists() && localOptIn === undefined && globalOptions !== undefined) {
            project.telemetryOptIn = globalOptions.optIn;
            // following function is sync
            project.write();
        }
        return globalOptions;
    });
}
function getUserEnvironment() {
    return __awaiter(this, void 0, void 0, function* () {
        return {
            platform: process_1.default.platform,
            arch: process_1.default.arch,
            nodeVersion: process_1.default.version,
            cliVersion: yield getCLIVersion(),
            upgradesVersion: getDependencyVersion('@openzeppelin/upgrades'),
            truffleVersion: getDependencyVersion('truffle'),
            web3Version: getDependencyVersion('web3'),
        };
    });
}
function getCLIVersion() {
    return __awaiter(this, void 0, void 0, function* () {
        return JSON.parse(yield fs_extra_1.default.readFile(__dirname + '/../../package.json', 'utf8')).version;
    });
}
function getDependencyVersion(dep) {
    try {
        return require(`${dep}/package.json`).version;
    }
    catch (_a) {
        return undefined;
    }
}
function hashField(field, salt) {
    const hash = crypto_1.default.createHash('sha256');
    hash.update(salt);
    hash.update(String(field));
    return hash.digest('hex');
}
function concealData(obj, salt) {
    return lodash_1.mapValues(obj, function recur(val) {
        if (Array.isArray(val)) {
            return val.map(recur);
        }
        else if (typeof val === 'object') {
            return lodash_1.mapValues(val, recur);
        }
        else {
            return hashField(val, salt);
        }
    });
}
//# sourceMappingURL=index.js.map