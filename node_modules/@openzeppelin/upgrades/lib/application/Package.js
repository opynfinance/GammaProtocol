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
const Logger_1 = require("../utils/Logger");
const Contracts_1 = __importDefault(require("../artifacts/Contracts"));
const ImplementationDirectory_1 = __importDefault(require("../application/ImplementationDirectory"));
const Semver_1 = require("../utils/Semver");
const Addresses_1 = require("../utils/Addresses");
const Transactions_1 = __importDefault(require("../utils/Transactions"));
class Package {
    constructor(packageContract, txParams = {}) {
        this.packageContract = packageContract;
        this.txParams = txParams;
    }
    static fetch(address, txParams = {}) {
        if (Addresses_1.isZeroAddress(address))
            return null;
        const PackageContact = Contracts_1.default.getFromLib('Package');
        const packageContract = PackageContact.at(address);
        return new this(packageContract, txParams);
    }
    static deploy(txParams = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const PackageContract = Contracts_1.default.getFromLib('Package');
            const packageContract = yield Transactions_1.default.deployContract(PackageContract, [], txParams);
            Logger_1.Loggy.onVerbose(__filename, 'deploy', `deployed-package-${packageContract.address}`, `Deployed Package ${packageContract.address}`);
            return new this(packageContract, txParams);
        });
    }
    get contract() {
        return this.packageContract;
    }
    get address() {
        return this.packageContract.address;
    }
    hasVersion(version) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.packageContract.methods.hasVersion(Semver_1.toSemanticVersion(version)).call();
        });
    }
    isFrozen(version) {
        return __awaiter(this, void 0, void 0, function* () {
            const directory = yield this.getDirectory(version);
            return directory.isFrozen();
        });
    }
    freeze(version) {
        return __awaiter(this, void 0, void 0, function* () {
            const directory = yield this.getDirectory(version);
            if (!directory.freeze)
                throw Error('Implementation directory does not support freezing');
            return directory.freeze();
        });
    }
    getImplementation(version, contractName) {
        return __awaiter(this, void 0, void 0, function* () {
            const directory = yield this.getDirectory(version);
            return directory.getImplementation(contractName);
        });
    }
    newVersion(version, content = '') {
        return __awaiter(this, void 0, void 0, function* () {
            const semver = Semver_1.toSemanticVersion(version);
            const directory = yield ImplementationDirectory_1.default.deploy(Object.assign({}, this.txParams));
            yield Transactions_1.default.sendTransaction(this.packageContract.methods.addVersion, [semver, directory.address, Buffer.from(content)], Object.assign({}, this.txParams));
            return directory;
        });
    }
    getDirectory(version) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!version)
                throw Error('Cannot get a directory from a package without specifying a version');
            const directoryAddress = yield this.packageContract.methods.getContract(Semver_1.toSemanticVersion(version)).call();
            return ImplementationDirectory_1.default.fetch(directoryAddress, Object.assign({}, this.txParams));
        });
    }
}
exports.default = Package;
//# sourceMappingURL=Package.js.map