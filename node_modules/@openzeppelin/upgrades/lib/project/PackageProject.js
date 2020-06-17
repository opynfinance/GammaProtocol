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
const BasePackageProject_1 = __importDefault(require("./BasePackageProject"));
const Package_1 = __importDefault(require("../application/Package"));
const DeployError_1 = require("../utils/errors/DeployError");
const Semver_1 = require("../utils/Semver");
class PackageProject extends BasePackageProject_1.default {
    static fetch(packageAddress, version = '0.1.0', txParams) {
        return __awaiter(this, void 0, void 0, function* () {
            const thepackage = Package_1.default.fetch(packageAddress, txParams);
            return new this(thepackage, version, txParams);
        });
    }
    // REFACTOR: Evaluate merging this logic with CLI's ProjectDeployer classes
    static fetchOrDeploy(version = '0.1.0', txParams = {}, { packageAddress } = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            let thepackage;
            let directory;
            version = Semver_1.semanticVersionToString(version);
            try {
                thepackage = packageAddress ? Package_1.default.fetch(packageAddress, txParams) : yield Package_1.default.deploy(txParams);
                directory = (yield thepackage.hasVersion(version))
                    ? yield thepackage.getDirectory(version)
                    : yield thepackage.newVersion(version);
                const project = new this(thepackage, version, txParams);
                project.directory = directory;
                return project;
            }
            catch (error) {
                throw new DeployError_1.DeployError(error, { thepackage, directory });
            }
        });
    }
    constructor(thepackage, version = '0.1.0', txParams = {}) {
        super(txParams);
        this.package = thepackage;
        this.version = Semver_1.semanticVersionToString(version);
    }
    getImplementation({ contractName }) {
        return __awaiter(this, void 0, void 0, function* () {
            const directory = yield this.getCurrentDirectory();
            return directory.getImplementation(contractName);
        });
    }
    getProjectPackage() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.package;
        });
    }
    getCurrentDirectory() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.directory) {
                const thepackage = yield this.getProjectPackage();
                this.directory = yield thepackage.getDirectory(this.version);
            }
            return this.directory;
        });
    }
    getCurrentVersion() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.version;
        });
    }
}
exports.default = PackageProject;
//# sourceMappingURL=PackageProject.js.map