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
const path_1 = require("path");
const fs_1 = __importDefault(require("fs"));
const util_1 = require("util");
const solidity_1 = require("../../../utils/solidity");
const is_url_1 = __importDefault(require("is-url"));
const find_up_1 = __importDefault(require("find-up"));
/**
 * Starts with roots and traverses the whole depedency tree of imports, returning an array of sources
 * @param rootContracts
 * @param workingDir What's the starting working dir for resolving relative imports in roots
 * @param resolver
 */
function gatherSources(rootContracts, workingDir) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = [];
        const queue = [];
        const alreadyProcessedUrls = new Set();
        for (const contract of rootContracts) {
            queue.push({
                name: path_1.relative(workingDir, contract),
                url: path_1.resolve(workingDir, contract),
                root: workingDir,
            });
        }
        while (queue.length > 0) {
            const fileToProcess = queue.shift();
            if (alreadyProcessedUrls.has(fileToProcess.url))
                continue;
            alreadyProcessedUrls.add(fileToProcess.url);
            const content = yield util_1.promisify(fs_1.default.readFile)(fileToProcess.url, 'utf-8');
            const fileWithContent = Object.assign(Object.assign({}, fileToProcess), { content: content.toString() });
            result.push(fileWithContent);
            const foundImports = tryGetImports(fileWithContent);
            for (const foundImport of foundImports) {
                const importStatement = { path: foundImport, importedFrom: fileToProcess };
                const resolvedImport = yield tryResolveImportFile(importStatement);
                if (resolvedImport !== undefined)
                    queue.push(resolvedImport);
            }
        }
        return result;
    });
}
exports.gatherSources = gatherSources;
function tryGetImports(resolvedFile) {
    try {
        return solidity_1.getImports(resolvedFile.content);
    }
    catch (_a) {
        // The are two reasons why the parser may crash:
        //  - the source is not valid Solidity code
        //  - the parser has a bug
        // Invalid source will be better diagnosed by the compiler, meaning we shouldn't halt execution so that it gets a
        // chance to inspect the source. A buggy parser will produce false negatives, but since we're not able to detect
        // that here, it makes more sense to fail loudly, hopefully leading to a bug report by a user.
        upgrades_1.Loggy.noSpin.warn(__filename, 'gatherSources', 'solidity-parser-warnings', `Error while parsing ${trimFile(resolvedFile.name)}`);
        return [];
    }
}
function tryResolveImportFile(importStatement) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            return yield resolveImportFile(importStatement);
        }
        catch (err) {
            // Our custom fuzzy parser may yield false positives, potentially asking for imports that don't exist. This can
            // happen both due to parser bugs and to invalid Solidity sources the parser accepts. Because of this, we carry on
            // to the compiler instead of erroring out: if an import is indeed missing or the code is incorrect, the compiler
            // will complain about this with a more accurate error message.
            upgrades_1.Loggy.noSpin.warn(__filename, 'gatherSources', 'compile-warnings', `${err.message}`);
        }
    });
}
function resolveImportFile({ path, importedFrom }) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        // We support the following import paths:
        // 1- An absolute path: /foo/bar/baz.sol
        // 2- A path relative to the current file: ../foo/bar.sol
        // 3- A path relative to the current project root: contracts/foo/bar.sol
        // 4- A path to a dependency: @openzeppelin/contracts/foo/bar.sol
        if (is_url_1.default(path)) {
            throw new Error(`Error resolving '${trimFile(path)}': URL imports are not supported`);
        }
        // 1- Absolute paths
        if (path_1.isAbsolute(path)) {
            if (yield fileExists(path)) {
                return Object.assign(Object.assign({}, importedFrom), { name: path, url: path });
            }
            else {
                throw new Error(`Could not find file '${trimFile(path)}'`);
            }
        }
        // 2- Relative paths
        if (path.startsWith('.')) {
            const url = path_1.resolve(path_1.dirname(importedFrom.url), path);
            if (yield fileExists(url)) {
                // If relativeTo is absolute, then url and name are the same
                // so the global name is absolute as well
                const name = path_1.isAbsolute(importedFrom.name) ? url : path_1.join(path_1.dirname(importedFrom.name), path);
                return Object.assign(Object.assign({}, importedFrom), { name, url });
            }
            else {
                throw new Error(`Could not find file ${trimFile(path)} relative to ${importedFrom.name} in project ${importedFrom.root}`);
            }
        }
        // 3- Path relative to project root
        const localUrl = path_1.join(importedFrom.root, path);
        if (yield fileExists(localUrl)) {
            const name = path_1.join((_a = importedFrom.dependency, (_a !== null && _a !== void 0 ? _a : '')), path);
            return Object.assign(Object.assign({}, importedFrom), { name, url: localUrl });
        }
        // 4- Path to dependency (only if previous one did not match)
        const dependencyUrl = resolveDependency(path, importedFrom);
        const dependencyRoot = yield find_up_1.default('package.json', { cwd: dependencyUrl });
        if (dependencyRoot === undefined)
            throw new Error(`Could not find package root for contract ${dependencyUrl}`);
        const dependencyName = require(dependencyRoot).name;
        return {
            name: path,
            dependency: dependencyName,
            url: dependencyUrl,
            root: path_1.dirname(dependencyRoot),
        };
    });
}
function resolveDependency(path, importedFrom) {
    try {
        return require.resolve(path, { paths: [importedFrom.root] });
    }
    catch (err) {
        throw new Error(`Could not find ${trimFile(path)} imported from ${importedFrom.url}`);
    }
}
function fileExists(file) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            return (yield util_1.promisify(fs_1.default.stat)(file)).isFile();
        }
        catch (err) {
            if (err.code === 'ENOENT')
                return false;
            throw err;
        }
    });
}
function trimFile(file) {
    return file.length < 100 ? file : file.substring(0, 100) + '...';
}
//# sourceMappingURL=SourcesGatherer.js.map