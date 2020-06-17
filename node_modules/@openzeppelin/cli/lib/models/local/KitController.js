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
const path_1 = __importDefault(require("path"));
const axios_1 = __importDefault(require("axios"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const ajv_1 = __importDefault(require("ajv"));
const upgrades_1 = require("@openzeppelin/upgrades");
const constants_1 = require("../files/constants");
const KitFile_1 = require("../files/KitFile");
const kit_config_schema_json_1 = __importDefault(require("../files/kit-config.schema.json"));
const patch_1 = __importDefault(require("../../utils/patch"));
const child_1 = __importDefault(require("../../utils/child"));
const simpleGit = patch_1.default('simple-git/promise');
class KitController {
    unpack(url, branchName = 'stable', workingDirPath = '', config) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!url)
                throw Error('A url must be provided.');
            if (!config)
                throw Error('A config must be provided.');
            const { exec } = child_1.default;
            const { readdir, remove } = fs_extra_1.default;
            // because zos always spawns '.lock' file
            const files = (yield readdir(workingDirPath)).filter((file) => file !== constants_1.OPEN_ZEPPELIN_FOLDER);
            if (files.length > 0) {
                throw Error(`Unable to unpack ${url} in the current directory, as it must be empty.`);
            }
            try {
                upgrades_1.Loggy.spin(__filename, 'unpack', 'unpack-kit', `Downloading kit from ${url}`);
                const git = simpleGit(workingDirPath);
                yield git.init();
                yield git.addRemote('origin', url);
                yield git.fetch();
                // if files are empty checkout everything
                if (!config.files.length) {
                    yield git.pull('origin', branchName);
                }
                else {
                    // if there are some files then do tree-ish checkout
                    // http://nicolasgallagher.com/git-checkout-specific-files-from-another-branch/
                    yield git.checkout([`origin/${branchName}`, `--`, ...config.files]);
                }
                upgrades_1.Loggy.update('unpack-kit', { text: 'Unpacking kit' });
                // always delete .git folder
                yield remove(path_1.default.join(workingDirPath, '.git'));
                // run kit commands like `npm install`
                yield exec(config.hooks['post-unpack'], { maxBuffer: 1024 * 1024 * 100 });
                upgrades_1.Loggy.succeed('unpack-kit', 'Kit downloaded and unpacked');
                upgrades_1.Loggy.noSpin(__filename, 'unpack', 'unpack-succeeded', `The kit is ready to use. \n${config.message}`);
            }
            catch (e) {
                // TODO: remove all files from directory on fail except .lock
                e.message = `Failed to download and unpack kit from ${url}. Details: ${e.message}`;
                throw e;
            }
        });
    }
    verifyRepo(url, branchName = 'stable') {
        return __awaiter(this, void 0, void 0, function* () {
            if (!url)
                throw Error('A url must be provided.');
            try {
                const config = (yield axios_1.default.get(url.replace('.git', `/${branchName}/kit.json`).replace('github.com', 'raw.githubusercontent.com'))).data;
                // validate our json config
                // TODO: derive the schema directly from the KitConfig type
                const ajv = new ajv_1.default({ allErrors: true });
                const test = ajv.compile(kit_config_schema_json_1.default);
                const isValid = test(config);
                if (!isValid) {
                    throw new Error(`kit.json is not valid. Errors: ${test.errors.reduce((ret, err) => `${err.message}, ${ret}`, '')}`);
                }
                // has to be the same version
                if (config.manifestVersion !== KitFile_1.MANIFEST_VERSION) {
                    throw new Error(`Unrecognized kit version identifier ${config.manifestVersion}.
          This means the kit was built with an unknown version of openzeppelin.
          Please refer to the documentation at https://docs.openzeppelin.com/sdk for more info.`);
                }
                return config;
            }
            catch (e) {
                e.message = `Failed to verify ${url} at branch ${branchName}. Details: ${e.message}`;
                throw e;
            }
        });
    }
}
exports.default = KitController;
//# sourceMappingURL=KitController.js.map