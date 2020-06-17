"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = __importDefault(require("fs-extra"));
const lodash_1 = require("lodash");
const Contracts_1 = __importDefault(require("./Contracts"));
function getBuildArtifacts(path) {
    return new BuildArtifacts(Contracts_1.default.listBuildArtifacts(path));
}
exports.getBuildArtifacts = getBuildArtifacts;
class BuildArtifacts {
    constructor(artifactsPaths) {
        this.sourcesToArtifacts = {};
        artifactsPaths.forEach(path => {
            const artifact = fs_extra_1.default.readJsonSync(path);
            const sourcePath = this.getSourcePathFromArtifact(artifact);
            this.registerArtifactForSourcePath(sourcePath, artifact);
        });
    }
    listSourcePaths() {
        return lodash_1.keys(this.sourcesToArtifacts);
    }
    listArtifacts() {
        return lodash_1.flatten(lodash_1.values(this.sourcesToArtifacts));
    }
    getArtifactByName(name) {
        return this.listArtifacts().find(a => a.contractName === name);
    }
    getArtifactsFromSourcePath(sourcePath) {
        return this.sourcesToArtifacts[sourcePath] || [];
    }
    getSourcePathFromArtifact(artifact) {
        return artifact.ast.absolutePath;
    }
    registerArtifactForSourcePath(sourcePath, artifact) {
        if (!this.sourcesToArtifacts[sourcePath])
            this.sourcesToArtifacts[sourcePath] = [];
        this.sourcesToArtifacts[sourcePath].push(artifact);
    }
}
exports.BuildArtifacts = BuildArtifacts;
//# sourceMappingURL=BuildArtifacts.js.map