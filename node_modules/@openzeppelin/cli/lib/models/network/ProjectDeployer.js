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
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const upgrades_1 = require("@openzeppelin/upgrades");
class BaseProjectDeployer {
    constructor(controller, requestedVersion) {
        this.controller = controller;
        this.projectFile = controller.projectFile;
        this.networkFile = controller.networkFile;
        this.txParams = controller.txParams;
        this.requestedVersion = requestedVersion;
    }
}
class BasePackageProjectDeployer extends BaseProjectDeployer {
    get packageAddress() {
        return this.controller.packageAddress;
    }
    _tryRegisterPartialDeploy({ thepackage, directory }) {
        if (thepackage)
            this._registerPackage(thepackage);
        if (directory)
            this._registerVersion(this.requestedVersion, directory);
    }
    _registerPackage({ address }) {
        this.networkFile.package = { address };
    }
    _registerVersion(version, { address }) {
        this.networkFile.provider = { address };
        this.networkFile.version = version;
    }
}
class PackageProjectDeployer extends BasePackageProjectDeployer {
    fetchOrDeploy() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const packageAddress = this.packageAddress;
                this.project = yield upgrades_1.PackageProject.fetchOrDeploy(this.requestedVersion, this.txParams, { packageAddress });
                this._registerPackage(yield this.project.getProjectPackage());
                this._registerVersion(this.requestedVersion, yield this.project.getCurrentDirectory());
                return this.project;
            }
            catch (deployError) {
                this._tryRegisterPartialDeploy(deployError);
                if (!this.project)
                    throw deployError;
            }
        });
    }
}
exports.PackageProjectDeployer = PackageProjectDeployer;
class AppProjectDeployer extends BasePackageProjectDeployer {
    fetchOrDeploy() {
        return __awaiter(this, void 0, void 0, function* () {
            return this._run((existingAddresses) => upgrades_1.AppProject.fetchOrDeploy(this.projectFile.name, this.requestedVersion, this.txParams, existingAddresses));
        });
    }
    fromProxyAdminProject(proxyAdminProject) {
        return __awaiter(this, void 0, void 0, function* () {
            return this._run((existingAddresses) => upgrades_1.AppProject.fromProxyAdminProject(proxyAdminProject, this.requestedVersion, existingAddresses));
        });
    }
    get appAddress() {
        return this.controller.appAddress;
    }
    get proxyAdminAddress() {
        return this.networkFile.proxyAdminAddress;
    }
    get proxyFactoryAddress() {
        return this.networkFile.proxyFactoryAddress;
    }
    _run(createProjectFn) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { appAddress, packageAddress, proxyAdminAddress, proxyFactoryAddress } = this;
                this.project = yield createProjectFn({
                    appAddress,
                    packageAddress,
                    proxyAdminAddress,
                    proxyFactoryAddress,
                });
                yield this._registerDeploy();
                return this.project;
            }
            catch (deployError) {
                this._tryRegisterPartialDeploy(deployError);
                if (!this.project)
                    throw deployError;
            }
        });
    }
    _tryRegisterPartialDeploy({ thepackage, app, directory }) {
        super._tryRegisterPartialDeploy({ thepackage, directory });
        if (app)
            this._registerApp(app);
    }
    _registerDeploy() {
        return __awaiter(this, void 0, void 0, function* () {
            this._registerApp(this.project.getApp());
            this._registerPackage(yield this.project.getProjectPackage());
            this._registerVersion(this.requestedVersion, yield this.project.getCurrentDirectory());
        });
    }
    _registerApp({ address }) {
        this.networkFile.app = { address };
    }
}
exports.AppProjectDeployer = AppProjectDeployer;
class ProxyAdminProjectDeployer extends BaseProjectDeployer {
    fetchOrDeploy() {
        return __awaiter(this, void 0, void 0, function* () {
            this.project = yield upgrades_1.ProxyAdminProject.fetch(this.projectFile.name, this.txParams, this.networkFile.proxyAdminAddress, this.networkFile.proxyFactoryAddress);
            this.networkFile.version = this.requestedVersion;
            lodash_1.forEach(this.networkFile.contracts, (contractInfo, contractAlias) => {
                this.project.registerImplementation(contractAlias, {
                    address: contractInfo.address,
                    bytecodeHash: contractInfo.bodyBytecodeHash,
                });
            });
            lodash_1.forEach(this.networkFile.dependencies, (dependencyInfo, dependencyName) => {
                this.project.setDependency(dependencyName, dependencyInfo.package, dependencyInfo.version);
            });
            return this.project;
        });
    }
}
exports.ProxyAdminProjectDeployer = ProxyAdminProjectDeployer;
//# sourceMappingURL=ProjectDeployer.js.map