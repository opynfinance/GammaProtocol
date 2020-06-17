'use strict';

var _ExportMap = require('../ExportMap');

var _ExportMap2 = _interopRequireDefault(_ExportMap);

var _ignore = require('eslint-module-utils/ignore');

var _resolve = require('eslint-module-utils/resolve');

var _resolve2 = _interopRequireDefault(_resolve);

var _docsUrl = require('../docsUrl');

var _docsUrl2 = _interopRequireDefault(_docsUrl);

var _path = require('path');

var _readPkgUp = require('read-pkg-up');

var _readPkgUp2 = _interopRequireDefault(_readPkgUp);

var _object = require('object.values');

var _object2 = _interopRequireDefault(_object);

var _arrayIncludes = require('array-includes');

var _arrayIncludes2 = _interopRequireDefault(_arrayIncludes);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } } /**
                                                                                                                                                                                                 * @fileOverview Ensures that modules contain exports and/or all
                                                                                                                                                                                                 * modules are consumed within other modules.
                                                                                                                                                                                                 * @author René Fermann
                                                                                                                                                                                                 */

// eslint/lib/util/glob-util has been moved to eslint/lib/util/glob-utils with version 5.3
// and has been moved to eslint/lib/cli-engine/file-enumerator in version 6
let listFilesToProcess;
try {
  const FileEnumerator = require('eslint/lib/cli-engine/file-enumerator').FileEnumerator;
  listFilesToProcess = function (src, extensions) {
    const e = new FileEnumerator({
      extensions: extensions
    });
    return Array.from(e.iterateFiles(src), (_ref) => {
      let filePath = _ref.filePath,
          ignored = _ref.ignored;
      return {
        ignored,
        filename: filePath
      };
    });
  };
} catch (e1) {
  // Prevent passing invalid options (extensions array) to old versions of the function.
  // https://github.com/eslint/eslint/blob/v5.16.0/lib/util/glob-utils.js#L178-L280
  // https://github.com/eslint/eslint/blob/v5.2.0/lib/util/glob-util.js#L174-L269
  let originalListFilesToProcess;
  try {
    originalListFilesToProcess = require('eslint/lib/util/glob-utils').listFilesToProcess;
    listFilesToProcess = function (src, extensions) {
      return originalListFilesToProcess(src, {
        extensions: extensions
      });
    };
  } catch (e2) {
    originalListFilesToProcess = require('eslint/lib/util/glob-util').listFilesToProcess;

    listFilesToProcess = function (src, extensions) {
      const patterns = src.reduce((carry, pattern) => {
        return carry.concat(extensions.map(extension => {
          return (/\*\*|\*\./.test(pattern) ? pattern : `${pattern}/**/*${extension}`
          );
        }));
      }, src.slice());

      return originalListFilesToProcess(patterns);
    };
  }
}

const EXPORT_DEFAULT_DECLARATION = 'ExportDefaultDeclaration';
const EXPORT_NAMED_DECLARATION = 'ExportNamedDeclaration';
const EXPORT_ALL_DECLARATION = 'ExportAllDeclaration';
const IMPORT_DECLARATION = 'ImportDeclaration';
const IMPORT_NAMESPACE_SPECIFIER = 'ImportNamespaceSpecifier';
const IMPORT_DEFAULT_SPECIFIER = 'ImportDefaultSpecifier';
const VARIABLE_DECLARATION = 'VariableDeclaration';
const FUNCTION_DECLARATION = 'FunctionDeclaration';
const CLASS_DECLARATION = 'ClassDeclaration';
const DEFAULT = 'default';

/**
 * List of imports per file.
 *
 * Represented by a two-level Map to a Set of identifiers. The upper-level Map
 * keys are the paths to the modules containing the imports, while the
 * lower-level Map keys are the paths to the files which are being imported
 * from. Lastly, the Set of identifiers contains either names being imported
 * or a special AST node name listed above (e.g ImportDefaultSpecifier).
 *
 * For example, if we have a file named foo.js containing:
 *
 *   import { o2 } from './bar.js';
 *
 * Then we will have a structure that looks like:
 *
 *   Map { 'foo.js' => Map { 'bar.js' => Set { 'o2' } } }
 *
 * @type {Map<string, Map<string, Set<string>>>}
 */
const importList = new Map();

/**
 * List of exports per file.
 *
 * Represented by a two-level Map to an object of metadata. The upper-level Map
 * keys are the paths to the modules containing the exports, while the
 * lower-level Map keys are the specific identifiers or special AST node names
 * being exported. The leaf-level metadata object at the moment only contains a
 * `whereUsed` propoerty, which contains a Set of paths to modules that import
 * the name.
 *
 * For example, if we have a file named bar.js containing the following exports:
 *
 *   const o2 = 'bar';
 *   export { o2 };
 *
 * And a file named foo.js containing the following import:
 *
 *   import { o2 } from './bar.js';
 *
 * Then we will have a structure that looks like:
 *
 *   Map { 'bar.js' => Map { 'o2' => { whereUsed: Set { 'foo.js' } } } }
 *
 * @type {Map<string, Map<string, object>>}
 */
const exportList = new Map();

const ignoredFiles = new Set();
const filesOutsideSrc = new Set();

const isNodeModule = path => {
  return (/\/(node_modules)\//.test(path)
  );
};

/**
 * read all files matching the patterns in src and ignoreExports
 *
 * return all files matching src pattern, which are not matching the ignoreExports pattern
 */
const resolveFiles = (src, ignoreExports, context) => {
  const extensions = Array.from((0, _ignore.getFileExtensions)(context.settings));

  const srcFiles = new Set();
  const srcFileList = listFilesToProcess(src, extensions);

  // prepare list of ignored files
  const ignoredFilesList = listFilesToProcess(ignoreExports, extensions);
  ignoredFilesList.forEach((_ref2) => {
    let filename = _ref2.filename;
    return ignoredFiles.add(filename);
  });

  // prepare list of source files, don't consider files from node_modules
  srcFileList.filter((_ref3) => {
    let filename = _ref3.filename;
    return !isNodeModule(filename);
  }).forEach((_ref4) => {
    let filename = _ref4.filename;

    srcFiles.add(filename);
  });
  return srcFiles;
};

/**
 * parse all source files and build up 2 maps containing the existing imports and exports
 */
const prepareImportsAndExports = (srcFiles, context) => {
  const exportAll = new Map();
  srcFiles.forEach(file => {
    const exports = new Map();
    const imports = new Map();
    const currentExports = _ExportMap2.default.get(file, context);
    if (currentExports) {
      const dependencies = currentExports.dependencies,
            reexports = currentExports.reexports,
            localImportList = currentExports.imports,
            namespace = currentExports.namespace;

      // dependencies === export * from

      const currentExportAll = new Set();
      dependencies.forEach(getDependency => {
        const dependency = getDependency();
        if (dependency === null) {
          return;
        }

        currentExportAll.add(dependency.path);
      });
      exportAll.set(file, currentExportAll);

      reexports.forEach((value, key) => {
        if (key === DEFAULT) {
          exports.set(IMPORT_DEFAULT_SPECIFIER, { whereUsed: new Set() });
        } else {
          exports.set(key, { whereUsed: new Set() });
        }
        const reexport = value.getImport();
        if (!reexport) {
          return;
        }
        let localImport = imports.get(reexport.path);
        let currentValue;
        if (value.local === DEFAULT) {
          currentValue = IMPORT_DEFAULT_SPECIFIER;
        } else {
          currentValue = value.local;
        }
        if (typeof localImport !== 'undefined') {
          localImport = new Set([].concat(_toConsumableArray(localImport), [currentValue]));
        } else {
          localImport = new Set([currentValue]);
        }
        imports.set(reexport.path, localImport);
      });

      localImportList.forEach((value, key) => {
        if (isNodeModule(key)) {
          return;
        }
        let localImport = imports.get(key);
        if (typeof localImport !== 'undefined') {
          localImport = new Set([].concat(_toConsumableArray(localImport), _toConsumableArray(value.importedSpecifiers)));
        } else {
          localImport = value.importedSpecifiers;
        }
        imports.set(key, localImport);
      });
      importList.set(file, imports);

      // build up export list only, if file is not ignored
      if (ignoredFiles.has(file)) {
        return;
      }
      namespace.forEach((value, key) => {
        if (key === DEFAULT) {
          exports.set(IMPORT_DEFAULT_SPECIFIER, { whereUsed: new Set() });
        } else {
          exports.set(key, { whereUsed: new Set() });
        }
      });
    }
    exports.set(EXPORT_ALL_DECLARATION, { whereUsed: new Set() });
    exports.set(IMPORT_NAMESPACE_SPECIFIER, { whereUsed: new Set() });
    exportList.set(file, exports);
  });
  exportAll.forEach((value, key) => {
    value.forEach(val => {
      const currentExports = exportList.get(val);
      const currentExport = currentExports.get(EXPORT_ALL_DECLARATION);
      currentExport.whereUsed.add(key);
    });
  });
};

/**
 * traverse through all imports and add the respective path to the whereUsed-list
 * of the corresponding export
 */
const determineUsage = () => {
  importList.forEach((listValue, listKey) => {
    listValue.forEach((value, key) => {
      const exports = exportList.get(key);
      if (typeof exports !== 'undefined') {
        value.forEach(currentImport => {
          let specifier;
          if (currentImport === IMPORT_NAMESPACE_SPECIFIER) {
            specifier = IMPORT_NAMESPACE_SPECIFIER;
          } else if (currentImport === IMPORT_DEFAULT_SPECIFIER) {
            specifier = IMPORT_DEFAULT_SPECIFIER;
          } else {
            specifier = currentImport;
          }
          if (typeof specifier !== 'undefined') {
            const exportStatement = exports.get(specifier);
            if (typeof exportStatement !== 'undefined') {
              const whereUsed = exportStatement.whereUsed;

              whereUsed.add(listKey);
              exports.set(specifier, { whereUsed });
            }
          }
        });
      }
    });
  });
};

const getSrc = src => {
  if (src) {
    return src;
  }
  return [process.cwd()];
};

/**
 * prepare the lists of existing imports and exports - should only be executed once at
 * the start of a new eslint run
 */
let srcFiles;
let lastPrepareKey;
const doPreparation = (src, ignoreExports, context) => {
  const prepareKey = JSON.stringify({
    src: (src || []).sort(),
    ignoreExports: (ignoreExports || []).sort(),
    extensions: Array.from((0, _ignore.getFileExtensions)(context.settings)).sort()
  });
  if (prepareKey === lastPrepareKey) {
    return;
  }

  importList.clear();
  exportList.clear();
  ignoredFiles.clear();
  filesOutsideSrc.clear();

  srcFiles = resolveFiles(getSrc(src), ignoreExports, context);
  prepareImportsAndExports(srcFiles, context);
  determineUsage();
  lastPrepareKey = prepareKey;
};

const newNamespaceImportExists = specifiers => specifiers.some((_ref5) => {
  let type = _ref5.type;
  return type === IMPORT_NAMESPACE_SPECIFIER;
});

const newDefaultImportExists = specifiers => specifiers.some((_ref6) => {
  let type = _ref6.type;
  return type === IMPORT_DEFAULT_SPECIFIER;
});

const fileIsInPkg = file => {
  var _readPkgUp$sync = _readPkgUp2.default.sync({ cwd: file, normalize: false });

  const path = _readPkgUp$sync.path,
        pkg = _readPkgUp$sync.pkg;

  const basePath = (0, _path.dirname)(path);

  const checkPkgFieldString = pkgField => {
    if ((0, _path.join)(basePath, pkgField) === file) {
      return true;
    }
  };

  const checkPkgFieldObject = pkgField => {
    const pkgFieldFiles = (0, _object2.default)(pkgField).map(value => (0, _path.join)(basePath, value));
    if ((0, _arrayIncludes2.default)(pkgFieldFiles, file)) {
      return true;
    }
  };

  const checkPkgField = pkgField => {
    if (typeof pkgField === 'string') {
      return checkPkgFieldString(pkgField);
    }

    if (typeof pkgField === 'object') {
      return checkPkgFieldObject(pkgField);
    }
  };

  if (pkg.private === true) {
    return false;
  }

  if (pkg.bin) {
    if (checkPkgField(pkg.bin)) {
      return true;
    }
  }

  if (pkg.browser) {
    if (checkPkgField(pkg.browser)) {
      return true;
    }
  }

  if (pkg.main) {
    if (checkPkgFieldString(pkg.main)) {
      return true;
    }
  }

  return false;
};

module.exports = {
  meta: {
    type: 'suggestion',
    docs: { url: (0, _docsUrl2.default)('no-unused-modules') },
    schema: [{
      properties: {
        src: {
          description: 'files/paths to be analyzed (only for unused exports)',
          type: 'array',
          minItems: 1,
          items: {
            type: 'string',
            minLength: 1
          }
        },
        ignoreExports: {
          description: 'files/paths for which unused exports will not be reported (e.g module entry points)',
          type: 'array',
          minItems: 1,
          items: {
            type: 'string',
            minLength: 1
          }
        },
        missingExports: {
          description: 'report modules without any exports',
          type: 'boolean'
        },
        unusedExports: {
          description: 'report exports without any usage',
          type: 'boolean'
        }
      },
      not: {
        properties: {
          unusedExports: { enum: [false] },
          missingExports: { enum: [false] }
        }
      },
      anyOf: [{
        not: {
          properties: {
            unusedExports: { enum: [true] }
          }
        },
        required: ['missingExports']
      }, {
        not: {
          properties: {
            missingExports: { enum: [true] }
          }
        },
        required: ['unusedExports']
      }, {
        properties: {
          unusedExports: { enum: [true] }
        },
        required: ['unusedExports']
      }, {
        properties: {
          missingExports: { enum: [true] }
        },
        required: ['missingExports']
      }]
    }]
  },

  create: context => {
    var _ref7 = context.options[0] || {};

    const src = _ref7.src;
    var _ref7$ignoreExports = _ref7.ignoreExports;
    const ignoreExports = _ref7$ignoreExports === undefined ? [] : _ref7$ignoreExports,
          missingExports = _ref7.missingExports,
          unusedExports = _ref7.unusedExports;


    if (unusedExports) {
      doPreparation(src, ignoreExports, context);
    }

    const file = context.getFilename();

    const checkExportPresence = node => {
      if (!missingExports) {
        return;
      }

      if (ignoredFiles.has(file)) {
        return;
      }

      const exportCount = exportList.get(file);
      const exportAll = exportCount.get(EXPORT_ALL_DECLARATION);
      const namespaceImports = exportCount.get(IMPORT_NAMESPACE_SPECIFIER);

      exportCount.delete(EXPORT_ALL_DECLARATION);
      exportCount.delete(IMPORT_NAMESPACE_SPECIFIER);
      if (exportCount.size < 1) {
        // node.body[0] === 'undefined' only happens, if everything is commented out in the file
        // being linted
        context.report(node.body[0] ? node.body[0] : node, 'No exports found');
      }
      exportCount.set(EXPORT_ALL_DECLARATION, exportAll);
      exportCount.set(IMPORT_NAMESPACE_SPECIFIER, namespaceImports);
    };

    const checkUsage = (node, exportedValue) => {
      if (!unusedExports) {
        return;
      }

      if (ignoredFiles.has(file)) {
        return;
      }

      if (fileIsInPkg(file)) {
        return;
      }

      if (filesOutsideSrc.has(file)) {
        return;
      }

      // make sure file to be linted is included in source files
      if (!srcFiles.has(file)) {
        srcFiles = resolveFiles(getSrc(src), ignoreExports, context);
        if (!srcFiles.has(file)) {
          filesOutsideSrc.add(file);
          return;
        }
      }

      exports = exportList.get(file);

      // special case: export * from
      const exportAll = exports.get(EXPORT_ALL_DECLARATION);
      if (typeof exportAll !== 'undefined' && exportedValue !== IMPORT_DEFAULT_SPECIFIER) {
        if (exportAll.whereUsed.size > 0) {
          return;
        }
      }

      // special case: namespace import
      const namespaceImports = exports.get(IMPORT_NAMESPACE_SPECIFIER);
      if (typeof namespaceImports !== 'undefined') {
        if (namespaceImports.whereUsed.size > 0) {
          return;
        }
      }

      // exportsList will always map any imported value of 'default' to 'ImportDefaultSpecifier'
      const exportsKey = exportedValue === DEFAULT ? IMPORT_DEFAULT_SPECIFIER : exportedValue;

      const exportStatement = exports.get(exportsKey);

      const value = exportsKey === IMPORT_DEFAULT_SPECIFIER ? DEFAULT : exportsKey;

      if (typeof exportStatement !== 'undefined') {
        if (exportStatement.whereUsed.size < 1) {
          context.report(node, `exported declaration '${value}' not used within other modules`);
        }
      } else {
        context.report(node, `exported declaration '${value}' not used within other modules`);
      }
    };

    /**
     * only useful for tools like vscode-eslint
     *
     * update lists of existing exports during runtime
     */
    const updateExportUsage = node => {
      if (ignoredFiles.has(file)) {
        return;
      }

      let exports = exportList.get(file);

      // new module has been created during runtime
      // include it in further processing
      if (typeof exports === 'undefined') {
        exports = new Map();
      }

      const newExports = new Map();
      const newExportIdentifiers = new Set();

      node.body.forEach((_ref8) => {
        let type = _ref8.type,
            declaration = _ref8.declaration,
            specifiers = _ref8.specifiers;

        if (type === EXPORT_DEFAULT_DECLARATION) {
          newExportIdentifiers.add(IMPORT_DEFAULT_SPECIFIER);
        }
        if (type === EXPORT_NAMED_DECLARATION) {
          if (specifiers.length > 0) {
            specifiers.forEach(specifier => {
              if (specifier.exported) {
                newExportIdentifiers.add(specifier.exported.name);
              }
            });
          }
          if (declaration) {
            if (declaration.type === FUNCTION_DECLARATION || declaration.type === CLASS_DECLARATION) {
              newExportIdentifiers.add(declaration.id.name);
            }
            if (declaration.type === VARIABLE_DECLARATION) {
              declaration.declarations.forEach((_ref9) => {
                let id = _ref9.id;

                newExportIdentifiers.add(id.name);
              });
            }
          }
        }
      });

      // old exports exist within list of new exports identifiers: add to map of new exports
      exports.forEach((value, key) => {
        if (newExportIdentifiers.has(key)) {
          newExports.set(key, value);
        }
      });

      // new export identifiers added: add to map of new exports
      newExportIdentifiers.forEach(key => {
        if (!exports.has(key)) {
          newExports.set(key, { whereUsed: new Set() });
        }
      });

      // preserve information about namespace imports
      let exportAll = exports.get(EXPORT_ALL_DECLARATION);
      let namespaceImports = exports.get(IMPORT_NAMESPACE_SPECIFIER);

      if (typeof namespaceImports === 'undefined') {
        namespaceImports = { whereUsed: new Set() };
      }

      newExports.set(EXPORT_ALL_DECLARATION, exportAll);
      newExports.set(IMPORT_NAMESPACE_SPECIFIER, namespaceImports);
      exportList.set(file, newExports);
    };

    /**
     * only useful for tools like vscode-eslint
     *
     * update lists of existing imports during runtime
     */
    const updateImportUsage = node => {
      if (!unusedExports) {
        return;
      }

      let oldImportPaths = importList.get(file);
      if (typeof oldImportPaths === 'undefined') {
        oldImportPaths = new Map();
      }

      const oldNamespaceImports = new Set();
      const newNamespaceImports = new Set();

      const oldExportAll = new Set();
      const newExportAll = new Set();

      const oldDefaultImports = new Set();
      const newDefaultImports = new Set();

      const oldImports = new Map();
      const newImports = new Map();
      oldImportPaths.forEach((value, key) => {
        if (value.has(EXPORT_ALL_DECLARATION)) {
          oldExportAll.add(key);
        }
        if (value.has(IMPORT_NAMESPACE_SPECIFIER)) {
          oldNamespaceImports.add(key);
        }
        if (value.has(IMPORT_DEFAULT_SPECIFIER)) {
          oldDefaultImports.add(key);
        }
        value.forEach(val => {
          if (val !== IMPORT_NAMESPACE_SPECIFIER && val !== IMPORT_DEFAULT_SPECIFIER) {
            oldImports.set(val, key);
          }
        });
      });

      node.body.forEach(astNode => {
        let resolvedPath;

        // support for export { value } from 'module'
        if (astNode.type === EXPORT_NAMED_DECLARATION) {
          if (astNode.source) {
            resolvedPath = (0, _resolve2.default)(astNode.source.raw.replace(/('|")/g, ''), context);
            astNode.specifiers.forEach(specifier => {
              const name = specifier.local.name;
              if (specifier.local.name === DEFAULT) {
                newDefaultImports.add(resolvedPath);
              } else {
                newImports.set(name, resolvedPath);
              }
            });
          }
        }

        if (astNode.type === EXPORT_ALL_DECLARATION) {
          resolvedPath = (0, _resolve2.default)(astNode.source.raw.replace(/('|")/g, ''), context);
          newExportAll.add(resolvedPath);
        }

        if (astNode.type === IMPORT_DECLARATION) {
          resolvedPath = (0, _resolve2.default)(astNode.source.raw.replace(/('|")/g, ''), context);
          if (!resolvedPath) {
            return;
          }

          if (isNodeModule(resolvedPath)) {
            return;
          }

          if (newNamespaceImportExists(astNode.specifiers)) {
            newNamespaceImports.add(resolvedPath);
          }

          if (newDefaultImportExists(astNode.specifiers)) {
            newDefaultImports.add(resolvedPath);
          }

          astNode.specifiers.forEach(specifier => {
            if (specifier.type === IMPORT_DEFAULT_SPECIFIER || specifier.type === IMPORT_NAMESPACE_SPECIFIER) {
              return;
            }
            newImports.set(specifier.imported.name, resolvedPath);
          });
        }
      });

      newExportAll.forEach(value => {
        if (!oldExportAll.has(value)) {
          let imports = oldImportPaths.get(value);
          if (typeof imports === 'undefined') {
            imports = new Set();
          }
          imports.add(EXPORT_ALL_DECLARATION);
          oldImportPaths.set(value, imports);

          let exports = exportList.get(value);
          let currentExport;
          if (typeof exports !== 'undefined') {
            currentExport = exports.get(EXPORT_ALL_DECLARATION);
          } else {
            exports = new Map();
            exportList.set(value, exports);
          }

          if (typeof currentExport !== 'undefined') {
            currentExport.whereUsed.add(file);
          } else {
            const whereUsed = new Set();
            whereUsed.add(file);
            exports.set(EXPORT_ALL_DECLARATION, { whereUsed });
          }
        }
      });

      oldExportAll.forEach(value => {
        if (!newExportAll.has(value)) {
          const imports = oldImportPaths.get(value);
          imports.delete(EXPORT_ALL_DECLARATION);

          const exports = exportList.get(value);
          if (typeof exports !== 'undefined') {
            const currentExport = exports.get(EXPORT_ALL_DECLARATION);
            if (typeof currentExport !== 'undefined') {
              currentExport.whereUsed.delete(file);
            }
          }
        }
      });

      newDefaultImports.forEach(value => {
        if (!oldDefaultImports.has(value)) {
          let imports = oldImportPaths.get(value);
          if (typeof imports === 'undefined') {
            imports = new Set();
          }
          imports.add(IMPORT_DEFAULT_SPECIFIER);
          oldImportPaths.set(value, imports);

          let exports = exportList.get(value);
          let currentExport;
          if (typeof exports !== 'undefined') {
            currentExport = exports.get(IMPORT_DEFAULT_SPECIFIER);
          } else {
            exports = new Map();
            exportList.set(value, exports);
          }

          if (typeof currentExport !== 'undefined') {
            currentExport.whereUsed.add(file);
          } else {
            const whereUsed = new Set();
            whereUsed.add(file);
            exports.set(IMPORT_DEFAULT_SPECIFIER, { whereUsed });
          }
        }
      });

      oldDefaultImports.forEach(value => {
        if (!newDefaultImports.has(value)) {
          const imports = oldImportPaths.get(value);
          imports.delete(IMPORT_DEFAULT_SPECIFIER);

          const exports = exportList.get(value);
          if (typeof exports !== 'undefined') {
            const currentExport = exports.get(IMPORT_DEFAULT_SPECIFIER);
            if (typeof currentExport !== 'undefined') {
              currentExport.whereUsed.delete(file);
            }
          }
        }
      });

      newNamespaceImports.forEach(value => {
        if (!oldNamespaceImports.has(value)) {
          let imports = oldImportPaths.get(value);
          if (typeof imports === 'undefined') {
            imports = new Set();
          }
          imports.add(IMPORT_NAMESPACE_SPECIFIER);
          oldImportPaths.set(value, imports);

          let exports = exportList.get(value);
          let currentExport;
          if (typeof exports !== 'undefined') {
            currentExport = exports.get(IMPORT_NAMESPACE_SPECIFIER);
          } else {
            exports = new Map();
            exportList.set(value, exports);
          }

          if (typeof currentExport !== 'undefined') {
            currentExport.whereUsed.add(file);
          } else {
            const whereUsed = new Set();
            whereUsed.add(file);
            exports.set(IMPORT_NAMESPACE_SPECIFIER, { whereUsed });
          }
        }
      });

      oldNamespaceImports.forEach(value => {
        if (!newNamespaceImports.has(value)) {
          const imports = oldImportPaths.get(value);
          imports.delete(IMPORT_NAMESPACE_SPECIFIER);

          const exports = exportList.get(value);
          if (typeof exports !== 'undefined') {
            const currentExport = exports.get(IMPORT_NAMESPACE_SPECIFIER);
            if (typeof currentExport !== 'undefined') {
              currentExport.whereUsed.delete(file);
            }
          }
        }
      });

      newImports.forEach((value, key) => {
        if (!oldImports.has(key)) {
          let imports = oldImportPaths.get(value);
          if (typeof imports === 'undefined') {
            imports = new Set();
          }
          imports.add(key);
          oldImportPaths.set(value, imports);

          let exports = exportList.get(value);
          let currentExport;
          if (typeof exports !== 'undefined') {
            currentExport = exports.get(key);
          } else {
            exports = new Map();
            exportList.set(value, exports);
          }

          if (typeof currentExport !== 'undefined') {
            currentExport.whereUsed.add(file);
          } else {
            const whereUsed = new Set();
            whereUsed.add(file);
            exports.set(key, { whereUsed });
          }
        }
      });

      oldImports.forEach((value, key) => {
        if (!newImports.has(key)) {
          const imports = oldImportPaths.get(value);
          imports.delete(key);

          const exports = exportList.get(value);
          if (typeof exports !== 'undefined') {
            const currentExport = exports.get(key);
            if (typeof currentExport !== 'undefined') {
              currentExport.whereUsed.delete(file);
            }
          }
        }
      });
    };

    return {
      'Program:exit': node => {
        updateExportUsage(node);
        updateImportUsage(node);
        checkExportPresence(node);
      },
      'ExportDefaultDeclaration': node => {
        checkUsage(node, IMPORT_DEFAULT_SPECIFIER);
      },
      'ExportNamedDeclaration': node => {
        node.specifiers.forEach(specifier => {
          checkUsage(node, specifier.exported.name);
        });
        if (node.declaration) {
          if (node.declaration.type === FUNCTION_DECLARATION || node.declaration.type === CLASS_DECLARATION) {
            checkUsage(node, node.declaration.id.name);
          }
          if (node.declaration.type === VARIABLE_DECLARATION) {
            node.declaration.declarations.forEach(declaration => {
              checkUsage(node, declaration.id.name);
            });
          }
        }
      }
    };
  }
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9ydWxlcy9uby11bnVzZWQtbW9kdWxlcy5qcyJdLCJuYW1lcyI6WyJsaXN0RmlsZXNUb1Byb2Nlc3MiLCJGaWxlRW51bWVyYXRvciIsInJlcXVpcmUiLCJzcmMiLCJleHRlbnNpb25zIiwiZSIsIkFycmF5IiwiZnJvbSIsIml0ZXJhdGVGaWxlcyIsImZpbGVQYXRoIiwiaWdub3JlZCIsImZpbGVuYW1lIiwiZTEiLCJvcmlnaW5hbExpc3RGaWxlc1RvUHJvY2VzcyIsImUyIiwicGF0dGVybnMiLCJyZWR1Y2UiLCJjYXJyeSIsInBhdHRlcm4iLCJjb25jYXQiLCJtYXAiLCJleHRlbnNpb24iLCJ0ZXN0Iiwic2xpY2UiLCJFWFBPUlRfREVGQVVMVF9ERUNMQVJBVElPTiIsIkVYUE9SVF9OQU1FRF9ERUNMQVJBVElPTiIsIkVYUE9SVF9BTExfREVDTEFSQVRJT04iLCJJTVBPUlRfREVDTEFSQVRJT04iLCJJTVBPUlRfTkFNRVNQQUNFX1NQRUNJRklFUiIsIklNUE9SVF9ERUZBVUxUX1NQRUNJRklFUiIsIlZBUklBQkxFX0RFQ0xBUkFUSU9OIiwiRlVOQ1RJT05fREVDTEFSQVRJT04iLCJDTEFTU19ERUNMQVJBVElPTiIsIkRFRkFVTFQiLCJpbXBvcnRMaXN0IiwiTWFwIiwiZXhwb3J0TGlzdCIsImlnbm9yZWRGaWxlcyIsIlNldCIsImZpbGVzT3V0c2lkZVNyYyIsImlzTm9kZU1vZHVsZSIsInBhdGgiLCJyZXNvbHZlRmlsZXMiLCJpZ25vcmVFeHBvcnRzIiwiY29udGV4dCIsInNldHRpbmdzIiwic3JjRmlsZXMiLCJzcmNGaWxlTGlzdCIsImlnbm9yZWRGaWxlc0xpc3QiLCJmb3JFYWNoIiwiYWRkIiwiZmlsdGVyIiwicHJlcGFyZUltcG9ydHNBbmRFeHBvcnRzIiwiZXhwb3J0QWxsIiwiZmlsZSIsImV4cG9ydHMiLCJpbXBvcnRzIiwiY3VycmVudEV4cG9ydHMiLCJFeHBvcnRzIiwiZ2V0IiwiZGVwZW5kZW5jaWVzIiwicmVleHBvcnRzIiwibG9jYWxJbXBvcnRMaXN0IiwibmFtZXNwYWNlIiwiY3VycmVudEV4cG9ydEFsbCIsImdldERlcGVuZGVuY3kiLCJkZXBlbmRlbmN5Iiwic2V0IiwidmFsdWUiLCJrZXkiLCJ3aGVyZVVzZWQiLCJyZWV4cG9ydCIsImdldEltcG9ydCIsImxvY2FsSW1wb3J0IiwiY3VycmVudFZhbHVlIiwibG9jYWwiLCJpbXBvcnRlZFNwZWNpZmllcnMiLCJoYXMiLCJ2YWwiLCJjdXJyZW50RXhwb3J0IiwiZGV0ZXJtaW5lVXNhZ2UiLCJsaXN0VmFsdWUiLCJsaXN0S2V5IiwiY3VycmVudEltcG9ydCIsInNwZWNpZmllciIsImV4cG9ydFN0YXRlbWVudCIsImdldFNyYyIsInByb2Nlc3MiLCJjd2QiLCJsYXN0UHJlcGFyZUtleSIsImRvUHJlcGFyYXRpb24iLCJwcmVwYXJlS2V5IiwiSlNPTiIsInN0cmluZ2lmeSIsInNvcnQiLCJjbGVhciIsIm5ld05hbWVzcGFjZUltcG9ydEV4aXN0cyIsInNwZWNpZmllcnMiLCJzb21lIiwidHlwZSIsIm5ld0RlZmF1bHRJbXBvcnRFeGlzdHMiLCJmaWxlSXNJblBrZyIsInJlYWRQa2dVcCIsInN5bmMiLCJub3JtYWxpemUiLCJwa2ciLCJiYXNlUGF0aCIsImNoZWNrUGtnRmllbGRTdHJpbmciLCJwa2dGaWVsZCIsImNoZWNrUGtnRmllbGRPYmplY3QiLCJwa2dGaWVsZEZpbGVzIiwiY2hlY2tQa2dGaWVsZCIsInByaXZhdGUiLCJiaW4iLCJicm93c2VyIiwibWFpbiIsIm1vZHVsZSIsIm1ldGEiLCJkb2NzIiwidXJsIiwic2NoZW1hIiwicHJvcGVydGllcyIsImRlc2NyaXB0aW9uIiwibWluSXRlbXMiLCJpdGVtcyIsIm1pbkxlbmd0aCIsIm1pc3NpbmdFeHBvcnRzIiwidW51c2VkRXhwb3J0cyIsIm5vdCIsImVudW0iLCJhbnlPZiIsInJlcXVpcmVkIiwiY3JlYXRlIiwib3B0aW9ucyIsImdldEZpbGVuYW1lIiwiY2hlY2tFeHBvcnRQcmVzZW5jZSIsIm5vZGUiLCJleHBvcnRDb3VudCIsIm5hbWVzcGFjZUltcG9ydHMiLCJkZWxldGUiLCJzaXplIiwicmVwb3J0IiwiYm9keSIsImNoZWNrVXNhZ2UiLCJleHBvcnRlZFZhbHVlIiwiZXhwb3J0c0tleSIsInVwZGF0ZUV4cG9ydFVzYWdlIiwibmV3RXhwb3J0cyIsIm5ld0V4cG9ydElkZW50aWZpZXJzIiwiZGVjbGFyYXRpb24iLCJsZW5ndGgiLCJleHBvcnRlZCIsIm5hbWUiLCJpZCIsImRlY2xhcmF0aW9ucyIsInVwZGF0ZUltcG9ydFVzYWdlIiwib2xkSW1wb3J0UGF0aHMiLCJvbGROYW1lc3BhY2VJbXBvcnRzIiwibmV3TmFtZXNwYWNlSW1wb3J0cyIsIm9sZEV4cG9ydEFsbCIsIm5ld0V4cG9ydEFsbCIsIm9sZERlZmF1bHRJbXBvcnRzIiwibmV3RGVmYXVsdEltcG9ydHMiLCJvbGRJbXBvcnRzIiwibmV3SW1wb3J0cyIsImFzdE5vZGUiLCJyZXNvbHZlZFBhdGgiLCJzb3VyY2UiLCJyYXciLCJyZXBsYWNlIiwiaW1wb3J0ZWQiXSwibWFwcGluZ3MiOiI7O0FBTUE7Ozs7QUFDQTs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7Ozs7Z01BYkE7Ozs7OztBQWVBO0FBQ0E7QUFDQSxJQUFJQSxrQkFBSjtBQUNBLElBQUk7QUFDRixRQUFNQyxpQkFBaUJDLFFBQVEsdUNBQVIsRUFBaURELGNBQXhFO0FBQ0FELHVCQUFxQixVQUFVRyxHQUFWLEVBQWVDLFVBQWYsRUFBMkI7QUFDOUMsVUFBTUMsSUFBSSxJQUFJSixjQUFKLENBQW1CO0FBQzNCRyxrQkFBWUE7QUFEZSxLQUFuQixDQUFWO0FBR0EsV0FBT0UsTUFBTUMsSUFBTixDQUFXRixFQUFFRyxZQUFGLENBQWVMLEdBQWYsQ0FBWCxFQUFnQztBQUFBLFVBQUdNLFFBQUgsUUFBR0EsUUFBSDtBQUFBLFVBQWFDLE9BQWIsUUFBYUEsT0FBYjtBQUFBLGFBQTRCO0FBQ2pFQSxlQURpRTtBQUVqRUMsa0JBQVVGO0FBRnVELE9BQTVCO0FBQUEsS0FB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S2EsV0FBTCxDQUFpQmxELElBQWpCLEtBQTBCcEUsb0JBQTFCLElBQ0F5RyxLQUFLYSxXQUFMLENBQWlCbEQsSUFBakIsS0FBMEJuRSxpQkFGNUIsRUFHRTtBQUNBK0csdUJBQVdQLElBQVgsRUFBaUJBLEtBQUthLFdBQUwsQ0FBaUJJLEVBQWpCLENBQW9CRCxJQUFyQztBQUNEO0FBQ0QsY0FBSWhCLEtBQUthLFdBQUwsQ0FBaUJsRCxJQUFqQixLQUEwQnJFLG9CQUE5QixFQUFvRDtBQUNsRDBHLGlCQUFLYSxXQUFMLENBQWlCSyxZQUFqQixDQUE4QnpHLE9BQTlCLENBQXNDb0csZUFBZTtBQUNuRE4seUJBQVdQLElBQVgsRUFBaUJhLFlBQVlJLEVBQVosQ0FBZUQsSUFBaEM7QUFDRCxhQUZEO0FBR0Q7QUFDRjtBQUNGO0FBMUJJLEtBQVA7QUE0QkQ7QUFoaUJjLENBQWpCIiwiZmlsZSI6Im5vLXVudXNlZC1tb2R1bGVzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAZmlsZU92ZXJ2aWV3IEVuc3VyZXMgdGhhdCBtb2R1bGVzIGNvbnRhaW4gZXhwb3J0cyBhbmQvb3IgYWxsXG4gKiBtb2R1bGVzIGFyZSBjb25zdW1lZCB3aXRoaW4gb3RoZXIgbW9kdWxlcy5cbiAqIEBhdXRob3IgUmVuw6kgRmVybWFublxuICovXG5cbmltcG9ydCBFeHBvcnRzIGZyb20gJy4uL0V4cG9ydE1hcCdcbmltcG9ydCB7IGdldEZpbGVFeHRlbnNpb25zIH0gZnJvbSAnZXNsaW50LW1vZHVsZS11dGlscy9pZ25vcmUnXG5pbXBvcnQgcmVzb2x2ZSBmcm9tICdlc2xpbnQtbW9kdWxlLXV0aWxzL3Jlc29sdmUnXG5pbXBvcnQgZG9jc1VybCBmcm9tICcuLi9kb2NzVXJsJ1xuaW1wb3J0IHsgZGlybmFtZSwgam9pbiB9IGZyb20gJ3BhdGgnXG5pbXBvcnQgcmVhZFBrZ1VwIGZyb20gJ3JlYWQtcGtnLXVwJ1xuaW1wb3J0IHZhbHVlcyBmcm9tICdvYmplY3QudmFsdWVzJ1xuaW1wb3J0IGluY2x1ZGVzIGZyb20gJ2FycmF5LWluY2x1ZGVzJ1xuXG4vLyBlc2xpbnQvbGliL3V0aWwvZ2xvYi11dGlsIGhhcyBiZWVuIG1vdmVkIHRvIGVzbGludC9saWIvdXRpbC9nbG9iLXV0aWxzIHdpdGggdmVyc2lvbiA1LjNcbi8vIGFuZCBoYXMgYmVlbiBtb3ZlZCB0byBlc2xpbnQvbGliL2NsaS1lbmdpbmUvZmlsZS1lbnVtZXJhdG9yIGluIHZlcnNpb24gNlxubGV0IGxpc3RGaWxlc1RvUHJvY2Vzc1xudHJ5IHtcbiAgY29uc3QgRmlsZUVudW1lcmF0b3IgPSByZXF1aXJlKCdlc2xpbnQvbGliL2NsaS1lbmdpbmUvZmlsZS1lbnVtZXJhdG9yJykuRmlsZUVudW1lcmF0b3JcbiAgbGlzdEZpbGVzVG9Qcm9jZXNzID0gZnVuY3Rpb24gKHNyYywgZXh0ZW5zaW9ucykge1xuICAgIGNvbnN0IGUgPSBuZXcgRmlsZUVudW1lcmF0b3Ioe1xuICAgICAgZXh0ZW5zaW9uczogZXh0ZW5zaW9ucyxcbiAgICB9KVxuICAgIHJldHVybiBBcnJheS5mcm9tKGUuaXRlcmF0ZUZpbGVzKHNyYyksICh7IGZpbGVQYXRoLCBpZ25vcmVkIH0pID0+ICh7XG4gICAgICBpZ25vcmVkLFxuICAgICAgZmlsZW5hbWU6IGZpbGVQYXRoLFxuICAgIH0pKVxuICB9XG59IGNhdGNoIChlMSkge1xuICAvLyBQcmV2ZW50IHBhc3NpbmcgaW52YWxpZCBvcHRpb25zIChleHRlbnNpb25zIGFycmF5KSB0byBvbGQgdmVyc2lvbnMgb2YgdGhlIGZ1bmN0aW9uLlxuICAvLyBodHRwczovL2dpdGh1Yi5jb20vZXNsaW50L2VzbGludC9ibG9iL3Y1LjE2LjAvbGliL3V0aWwvZ2xvYi11dGlscy5qcyNMMTc4LUwyODBcbiAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2VzbGludC9lc2xpbnQvYmxvYi92NS4yLjAvbGliL3V0aWwvZ2xvYi11dGlsLmpzI0wxNzQtTDI2OVxuICBsZXQgb3JpZ2luYWxMaXN0RmlsZXNUb1Byb2Nlc3NcbiAgdHJ5IHtcbiAgICBvcmlnaW5hbExpc3RGaWxlc1RvUHJvY2VzcyA9IHJlcXVpcmUoJ2VzbGludC9saWIvdXRpbC9nbG9iLXV0aWxzJykubGlzdEZpbGVzVG9Qcm9jZXNzXG4gICAgbGlzdEZpbGVzVG9Qcm9jZXNzID0gZnVuY3Rpb24gKHNyYywgZXh0ZW5zaW9ucykge1xuICAgICAgcmV0dXJuIG9yaWdpbmFsTGlzdEZpbGVzVG9Qcm9jZXNzKHNyYywge1xuICAgICAgICBleHRlbnNpb25zOiBleHRlbnNpb25zLFxuICAgICAgfSlcbiAgICB9XG4gIH0gY2F0Y2ggKGUyKSB7XG4gICAgb3JpZ2luYWxMaXN0RmlsZXNUb1Byb2Nlc3MgPSByZXF1aXJlKCdlc2xpbnQvbGliL3V0aWwvZ2xvYi11dGlsJykubGlzdEZpbGVzVG9Qcm9jZXNzXG5cbiAgICBsaXN0RmlsZXNUb1Byb2Nlc3MgPSBmdW5jdGlvbiAoc3JjLCBleHRlbnNpb25zKSB7XG4gICAgICBjb25zdCBwYXR0ZXJucyA9IHNyYy5yZWR1Y2UoKGNhcnJ5LCBwYXR0ZXJuKSA9PiB7XG4gICAgICAgIHJldHVybiBjYXJyeS5jb25jYXQoZXh0ZW5zaW9ucy5tYXAoKGV4dGVuc2lvbikgPT4ge1xuICAgICAgICAgIHJldHVybiAvXFwqXFwqfFxcKlxcLi8udGVzdChwYXR0ZXJuKSA/IHBhdHRlcm4gOiBgJHtwYXR0ZXJufS8qKi8qJHtleHRlbnNpb259YFxuICAgICAgICB9KSlcbiAgICAgIH0sIHNyYy5zbGljZSgpKVxuXG4gICAgICByZXR1cm4gb3JpZ2luYWxMaXN0RmlsZXNUb1Byb2Nlc3MocGF0dGVybnMpXG4gICAgfVxuICB9XG59XG5cbmNvbnN0IEVYUE9SVF9ERUZBVUxUX0RFQ0xBUkFUSU9OID0gJ0V4cG9ydERlZmF1bHREZWNsYXJhdGlvbidcbmNvbnN0IEVYUE9SVF9OQU1FRF9ERUNMQVJBVElPTiA9ICdFeHBvcnROYW1lZERlY2xhcmF0aW9uJ1xuY29uc3QgRVhQT1JUX0FMTF9ERUNMQVJBVElPTiA9ICdFeHBvcnRBbGxEZWNsYXJhdGlvbidcbmNvbnN0IElNUE9SVF9ERUNMQVJBVElPTiA9ICdJbXBvcnREZWNsYXJhdGlvbidcbmNvbnN0IElNUE9SVF9OQU1FU1BBQ0VfU1BFQ0lGSUVSID0gJ0ltcG9ydE5hbWVzcGFjZVNwZWNpZmllcidcbmNvbnN0IElNUE9SVF9ERUZBVUxUX1NQRUNJRklFUiA9ICdJbXBvcnREZWZhdWx0U3BlY2lmaWVyJ1xuY29uc3QgVkFSSUFCTEVfREVDTEFSQVRJT04gPSAnVmFyaWFibGVEZWNsYXJhdGlvbidcbmNvbnN0IEZVTkNUSU9OX0RFQ0xBUkFUSU9OID0gJ0Z1bmN0aW9uRGVjbGFyYXRpb24nXG5jb25zdCBDTEFTU19ERUNMQVJBVElPTiA9ICdDbGFzc0RlY2xhcmF0aW9uJ1xuY29uc3QgREVGQVVMVCA9ICdkZWZhdWx0J1xuXG4vKipcbiAqIExpc3Qgb2YgaW1wb3J0cyBwZXIgZmlsZS5cbiAqXG4gKiBSZXByZXNlbnRlZCBieSBhIHR3by1sZXZlbCBNYXAgdG8gYSBTZXQgb2YgaWRlbnRpZmllcnMuIFRoZSB1cHBlci1sZXZlbCBNYXBcbiAqIGtleXMgYXJlIHRoZSBwYXRocyB0byB0aGUgbW9kdWxlcyBjb250YWluaW5nIHRoZSBpbXBvcnRzLCB3aGlsZSB0aGVcbiAqIGxvd2VyLWxldmVsIE1hcCBrZXlzIGFyZSB0aGUgcGF0aHMgdG8gdGhlIGZpbGVzIHdoaWNoIGFyZSBiZWluZyBpbXBvcnRlZFxuICogZnJvbS4gTGFzdGx5LCB0aGUgU2V0IG9mIGlkZW50aWZpZXJzIGNvbnRhaW5zIGVpdGhlciBuYW1lcyBiZWluZyBpbXBvcnRlZFxuICogb3IgYSBzcGVjaWFsIEFTVCBub2RlIG5hbWUgbGlzdGVkIGFib3ZlIChlLmcgSW1wb3J0RGVmYXVsdFNwZWNpZmllcikuXG4gKlxuICogRm9yIGV4YW1wbGUsIGlmIHdlIGhhdmUgYSBmaWxlIG5hbWVkIGZvby5qcyBjb250YWluaW5nOlxuICpcbiAqICAgaW1wb3J0IHsgbzIgfSBmcm9tICcuL2Jhci5qcyc7XG4gKlxuICogVGhlbiB3ZSB3aWxsIGhhdmUgYSBzdHJ1Y3R1cmUgdGhhdCBsb29rcyBsaWtlOlxuICpcbiAqICAgTWFwIHsgJ2Zvby5qcycgPT4gTWFwIHsgJ2Jhci5qcycgPT4gU2V0IHsgJ28yJyB9IH0gfVxuICpcbiAqIEB0eXBlIHtNYXA8c3RyaW5nLCBNYXA8c3RyaW5nLCBTZXQ8c3RyaW5nPj4+fVxuICovXG5jb25zdCBpbXBvcnRMaXN0ID0gbmV3IE1hcCgpXG5cbi8qKlxuICogTGlzdCBvZiBleHBvcnRzIHBlciBmaWxlLlxuICpcbiAqIFJlcHJlc2VudGVkIGJ5IGEgdHdvLWxldmVsIE1hcCB0byBhbiBvYmplY3Qgb2YgbWV0YWRhdGEuIFRoZSB1cHBlci1sZXZlbCBNYXBcbiAqIGtleXMgYXJlIHRoZSBwYXRocyB0byB0aGUgbW9kdWxlcyBjb250YWluaW5nIHRoZSBleHBvcnRzLCB3aGlsZSB0aGVcbiAqIGxvd2VyLWxldmVsIE1hcCBrZXlzIGFyZSB0aGUgc3BlY2lmaWMgaWRlbnRpZmllcnMgb3Igc3BlY2lhbCBBU1Qgbm9kZSBuYW1lc1xuICogYmVpbmcgZXhwb3J0ZWQuIFRoZSBsZWFmLWxldmVsIG1ldGFkYXRhIG9iamVjdCBhdCB0aGUgbW9tZW50IG9ubHkgY29udGFpbnMgYVxuICogYHdoZXJlVXNlZGAgcHJvcG9lcnR5LCB3aGljaCBjb250YWlucyBhIFNldCBvZiBwYXRocyB0byBtb2R1bGVzIHRoYXQgaW1wb3J0XG4gKiB0aGUgbmFtZS5cbiAqXG4gKiBGb3IgZXhhbXBsZSwgaWYgd2UgaGF2ZSBhIGZpbGUgbmFtZWQgYmFyLmpzIGNvbnRhaW5pbmcgdGhlIGZvbGxvd2luZyBleHBvcnRzOlxuICpcbiAqICAgY29uc3QgbzIgPSAnYmFyJztcbiAqICAgZXhwb3J0IHsgbzIgfTtcbiAqXG4gKiBBbmQgYSBmaWxlIG5hbWVkIGZvby5qcyBjb250YWluaW5nIHRoZSBmb2xsb3dpbmcgaW1wb3J0OlxuICpcbiAqICAgaW1wb3J0IHsgbzIgfSBmcm9tICcuL2Jhci5qcyc7XG4gKlxuICogVGhlbiB3ZSB3aWxsIGhhdmUgYSBzdHJ1Y3R1cmUgdGhhdCBsb29rcyBsaWtlOlxuICpcbiAqICAgTWFwIHsgJ2Jhci5qcycgPT4gTWFwIHsgJ28yJyA9PiB7IHdoZXJlVXNlZDogU2V0IHsgJ2Zvby5qcycgfSB9IH0gfVxuICpcbiAqIEB0eXBlIHtNYXA8c3RyaW5nLCBNYXA8c3RyaW5nLCBvYmplY3Q+Pn1cbiAqL1xuY29uc3QgZXhwb3J0TGlzdCA9IG5ldyBNYXAoKVxuXG5jb25zdCBpZ25vcmVkRmlsZXMgPSBuZXcgU2V0KClcbmNvbnN0IGZpbGVzT3V0c2lkZVNyYyA9IG5ldyBTZXQoKVxuXG5jb25zdCBpc05vZGVNb2R1bGUgPSBwYXRoID0+IHtcbiAgcmV0dXJuIC9cXC8obm9kZV9tb2R1bGVzKVxcLy8udGVzdChwYXRoKVxufVxuXG4vKipcbiAqIHJlYWQgYWxsIGZpbGVzIG1hdGNoaW5nIHRoZSBwYXR0ZXJucyBpbiBzcmMgYW5kIGlnbm9yZUV4cG9ydHNcbiAqXG4gKiByZXR1cm4gYWxsIGZpbGVzIG1hdGNoaW5nIHNyYyBwYXR0ZXJuLCB3aGljaCBhcmUgbm90IG1hdGNoaW5nIHRoZSBpZ25vcmVFeHBvcnRzIHBhdHRlcm5cbiAqL1xuY29uc3QgcmVzb2x2ZUZpbGVzID0gKHNyYywgaWdub3JlRXhwb3J0cywgY29udGV4dCkgPT4ge1xuICBjb25zdCBleHRlbnNpb25zID0gQXJyYXkuZnJvbShnZXRGaWxlRXh0ZW5zaW9ucyhjb250ZXh0LnNldHRpbmdzKSlcblxuICBjb25zdCBzcmNGaWxlcyA9IG5ldyBTZXQoKVxuICBjb25zdCBzcmNGaWxlTGlzdCA9IGxpc3RGaWxlc1RvUHJvY2VzcyhzcmMsIGV4dGVuc2lvbnMpXG5cbiAgLy8gcHJlcGFyZSBsaXN0IG9mIGlnbm9yZWQgZmlsZXNcbiAgY29uc3QgaWdub3JlZEZpbGVzTGlzdCA9ICBsaXN0RmlsZXNUb1Byb2Nlc3MoaWdub3JlRXhwb3J0cywgZXh0ZW5zaW9ucylcbiAgaWdub3JlZEZpbGVzTGlzdC5mb3JFYWNoKCh7IGZpbGVuYW1lIH0pID0+IGlnbm9yZWRGaWxlcy5hZGQoZmlsZW5hbWUpKVxuXG4gIC8vIHByZXBhcmUgbGlzdCBvZiBzb3VyY2UgZmlsZXMsIGRvbid0IGNvbnNpZGVyIGZpbGVzIGZyb20gbm9kZV9tb2R1bGVzXG4gIHNyY0ZpbGVMaXN0LmZpbHRlcigoeyBmaWxlbmFtZSB9KSA9PiAhaXNOb2RlTW9kdWxlKGZpbGVuYW1lKSkuZm9yRWFjaCgoeyBmaWxlbmFtZSB9KSA9PiB7XG4gICAgc3JjRmlsZXMuYWRkKGZpbGVuYW1lKVxuICB9KVxuICByZXR1cm4gc3JjRmlsZXNcbn1cblxuLyoqXG4gKiBwYXJzZSBhbGwgc291cmNlIGZpbGVzIGFuZCBidWlsZCB1cCAyIG1hcHMgY29udGFpbmluZyB0aGUgZXhpc3RpbmcgaW1wb3J0cyBhbmQgZXhwb3J0c1xuICovXG5jb25zdCBwcmVwYXJlSW1wb3J0c0FuZEV4cG9ydHMgPSAoc3JjRmlsZXMsIGNvbnRleHQpID0+IHtcbiAgY29uc3QgZXhwb3J0QWxsID0gbmV3IE1hcCgpXG4gIHNyY0ZpbGVzLmZvckVhY2goZmlsZSA9PiB7XG4gICAgY29uc3QgZXhwb3J0cyA9IG5ldyBNYXAoKVxuICAgIGNvbnN0IGltcG9ydHMgPSBuZXcgTWFwKClcbiAgICBjb25zdCBjdXJyZW50RXhwb3J0cyA9IEV4cG9ydHMuZ2V0KGZpbGUsIGNvbnRleHQpXG4gICAgaWYgKGN1cnJlbnRFeHBvcnRzKSB7XG4gICAgICBjb25zdCB7IGRlcGVuZGVuY2llcywgcmVleHBvcnRzLCBpbXBvcnRzOiBsb2NhbEltcG9ydExpc3QsIG5hbWVzcGFjZSAgfSA9IGN1cnJlbnRFeHBvcnRzXG5cbiAgICAgIC8vIGRlcGVuZGVuY2llcyA9PT0gZXhwb3J0ICogZnJvbVxuICAgICAgY29uc3QgY3VycmVudEV4cG9ydEFsbCA9IG5ldyBTZXQoKVxuICAgICAgZGVwZW5kZW5jaWVzLmZvckVhY2goZ2V0RGVwZW5kZW5jeSA9PiB7XG4gICAgICAgIGNvbnN0IGRlcGVuZGVuY3kgPSBnZXREZXBlbmRlbmN5KClcbiAgICAgICAgaWYgKGRlcGVuZGVuY3kgPT09IG51bGwpIHtcbiAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuXG4gICAgICAgIGN1cnJlbnRFeHBvcnRBbGwuYWRkKGRlcGVuZGVuY3kucGF0aClcbiAgICAgIH0pXG4gICAgICBleHBvcnRBbGwuc2V0KGZpbGUsIGN1cnJlbnRFeHBvcnRBbGwpXG5cbiAgICAgIHJlZXhwb3J0cy5mb3JFYWNoKCh2YWx1ZSwga2V5KSA9PiB7XG4gICAgICAgIGlmIChrZXkgPT09IERFRkFVTFQpIHtcbiAgICAgICAgICBleHBvcnRzLnNldChJTVBPUlRfREVGQVVMVF9TUEVDSUZJRVIsIHsgd2hlcmVVc2VkOiBuZXcgU2V0KCkgfSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBleHBvcnRzLnNldChrZXksIHsgd2hlcmVVc2VkOiBuZXcgU2V0KCkgfSlcbiAgICAgICAgfVxuICAgICAgICBjb25zdCByZWV4cG9ydCA9ICB2YWx1ZS5nZXRJbXBvcnQoKVxuICAgICAgICBpZiAoIXJlZXhwb3J0KSB7XG4gICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgbGV0IGxvY2FsSW1wb3J0ID0gaW1wb3J0cy5nZXQocmVleHBvcnQucGF0aClcbiAgICAgICAgbGV0IGN1cnJlbnRWYWx1ZVxuICAgICAgICBpZiAodmFsdWUubG9jYWwgPT09IERFRkFVTFQpIHtcbiAgICAgICAgICBjdXJyZW50VmFsdWUgPSBJTVBPUlRfREVGQVVMVF9TUEVDSUZJRVJcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjdXJyZW50VmFsdWUgPSB2YWx1ZS5sb2NhbFxuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YgbG9jYWxJbXBvcnQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgbG9jYWxJbXBvcnQgPSBuZXcgU2V0KFsuLi5sb2NhbEltcG9ydCwgY3VycmVudFZhbHVlXSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBsb2NhbEltcG9ydCA9IG5ldyBTZXQoW2N1cnJlbnRWYWx1ZV0pXG4gICAgICAgIH1cbiAgICAgICAgaW1wb3J0cy5zZXQocmVleHBvcnQucGF0aCwgbG9jYWxJbXBvcnQpXG4gICAgICB9KVxuXG4gICAgICBsb2NhbEltcG9ydExpc3QuZm9yRWFjaCgodmFsdWUsIGtleSkgPT4ge1xuICAgICAgICBpZiAoaXNOb2RlTW9kdWxlKGtleSkpIHtcbiAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuICAgICAgICBsZXQgbG9jYWxJbXBvcnQgPSBpbXBvcnRzLmdldChrZXkpXG4gICAgICAgIGlmICh0eXBlb2YgbG9jYWxJbXBvcnQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgbG9jYWxJbXBvcnQgPSBuZXcgU2V0KFsuLi5sb2NhbEltcG9ydCwgLi4udmFsdWUuaW1wb3J0ZWRTcGVjaWZpZXJzXSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBsb2NhbEltcG9ydCA9IHZhbHVlLmltcG9ydGVkU3BlY2lmaWVyc1xuICAgICAgICB9XG4gICAgICAgIGltcG9ydHMuc2V0KGtleSwgbG9jYWxJbXBvcnQpXG4gICAgICB9KVxuICAgICAgaW1wb3J0TGlzdC5zZXQoZmlsZSwgaW1wb3J0cylcblxuICAgICAgLy8gYnVpbGQgdXAgZXhwb3J0IGxpc3Qgb25seSwgaWYgZmlsZSBpcyBub3QgaWdub3JlZFxuICAgICAgaWYgKGlnbm9yZWRGaWxlcy5oYXMoZmlsZSkpIHtcbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG4gICAgICBuYW1lc3BhY2UuZm9yRWFjaCgodmFsdWUsIGtleSkgPT4ge1xuICAgICAgICBpZiAoa2V5ID09PSBERUZBVUxUKSB7XG4gICAgICAgICAgZXhwb3J0cy5zZXQoSU1QT1JUX0RFRkFVTFRfU1BFQ0lGSUVSLCB7IHdoZXJlVXNlZDogbmV3IFNldCgpIH0pXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZXhwb3J0cy5zZXQoa2V5LCB7IHdoZXJlVXNlZDogbmV3IFNldCgpIH0pXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfVxuICAgIGV4cG9ydHMuc2V0KEVYUE9SVF9BTExfREVDTEFSQVRJT04sIHsgd2hlcmVVc2VkOiBuZXcgU2V0KCkgfSlcbiAgICBleHBvcnRzLnNldChJTVBPUlRfTkFNRVNQQUNFX1NQRUNJRklFUiwgeyB3aGVyZVVzZWQ6IG5ldyBTZXQoKSB9KVxuICAgIGV4cG9ydExpc3Quc2V0KGZpbGUsIGV4cG9ydHMpXG4gIH0pXG4gIGV4cG9ydEFsbC5mb3JFYWNoKCh2YWx1ZSwga2V5KSA9PiB7XG4gICAgdmFsdWUuZm9yRWFjaCh2YWwgPT4ge1xuICAgICAgY29uc3QgY3VycmVudEV4cG9ydHMgPSBleHBvcnRMaXN0LmdldCh2YWwpXG4gICAgICBjb25zdCBjdXJyZW50RXhwb3J0ID0gY3VycmVudEV4cG9ydHMuZ2V0KEVYUE9SVF9BTExfREVDTEFSQVRJT04pXG4gICAgICBjdXJyZW50RXhwb3J0LndoZXJlVXNlZC5hZGQoa2V5KVxuICAgIH0pXG4gIH0pXG59XG5cbi8qKlxuICogdHJhdmVyc2UgdGhyb3VnaCBhbGwgaW1wb3J0cyBhbmQgYWRkIHRoZSByZXNwZWN0aXZlIHBhdGggdG8gdGhlIHdoZXJlVXNlZC1saXN0XG4gKiBvZiB0aGUgY29ycmVzcG9uZGluZyBleHBvcnRcbiAqL1xuY29uc3QgZGV0ZXJtaW5lVXNhZ2UgPSAoKSA9PiB7XG4gIGltcG9ydExpc3QuZm9yRWFjaCgobGlzdFZhbHVlLCBsaXN0S2V5KSA9PiB7XG4gICAgbGlzdFZhbHVlLmZvckVhY2goKHZhbHVlLCBrZXkpID0+IHtcbiAgICAgIGNvbnN0IGV4cG9ydHMgPSBleHBvcnRMaXN0LmdldChrZXkpXG4gICAgICBpZiAodHlwZW9mIGV4cG9ydHMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHZhbHVlLmZvckVhY2goY3VycmVudEltcG9ydCA9PiB7XG4gICAgICAgICAgbGV0IHNwZWNpZmllclxuICAgICAgICAgIGlmIChjdXJyZW50SW1wb3J0ID09PSBJTVBPUlRfTkFNRVNQQUNFX1NQRUNJRklFUikge1xuICAgICAgICAgICAgc3BlY2lmaWVyID0gSU1QT1JUX05BTUVTUEFDRV9TUEVDSUZJRVJcbiAgICAgICAgICB9IGVsc2UgaWYgKGN1cnJlbnRJbXBvcnQgPT09IElNUE9SVF9ERUZBVUxUX1NQRUNJRklFUikge1xuICAgICAgICAgICAgc3BlY2lmaWVyID0gSU1QT1JUX0RFRkFVTFRfU1BFQ0lGSUVSXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNwZWNpZmllciA9IGN1cnJlbnRJbXBvcnRcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHR5cGVvZiBzcGVjaWZpZXIgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBjb25zdCBleHBvcnRTdGF0ZW1lbnQgPSBleHBvcnRzLmdldChzcGVjaWZpZXIpXG4gICAgICAgICAgICBpZiAodHlwZW9mIGV4cG9ydFN0YXRlbWVudCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgY29uc3QgeyB3aGVyZVVzZWQgfSA9IGV4cG9ydFN0YXRlbWVudFxuICAgICAgICAgICAgICB3aGVyZVVzZWQuYWRkKGxpc3RLZXkpXG4gICAgICAgICAgICAgIGV4cG9ydHMuc2V0KHNwZWNpZmllciwgeyB3aGVyZVVzZWQgfSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgfSlcbiAgfSlcbn1cblxuY29uc3QgZ2V0U3JjID0gc3JjID0+IHtcbiAgaWYgKHNyYykge1xuICAgIHJldHVybiBzcmNcbiAgfVxuICByZXR1cm4gW3Byb2Nlc3MuY3dkKCldXG59XG5cbi8qKlxuICogcHJlcGFyZSB0aGUgbGlzdHMgb2YgZXhpc3RpbmcgaW1wb3J0cyBhbmQgZXhwb3J0cyAtIHNob3VsZCBvbmx5IGJlIGV4ZWN1dGVkIG9uY2UgYXRcbiAqIHRoZSBzdGFydCBvZiBhIG5ldyBlc2xpbnQgcnVuXG4gKi9cbmxldCBzcmNGaWxlc1xubGV0IGxhc3RQcmVwYXJlS2V5XG5jb25zdCBkb1ByZXBhcmF0aW9uID0gKHNyYywgaWdub3JlRXhwb3J0cywgY29udGV4dCkgPT4ge1xuICBjb25zdCBwcmVwYXJlS2V5ID0gSlNPTi5zdHJpbmdpZnkoe1xuICAgIHNyYzogKHNyYyB8fCBbXSkuc29ydCgpLFxuICAgIGlnbm9yZUV4cG9ydHM6IChpZ25vcmVFeHBvcnRzIHx8IFtdKS5zb3J0KCksXG4gICAgZXh0ZW5zaW9uczogQXJyYXkuZnJvbShnZXRGaWxlRXh0ZW5zaW9ucyhjb250ZXh0LnNldHRpbmdzKSkuc29ydCgpLFxuICB9KVxuICBpZiAocHJlcGFyZUtleSA9PT0gbGFzdFByZXBhcmVLZXkpIHtcbiAgICByZXR1cm5cbiAgfVxuXG4gIGltcG9ydExpc3QuY2xlYXIoKVxuICBleHBvcnRMaXN0LmNsZWFyKClcbiAgaWdub3JlZEZpbGVzLmNsZWFyKClcbiAgZmlsZXNPdXRzaWRlU3JjLmNsZWFyKClcblxuICBzcmNGaWxlcyA9IHJlc29sdmVGaWxlcyhnZXRTcmMoc3JjKSwgaWdub3JlRXhwb3J0cywgY29udGV4dClcbiAgcHJlcGFyZUltcG9ydHNBbmRFeHBvcnRzKHNyY0ZpbGVzLCBjb250ZXh0KVxuICBkZXRlcm1pbmVVc2FnZSgpXG4gIGxhc3RQcmVwYXJlS2V5ID0gcHJlcGFyZUtleVxufVxuXG5jb25zdCBuZXdOYW1lc3BhY2VJbXBvcnRFeGlzdHMgPSBzcGVjaWZpZXJzID0+XG4gIHNwZWNpZmllcnMuc29tZSgoeyB0eXBlIH0pID0+IHR5cGUgPT09IElNUE9SVF9OQU1FU1BBQ0VfU1BFQ0lGSUVSKVxuXG5jb25zdCBuZXdEZWZhdWx0SW1wb3J0RXhpc3RzID0gc3BlY2lmaWVycyA9PlxuICBzcGVjaWZpZXJzLnNvbWUoKHsgdHlwZSB9KSA9PiB0eXBlID09PSBJTVBPUlRfREVGQVVMVF9TUEVDSUZJRVIpXG5cbmNvbnN0IGZpbGVJc0luUGtnID0gZmlsZSA9PiB7XG4gIGNvbnN0IHsgcGF0aCwgcGtnIH0gPSByZWFkUGtnVXAuc3luYyh7Y3dkOiBmaWxlLCBub3JtYWxpemU6IGZhbHNlfSlcbiAgY29uc3QgYmFzZVBhdGggPSBkaXJuYW1lKHBhdGgpXG5cbiAgY29uc3QgY2hlY2tQa2dGaWVsZFN0cmluZyA9IHBrZ0ZpZWxkID0+IHtcbiAgICBpZiAoam9pbihiYXNlUGF0aCwgcGtnRmllbGQpID09PSBmaWxlKSB7XG4gICAgICAgIHJldHVybiB0cnVlXG4gICAgICB9XG4gIH1cblxuICBjb25zdCBjaGVja1BrZ0ZpZWxkT2JqZWN0ID0gcGtnRmllbGQgPT4ge1xuICAgICAgY29uc3QgcGtnRmllbGRGaWxlcyA9IHZhbHVlcyhwa2dGaWVsZCkubWFwKHZhbHVlID0+IGpvaW4oYmFzZVBhdGgsIHZhbHVlKSlcbiAgICAgIGlmIChpbmNsdWRlcyhwa2dGaWVsZEZpbGVzLCBmaWxlKSkge1xuICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgfVxuICB9XG5cbiAgY29uc3QgY2hlY2tQa2dGaWVsZCA9IHBrZ0ZpZWxkID0+IHtcbiAgICBpZiAodHlwZW9mIHBrZ0ZpZWxkID09PSAnc3RyaW5nJykge1xuICAgICAgcmV0dXJuIGNoZWNrUGtnRmllbGRTdHJpbmcocGtnRmllbGQpXG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBwa2dGaWVsZCA9PT0gJ29iamVjdCcpIHtcbiAgICAgIHJldHVybiBjaGVja1BrZ0ZpZWxkT2JqZWN0KHBrZ0ZpZWxkKVxuICAgIH1cbiAgfVxuXG4gIGlmIChwa2cucHJpdmF0ZSA9PT0gdHJ1ZSkge1xuICAgIHJldHVybiBmYWxzZVxuICB9XG5cbiAgaWYgKHBrZy5iaW4pIHtcbiAgICBpZiAoY2hlY2tQa2dGaWVsZChwa2cuYmluKSkge1xuICAgICAgcmV0dXJuIHRydWVcbiAgICB9XG4gIH1cblxuICBpZiAocGtnLmJyb3dzZXIpIHtcbiAgICBpZiAoY2hlY2tQa2dGaWVsZChwa2cuYnJvd3NlcikpIHtcbiAgICAgIHJldHVybiB0cnVlXG4gICAgfVxuICB9XG5cbiAgaWYgKHBrZy5tYWluKSB7XG4gICAgaWYgKGNoZWNrUGtnRmllbGRTdHJpbmcocGtnLm1haW4pKSB7XG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBmYWxzZVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgbWV0YToge1xuICAgIHR5cGU6ICdzdWdnZXN0aW9uJyxcbiAgICBkb2NzOiB7IHVybDogZG9jc1VybCgnbm8tdW51c2VkLW1vZHVsZXMnKSB9LFxuICAgIHNjaGVtYTogW3tcbiAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgc3JjOiB7XG4gICAgICAgICAgZGVzY3JpcHRpb246ICdmaWxlcy9wYXRocyB0byBiZSBhbmFseXplZCAob25seSBmb3IgdW51c2VkIGV4cG9ydHMpJyxcbiAgICAgICAgICB0eXBlOiAnYXJyYXknLFxuICAgICAgICAgIG1pbkl0ZW1zOiAxLFxuICAgICAgICAgIGl0ZW1zOiB7XG4gICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgIG1pbkxlbmd0aDogMSxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBpZ25vcmVFeHBvcnRzOiB7XG4gICAgICAgICAgZGVzY3JpcHRpb246XG4gICAgICAgICAgICAnZmlsZXMvcGF0aHMgZm9yIHdoaWNoIHVudXNlZCBleHBvcnRzIHdpbGwgbm90IGJlIHJlcG9ydGVkIChlLmcgbW9kdWxlIGVudHJ5IHBvaW50cyknLFxuICAgICAgICAgIHR5cGU6ICdhcnJheScsXG4gICAgICAgICAgbWluSXRlbXM6IDEsXG4gICAgICAgICAgaXRlbXM6IHtcbiAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgbWluTGVuZ3RoOiAxLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIG1pc3NpbmdFeHBvcnRzOiB7XG4gICAgICAgICAgZGVzY3JpcHRpb246ICdyZXBvcnQgbW9kdWxlcyB3aXRob3V0IGFueSBleHBvcnRzJyxcbiAgICAgICAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgICAgIH0sXG4gICAgICAgIHVudXNlZEV4cG9ydHM6IHtcbiAgICAgICAgICBkZXNjcmlwdGlvbjogJ3JlcG9ydCBleHBvcnRzIHdpdGhvdXQgYW55IHVzYWdlJyxcbiAgICAgICAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgbm90OiB7XG4gICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICB1bnVzZWRFeHBvcnRzOiB7IGVudW06IFtmYWxzZV0gfSxcbiAgICAgICAgICBtaXNzaW5nRXhwb3J0czogeyBlbnVtOiBbZmFsc2VdIH0sXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgYW55T2Y6W3tcbiAgICAgICAgbm90OiB7XG4gICAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgICAgdW51c2VkRXhwb3J0czogeyBlbnVtOiBbdHJ1ZV0gfSxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICByZXF1aXJlZDogWydtaXNzaW5nRXhwb3J0cyddLFxuICAgICAgfSwge1xuICAgICAgICBub3Q6IHtcbiAgICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICBtaXNzaW5nRXhwb3J0czogeyBlbnVtOiBbdHJ1ZV0gfSxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICByZXF1aXJlZDogWyd1bnVzZWRFeHBvcnRzJ10sXG4gICAgICB9LCB7XG4gICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICB1bnVzZWRFeHBvcnRzOiB7IGVudW06IFt0cnVlXSB9LFxuICAgICAgICB9LFxuICAgICAgICByZXF1aXJlZDogWyd1bnVzZWRFeHBvcnRzJ10sXG4gICAgICB9LCB7XG4gICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICBtaXNzaW5nRXhwb3J0czogeyBlbnVtOiBbdHJ1ZV0gfSxcbiAgICAgICAgfSxcbiAgICAgICAgcmVxdWlyZWQ6IFsnbWlzc2luZ0V4cG9ydHMnXSxcbiAgICAgIH1dLFxuICAgIH1dLFxuICB9LFxuXG4gIGNyZWF0ZTogY29udGV4dCA9PiB7XG4gICAgY29uc3Qge1xuICAgICAgc3JjLFxuICAgICAgaWdub3JlRXhwb3J0cyA9IFtdLFxuICAgICAgbWlzc2luZ0V4cG9ydHMsXG4gICAgICB1bnVzZWRFeHBvcnRzLFxuICAgIH0gPSBjb250ZXh0Lm9wdGlvbnNbMF0gfHwge31cblxuICAgIGlmICh1bnVzZWRFeHBvcnRzKSB7XG4gICAgICBkb1ByZXBhcmF0aW9uKHNyYywgaWdub3JlRXhwb3J0cywgY29udGV4dClcbiAgICB9XG5cbiAgICBjb25zdCBmaWxlID0gY29udGV4dC5nZXRGaWxlbmFtZSgpXG5cbiAgICBjb25zdCBjaGVja0V4cG9ydFByZXNlbmNlID0gbm9kZSA9PiB7XG4gICAgICBpZiAoIW1pc3NpbmdFeHBvcnRzKSB7XG4gICAgICAgIHJldHVyblxuICAgICAgfVxuXG4gICAgICBpZiAoaWdub3JlZEZpbGVzLmhhcyhmaWxlKSkge1xuICAgICAgICByZXR1cm5cbiAgICAgIH1cblxuICAgICAgY29uc3QgZXhwb3J0Q291bnQgPSBleHBvcnRMaXN0LmdldChmaWxlKVxuICAgICAgY29uc3QgZXhwb3J0QWxsID0gZXhwb3J0Q291bnQuZ2V0KEVYUE9SVF9BTExfREVDTEFSQVRJT04pXG4gICAgICBjb25zdCBuYW1lc3BhY2VJbXBvcnRzID0gZXhwb3J0Q291bnQuZ2V0KElNUE9SVF9OQU1FU1BBQ0VfU1BFQ0lGSUVSKVxuXG4gICAgICBleHBvcnRDb3VudC5kZWxldGUoRVhQT1JUX0FMTF9ERUNMQVJBVElPTilcbiAgICAgIGV4cG9ydENvdW50LmRlbGV0ZShJTVBPUlRfTkFNRVNQQUNFX1NQRUNJRklFUilcbiAgICAgIGlmIChleHBvcnRDb3VudC5zaXplIDwgMSkge1xuICAgICAgICAvLyBub2RlLmJvZHlbMF0gPT09ICd1bmRlZmluZWQnIG9ubHkgaGFwcGVucywgaWYgZXZlcnl0aGluZyBpcyBjb21tZW50ZWQgb3V0IGluIHRoZSBmaWxlXG4gICAgICAgIC8vIGJlaW5nIGxpbnRlZFxuICAgICAgICBjb250ZXh0LnJlcG9ydChub2RlLmJvZHlbMF0gPyBub2RlLmJvZHlbMF0gOiBub2RlLCAnTm8gZXhwb3J0cyBmb3VuZCcpXG4gICAgICB9XG4gICAgICBleHBvcnRDb3VudC5zZXQoRVhQT1JUX0FMTF9ERUNMQVJBVElPTiwgZXhwb3J0QWxsKVxuICAgICAgZXhwb3J0Q291bnQuc2V0KElNUE9SVF9OQU1FU1BBQ0VfU1BFQ0lGSUVSLCBuYW1lc3BhY2VJbXBvcnRzKVxuICAgIH1cblxuICAgIGNvbnN0IGNoZWNrVXNhZ2UgPSAobm9kZSwgZXhwb3J0ZWRWYWx1ZSkgPT4ge1xuICAgICAgaWYgKCF1bnVzZWRFeHBvcnRzKSB7XG4gICAgICAgIHJldHVyblxuICAgICAgfVxuXG4gICAgICBpZiAoaWdub3JlZEZpbGVzLmhhcyhmaWxlKSkge1xuICAgICAgICByZXR1cm5cbiAgICAgIH1cblxuICAgICAgaWYgKGZpbGVJc0luUGtnKGZpbGUpKSB7XG4gICAgICAgIHJldHVyblxuICAgICAgfVxuXG4gICAgICBpZiAoZmlsZXNPdXRzaWRlU3JjLmhhcyhmaWxlKSkge1xuICAgICAgICByZXR1cm5cbiAgICAgIH1cblxuICAgICAgLy8gbWFrZSBzdXJlIGZpbGUgdG8gYmUgbGludGVkIGlzIGluY2x1ZGVkIGluIHNvdXJjZSBmaWxlc1xuICAgICAgaWYgKCFzcmNGaWxlcy5oYXMoZmlsZSkpIHtcbiAgICAgICAgc3JjRmlsZXMgPSByZXNvbHZlRmlsZXMoZ2V0U3JjKHNyYyksIGlnbm9yZUV4cG9ydHMsIGNvbnRleHQpXG4gICAgICAgIGlmICghc3JjRmlsZXMuaGFzKGZpbGUpKSB7XG4gICAgICAgICAgZmlsZXNPdXRzaWRlU3JjLmFkZChmaWxlKVxuICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGV4cG9ydHMgPSBleHBvcnRMaXN0LmdldChmaWxlKVxuXG4gICAgICAvLyBzcGVjaWFsIGNhc2U6IGV4cG9ydCAqIGZyb21cbiAgICAgIGNvbnN0IGV4cG9ydEFsbCA9IGV4cG9ydHMuZ2V0KEVYUE9SVF9BTExfREVDTEFSQVRJT04pXG4gICAgICBpZiAodHlwZW9mIGV4cG9ydEFsbCAhPT0gJ3VuZGVmaW5lZCcgJiYgZXhwb3J0ZWRWYWx1ZSAhPT0gSU1QT1JUX0RFRkFVTFRfU1BFQ0lGSUVSKSB7XG4gICAgICAgIGlmIChleHBvcnRBbGwud2hlcmVVc2VkLnNpemUgPiAwKSB7XG4gICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gc3BlY2lhbCBjYXNlOiBuYW1lc3BhY2UgaW1wb3J0XG4gICAgICBjb25zdCBuYW1lc3BhY2VJbXBvcnRzID0gZXhwb3J0cy5nZXQoSU1QT1JUX05BTUVTUEFDRV9TUEVDSUZJRVIpXG4gICAgICBpZiAodHlwZW9mIG5hbWVzcGFjZUltcG9ydHMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIGlmIChuYW1lc3BhY2VJbXBvcnRzLndoZXJlVXNlZC5zaXplID4gMCkge1xuICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIGV4cG9ydHNMaXN0IHdpbGwgYWx3YXlzIG1hcCBhbnkgaW1wb3J0ZWQgdmFsdWUgb2YgJ2RlZmF1bHQnIHRvICdJbXBvcnREZWZhdWx0U3BlY2lmaWVyJ1xuICAgICAgY29uc3QgZXhwb3J0c0tleSA9IGV4cG9ydGVkVmFsdWUgPT09IERFRkFVTFQgPyBJTVBPUlRfREVGQVVMVF9TUEVDSUZJRVIgOiBleHBvcnRlZFZhbHVlXG5cbiAgICAgIGNvbnN0IGV4cG9ydFN0YXRlbWVudCA9IGV4cG9ydHMuZ2V0KGV4cG9ydHNLZXkpXG5cbiAgICAgIGNvbnN0IHZhbHVlID0gZXhwb3J0c0tleSA9PT0gSU1QT1JUX0RFRkFVTFRfU1BFQ0lGSUVSID8gREVGQVVMVCA6IGV4cG9ydHNLZXlcblxuICAgICAgaWYgKHR5cGVvZiBleHBvcnRTdGF0ZW1lbnQgIT09ICd1bmRlZmluZWQnKXtcbiAgICAgICAgaWYgKGV4cG9ydFN0YXRlbWVudC53aGVyZVVzZWQuc2l6ZSA8IDEpIHtcbiAgICAgICAgICBjb250ZXh0LnJlcG9ydChcbiAgICAgICAgICAgIG5vZGUsXG4gICAgICAgICAgICBgZXhwb3J0ZWQgZGVjbGFyYXRpb24gJyR7dmFsdWV9JyBub3QgdXNlZCB3aXRoaW4gb3RoZXIgbW9kdWxlc2BcbiAgICAgICAgICApXG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnRleHQucmVwb3J0KFxuICAgICAgICAgIG5vZGUsXG4gICAgICAgICAgYGV4cG9ydGVkIGRlY2xhcmF0aW9uICcke3ZhbHVlfScgbm90IHVzZWQgd2l0aGluIG90aGVyIG1vZHVsZXNgXG4gICAgICAgIClcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBvbmx5IHVzZWZ1bCBmb3IgdG9vbHMgbGlrZSB2c2NvZGUtZXNsaW50XG4gICAgICpcbiAgICAgKiB1cGRhdGUgbGlzdHMgb2YgZXhpc3RpbmcgZXhwb3J0cyBkdXJpbmcgcnVudGltZVxuICAgICAqL1xuICAgIGNvbnN0IHVwZGF0ZUV4cG9ydFVzYWdlID0gbm9kZSA9PiB7XG4gICAgICBpZiAoaWdub3JlZEZpbGVzLmhhcyhmaWxlKSkge1xuICAgICAgICByZXR1cm5cbiAgICAgIH1cblxuICAgICAgbGV0IGV4cG9ydHMgPSBleHBvcnRMaXN0LmdldChmaWxlKVxuXG4gICAgICAvLyBuZXcgbW9kdWxlIGhhcyBiZWVuIGNyZWF0ZWQgZHVyaW5nIHJ1bnRpbWVcbiAgICAgIC8vIGluY2x1ZGUgaXQgaW4gZnVydGhlciBwcm9jZXNzaW5nXG4gICAgICBpZiAodHlwZW9mIGV4cG9ydHMgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIGV4cG9ydHMgPSBuZXcgTWFwKClcbiAgICAgIH1cblxuICAgICAgY29uc3QgbmV3RXhwb3J0cyA9IG5ldyBNYXAoKVxuICAgICAgY29uc3QgbmV3RXhwb3J0SWRlbnRpZmllcnMgPSBuZXcgU2V0KClcblxuICAgICAgbm9kZS5ib2R5LmZvckVhY2goKHsgdHlwZSwgZGVjbGFyYXRpb24sIHNwZWNpZmllcnMgfSkgPT4ge1xuICAgICAgICBpZiAodHlwZSA9PT0gRVhQT1JUX0RFRkFVTFRfREVDTEFSQVRJT04pIHtcbiAgICAgICAgICBuZXdFeHBvcnRJZGVudGlmaWVycy5hZGQoSU1QT1JUX0RFRkFVTFRfU1BFQ0lGSUVSKVxuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlID09PSBFWFBPUlRfTkFNRURfREVDTEFSQVRJT04pIHtcbiAgICAgICAgICBpZiAoc3BlY2lmaWVycy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBzcGVjaWZpZXJzLmZvckVhY2goc3BlY2lmaWVyID0+IHtcbiAgICAgICAgICAgICAgaWYgKHNwZWNpZmllci5leHBvcnRlZCkge1xuICAgICAgICAgICAgICAgIG5ld0V4cG9ydElkZW50aWZpZXJzLmFkZChzcGVjaWZpZXIuZXhwb3J0ZWQubmFtZSlcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGRlY2xhcmF0aW9uKSB7XG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgIGRlY2xhcmF0aW9uLnR5cGUgPT09IEZVTkNUSU9OX0RFQ0xBUkFUSU9OIHx8XG4gICAgICAgICAgICAgIGRlY2xhcmF0aW9uLnR5cGUgPT09IENMQVNTX0RFQ0xBUkFUSU9OXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgbmV3RXhwb3J0SWRlbnRpZmllcnMuYWRkKGRlY2xhcmF0aW9uLmlkLm5hbWUpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZGVjbGFyYXRpb24udHlwZSA9PT0gVkFSSUFCTEVfREVDTEFSQVRJT04pIHtcbiAgICAgICAgICAgICAgZGVjbGFyYXRpb24uZGVjbGFyYXRpb25zLmZvckVhY2goKHsgaWQgfSkgPT4ge1xuICAgICAgICAgICAgICAgIG5ld0V4cG9ydElkZW50aWZpZXJzLmFkZChpZC5uYW1lKVxuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSlcblxuICAgICAgLy8gb2xkIGV4cG9ydHMgZXhpc3Qgd2l0aGluIGxpc3Qgb2YgbmV3IGV4cG9ydHMgaWRlbnRpZmllcnM6IGFkZCB0byBtYXAgb2YgbmV3IGV4cG9ydHNcbiAgICAgIGV4cG9ydHMuZm9yRWFjaCgodmFsdWUsIGtleSkgPT4ge1xuICAgICAgICBpZiAobmV3RXhwb3J0SWRlbnRpZmllcnMuaGFzKGtleSkpIHtcbiAgICAgICAgICBuZXdFeHBvcnRzLnNldChrZXksIHZhbHVlKVxuICAgICAgICB9XG4gICAgICB9KVxuXG4gICAgICAvLyBuZXcgZXhwb3J0IGlkZW50aWZpZXJzIGFkZGVkOiBhZGQgdG8gbWFwIG9mIG5ldyBleHBvcnRzXG4gICAgICBuZXdFeHBvcnRJZGVudGlmaWVycy5mb3JFYWNoKGtleSA9PiB7XG4gICAgICAgIGlmICghZXhwb3J0cy5oYXMoa2V5KSkge1xuICAgICAgICAgIG5ld0V4cG9ydHMuc2V0KGtleSwgeyB3aGVyZVVzZWQ6IG5ldyBTZXQoKSB9KVxuICAgICAgICB9XG4gICAgICB9KVxuXG4gICAgICAvLyBwcmVzZXJ2ZSBpbmZvcm1hdGlvbiBhYm91dCBuYW1lc3BhY2UgaW1wb3J0c1xuICAgICAgbGV0IGV4cG9ydEFsbCA9IGV4cG9ydHMuZ2V0KEVYUE9SVF9BTExfREVDTEFSQVRJT04pXG4gICAgICBsZXQgbmFtZXNwYWNlSW1wb3J0cyA9IGV4cG9ydHMuZ2V0KElNUE9SVF9OQU1FU1BBQ0VfU1BFQ0lGSUVSKVxuXG4gICAgICBpZiAodHlwZW9mIG5hbWVzcGFjZUltcG9ydHMgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIG5hbWVzcGFjZUltcG9ydHMgPSB7IHdoZXJlVXNlZDogbmV3IFNldCgpIH1cbiAgICAgIH1cblxuICAgICAgbmV3RXhwb3J0cy5zZXQoRVhQT1JUX0FMTF9ERUNMQVJBVElPTiwgZXhwb3J0QWxsKVxuICAgICAgbmV3RXhwb3J0cy5zZXQoSU1QT1JUX05BTUVTUEFDRV9TUEVDSUZJRVIsIG5hbWVzcGFjZUltcG9ydHMpXG4gICAgICBleHBvcnRMaXN0LnNldChmaWxlLCBuZXdFeHBvcnRzKVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIG9ubHkgdXNlZnVsIGZvciB0b29scyBsaWtlIHZzY29kZS1lc2xpbnRcbiAgICAgKlxuICAgICAqIHVwZGF0ZSBsaXN0cyBvZiBleGlzdGluZyBpbXBvcnRzIGR1cmluZyBydW50aW1lXG4gICAgICovXG4gICAgY29uc3QgdXBkYXRlSW1wb3J0VXNhZ2UgPSBub2RlID0+IHtcbiAgICAgIGlmICghdW51c2VkRXhwb3J0cykge1xuICAgICAgICByZXR1cm5cbiAgICAgIH1cblxuICAgICAgbGV0IG9sZEltcG9ydFBhdGhzID0gaW1wb3J0TGlzdC5nZXQoZmlsZSlcbiAgICAgIGlmICh0eXBlb2Ygb2xkSW1wb3J0UGF0aHMgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIG9sZEltcG9ydFBhdGhzID0gbmV3IE1hcCgpXG4gICAgICB9XG5cbiAgICAgIGNvbnN0IG9sZE5hbWVzcGFjZUltcG9ydHMgPSBuZXcgU2V0KClcbiAgICAgIGNvbnN0IG5ld05hbWVzcGFjZUltcG9ydHMgPSBuZXcgU2V0KClcblxuICAgICAgY29uc3Qgb2xkRXhwb3J0QWxsID0gbmV3IFNldCgpXG4gICAgICBjb25zdCBuZXdFeHBvcnRBbGwgPSBuZXcgU2V0KClcblxuICAgICAgY29uc3Qgb2xkRGVmYXVsdEltcG9ydHMgPSBuZXcgU2V0KClcbiAgICAgIGNvbnN0IG5ld0RlZmF1bHRJbXBvcnRzID0gbmV3IFNldCgpXG5cbiAgICAgIGNvbnN0IG9sZEltcG9ydHMgPSBuZXcgTWFwKClcbiAgICAgIGNvbnN0IG5ld0ltcG9ydHMgPSBuZXcgTWFwKClcbiAgICAgIG9sZEltcG9ydFBhdGhzLmZvckVhY2goKHZhbHVlLCBrZXkpID0+IHtcbiAgICAgICAgaWYgKHZhbHVlLmhhcyhFWFBPUlRfQUxMX0RFQ0xBUkFUSU9OKSkge1xuICAgICAgICAgIG9sZEV4cG9ydEFsbC5hZGQoa2V5KVxuICAgICAgICB9XG4gICAgICAgIGlmICh2YWx1ZS5oYXMoSU1QT1JUX05BTUVTUEFDRV9TUEVDSUZJRVIpKSB7XG4gICAgICAgICAgb2xkTmFtZXNwYWNlSW1wb3J0cy5hZGQoa2V5KVxuICAgICAgICB9XG4gICAgICAgIGlmICh2YWx1ZS5oYXMoSU1QT1JUX0RFRkFVTFRfU1BFQ0lGSUVSKSkge1xuICAgICAgICAgIG9sZERlZmF1bHRJbXBvcnRzLmFkZChrZXkpXG4gICAgICAgIH1cbiAgICAgICAgdmFsdWUuZm9yRWFjaCh2YWwgPT4ge1xuICAgICAgICAgIGlmICh2YWwgIT09IElNUE9SVF9OQU1FU1BBQ0VfU1BFQ0lGSUVSICYmXG4gICAgICAgICAgICAgIHZhbCAhPT0gSU1QT1JUX0RFRkFVTFRfU1BFQ0lGSUVSKSB7XG4gICAgICAgICAgICAgICBvbGRJbXBvcnRzLnNldCh2YWwsIGtleSlcbiAgICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICB9KVxuXG4gICAgICBub2RlLmJvZHkuZm9yRWFjaChhc3ROb2RlID0+IHtcbiAgICAgICAgbGV0IHJlc29sdmVkUGF0aFxuXG4gICAgICAgIC8vIHN1cHBvcnQgZm9yIGV4cG9ydCB7IHZhbHVlIH0gZnJvbSAnbW9kdWxlJ1xuICAgICAgICBpZiAoYXN0Tm9kZS50eXBlID09PSBFWFBPUlRfTkFNRURfREVDTEFSQVRJT04pIHtcbiAgICAgICAgICBpZiAoYXN0Tm9kZS5zb3VyY2UpIHtcbiAgICAgICAgICAgIHJlc29sdmVkUGF0aCA9IHJlc29sdmUoYXN0Tm9kZS5zb3VyY2UucmF3LnJlcGxhY2UoLygnfFwiKS9nLCAnJyksIGNvbnRleHQpXG4gICAgICAgICAgICBhc3ROb2RlLnNwZWNpZmllcnMuZm9yRWFjaChzcGVjaWZpZXIgPT4ge1xuICAgICAgICAgICAgICBjb25zdCBuYW1lID0gc3BlY2lmaWVyLmxvY2FsLm5hbWVcbiAgICAgICAgICAgICAgaWYgKHNwZWNpZmllci5sb2NhbC5uYW1lID09PSBERUZBVUxUKSB7XG4gICAgICAgICAgICAgICAgbmV3RGVmYXVsdEltcG9ydHMuYWRkKHJlc29sdmVkUGF0aClcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBuZXdJbXBvcnRzLnNldChuYW1lLCByZXNvbHZlZFBhdGgpXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGFzdE5vZGUudHlwZSA9PT0gRVhQT1JUX0FMTF9ERUNMQVJBVElPTikge1xuICAgICAgICAgIHJlc29sdmVkUGF0aCA9IHJlc29sdmUoYXN0Tm9kZS5zb3VyY2UucmF3LnJlcGxhY2UoLygnfFwiKS9nLCAnJyksIGNvbnRleHQpXG4gICAgICAgICAgbmV3RXhwb3J0QWxsLmFkZChyZXNvbHZlZFBhdGgpXG4gICAgICAgIH1cblxuICAgICAgICBpZiAoYXN0Tm9kZS50eXBlID09PSBJTVBPUlRfREVDTEFSQVRJT04pIHtcbiAgICAgICAgICByZXNvbHZlZFBhdGggPSByZXNvbHZlKGFzdE5vZGUuc291cmNlLnJhdy5yZXBsYWNlKC8oJ3xcIikvZywgJycpLCBjb250ZXh0KVxuICAgICAgICAgIGlmICghcmVzb2x2ZWRQYXRoKSB7XG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoaXNOb2RlTW9kdWxlKHJlc29sdmVkUGF0aCkpIHtcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChuZXdOYW1lc3BhY2VJbXBvcnRFeGlzdHMoYXN0Tm9kZS5zcGVjaWZpZXJzKSkge1xuICAgICAgICAgICAgbmV3TmFtZXNwYWNlSW1wb3J0cy5hZGQocmVzb2x2ZWRQYXRoKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChuZXdEZWZhdWx0SW1wb3J0RXhpc3RzKGFzdE5vZGUuc3BlY2lmaWVycykpIHtcbiAgICAgICAgICAgIG5ld0RlZmF1bHRJbXBvcnRzLmFkZChyZXNvbHZlZFBhdGgpXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgYXN0Tm9kZS5zcGVjaWZpZXJzLmZvckVhY2goc3BlY2lmaWVyID0+IHtcbiAgICAgICAgICAgIGlmIChzcGVjaWZpZXIudHlwZSA9PT0gSU1QT1JUX0RFRkFVTFRfU1BFQ0lGSUVSIHx8XG4gICAgICAgICAgICAgICAgc3BlY2lmaWVyLnR5cGUgPT09IElNUE9SVF9OQU1FU1BBQ0VfU1BFQ0lGSUVSKSB7XG4gICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbmV3SW1wb3J0cy5zZXQoc3BlY2lmaWVyLmltcG9ydGVkLm5hbWUsIHJlc29sdmVkUGF0aClcbiAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgICB9KVxuXG4gICAgICBuZXdFeHBvcnRBbGwuZm9yRWFjaCh2YWx1ZSA9PiB7XG4gICAgICAgIGlmICghb2xkRXhwb3J0QWxsLmhhcyh2YWx1ZSkpIHtcbiAgICAgICAgICBsZXQgaW1wb3J0cyA9IG9sZEltcG9ydFBhdGhzLmdldCh2YWx1ZSlcbiAgICAgICAgICBpZiAodHlwZW9mIGltcG9ydHMgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBpbXBvcnRzID0gbmV3IFNldCgpXG4gICAgICAgICAgfVxuICAgICAgICAgIGltcG9ydHMuYWRkKEVYUE9SVF9BTExfREVDTEFSQVRJT04pXG4gICAgICAgICAgb2xkSW1wb3J0UGF0aHMuc2V0KHZhbHVlLCBpbXBvcnRzKVxuXG4gICAgICAgICAgbGV0IGV4cG9ydHMgPSBleHBvcnRMaXN0LmdldCh2YWx1ZSlcbiAgICAgICAgICBsZXQgY3VycmVudEV4cG9ydFxuICAgICAgICAgIGlmICh0eXBlb2YgZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIGN1cnJlbnRFeHBvcnQgPSBleHBvcnRzLmdldChFWFBPUlRfQUxMX0RFQ0xBUkFUSU9OKVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBleHBvcnRzID0gbmV3IE1hcCgpXG4gICAgICAgICAgICBleHBvcnRMaXN0LnNldCh2YWx1ZSwgZXhwb3J0cylcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAodHlwZW9mIGN1cnJlbnRFeHBvcnQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBjdXJyZW50RXhwb3J0LndoZXJlVXNlZC5hZGQoZmlsZSlcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3Qgd2hlcmVVc2VkID0gbmV3IFNldCgpXG4gICAgICAgICAgICB3aGVyZVVzZWQuYWRkKGZpbGUpXG4gICAgICAgICAgICBleHBvcnRzLnNldChFWFBPUlRfQUxMX0RFQ0xBUkFUSU9OLCB7IHdoZXJlVXNlZCB9KVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSlcblxuICAgICAgb2xkRXhwb3J0QWxsLmZvckVhY2godmFsdWUgPT4ge1xuICAgICAgICBpZiAoIW5ld0V4cG9ydEFsbC5oYXModmFsdWUpKSB7XG4gICAgICAgICAgY29uc3QgaW1wb3J0cyA9IG9sZEltcG9ydFBhdGhzLmdldCh2YWx1ZSlcbiAgICAgICAgICBpbXBvcnRzLmRlbGV0ZShFWFBPUlRfQUxMX0RFQ0xBUkFUSU9OKVxuXG4gICAgICAgICAgY29uc3QgZXhwb3J0cyA9IGV4cG9ydExpc3QuZ2V0KHZhbHVlKVxuICAgICAgICAgIGlmICh0eXBlb2YgZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIGNvbnN0IGN1cnJlbnRFeHBvcnQgPSBleHBvcnRzLmdldChFWFBPUlRfQUxMX0RFQ0xBUkFUSU9OKVxuICAgICAgICAgICAgaWYgKHR5cGVvZiBjdXJyZW50RXhwb3J0ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICBjdXJyZW50RXhwb3J0LndoZXJlVXNlZC5kZWxldGUoZmlsZSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pXG5cbiAgICAgIG5ld0RlZmF1bHRJbXBvcnRzLmZvckVhY2godmFsdWUgPT4ge1xuICAgICAgICBpZiAoIW9sZERlZmF1bHRJbXBvcnRzLmhhcyh2YWx1ZSkpIHtcbiAgICAgICAgICBsZXQgaW1wb3J0cyA9IG9sZEltcG9ydFBhdGhzLmdldCh2YWx1ZSlcbiAgICAgICAgICBpZiAodHlwZW9mIGltcG9ydHMgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBpbXBvcnRzID0gbmV3IFNldCgpXG4gICAgICAgICAgfVxuICAgICAgICAgIGltcG9ydHMuYWRkKElNUE9SVF9ERUZBVUxUX1NQRUNJRklFUilcbiAgICAgICAgICBvbGRJbXBvcnRQYXRocy5zZXQodmFsdWUsIGltcG9ydHMpXG5cbiAgICAgICAgICBsZXQgZXhwb3J0cyA9IGV4cG9ydExpc3QuZ2V0KHZhbHVlKVxuICAgICAgICAgIGxldCBjdXJyZW50RXhwb3J0XG4gICAgICAgICAgaWYgKHR5cGVvZiBleHBvcnRzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgY3VycmVudEV4cG9ydCA9IGV4cG9ydHMuZ2V0KElNUE9SVF9ERUZBVUxUX1NQRUNJRklFUilcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZXhwb3J0cyA9IG5ldyBNYXAoKVxuICAgICAgICAgICAgZXhwb3J0TGlzdC5zZXQodmFsdWUsIGV4cG9ydHMpXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKHR5cGVvZiBjdXJyZW50RXhwb3J0ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgY3VycmVudEV4cG9ydC53aGVyZVVzZWQuYWRkKGZpbGUpXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IHdoZXJlVXNlZCA9IG5ldyBTZXQoKVxuICAgICAgICAgICAgd2hlcmVVc2VkLmFkZChmaWxlKVxuICAgICAgICAgICAgZXhwb3J0cy5zZXQoSU1QT1JUX0RFRkFVTFRfU1BFQ0lGSUVSLCB7IHdoZXJlVXNlZCB9KVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSlcblxuICAgICAgb2xkRGVmYXVsdEltcG9ydHMuZm9yRWFjaCh2YWx1ZSA9PiB7XG4gICAgICAgIGlmICghbmV3RGVmYXVsdEltcG9ydHMuaGFzKHZhbHVlKSkge1xuICAgICAgICAgIGNvbnN0IGltcG9ydHMgPSBvbGRJbXBvcnRQYXRocy5nZXQodmFsdWUpXG4gICAgICAgICAgaW1wb3J0cy5kZWxldGUoSU1QT1JUX0RFRkFVTFRfU1BFQ0lGSUVSKVxuXG4gICAgICAgICAgY29uc3QgZXhwb3J0cyA9IGV4cG9ydExpc3QuZ2V0KHZhbHVlKVxuICAgICAgICAgIGlmICh0eXBlb2YgZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIGNvbnN0IGN1cnJlbnRFeHBvcnQgPSBleHBvcnRzLmdldChJTVBPUlRfREVGQVVMVF9TUEVDSUZJRVIpXG4gICAgICAgICAgICBpZiAodHlwZW9mIGN1cnJlbnRFeHBvcnQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgIGN1cnJlbnRFeHBvcnQud2hlcmVVc2VkLmRlbGV0ZShmaWxlKVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSlcblxuICAgICAgbmV3TmFtZXNwYWNlSW1wb3J0cy5mb3JFYWNoKHZhbHVlID0+IHtcbiAgICAgICAgaWYgKCFvbGROYW1lc3BhY2VJbXBvcnRzLmhhcyh2YWx1ZSkpIHtcbiAgICAgICAgICBsZXQgaW1wb3J0cyA9IG9sZEltcG9ydFBhdGhzLmdldCh2YWx1ZSlcbiAgICAgICAgICBpZiAodHlwZW9mIGltcG9ydHMgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBpbXBvcnRzID0gbmV3IFNldCgpXG4gICAgICAgICAgfVxuICAgICAgICAgIGltcG9ydHMuYWRkKElNUE9SVF9OQU1FU1BBQ0VfU1BFQ0lGSUVSKVxuICAgICAgICAgIG9sZEltcG9ydFBhdGhzLnNldCh2YWx1ZSwgaW1wb3J0cylcblxuICAgICAgICAgIGxldCBleHBvcnRzID0gZXhwb3J0TGlzdC5nZXQodmFsdWUpXG4gICAgICAgICAgbGV0IGN1cnJlbnRFeHBvcnRcbiAgICAgICAgICBpZiAodHlwZW9mIGV4cG9ydHMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBjdXJyZW50RXhwb3J0ID0gZXhwb3J0cy5nZXQoSU1QT1JUX05BTUVTUEFDRV9TUEVDSUZJRVIpXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGV4cG9ydHMgPSBuZXcgTWFwKClcbiAgICAgICAgICAgIGV4cG9ydExpc3Quc2V0KHZhbHVlLCBleHBvcnRzKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICh0eXBlb2YgY3VycmVudEV4cG9ydCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIGN1cnJlbnRFeHBvcnQud2hlcmVVc2VkLmFkZChmaWxlKVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCB3aGVyZVVzZWQgPSBuZXcgU2V0KClcbiAgICAgICAgICAgIHdoZXJlVXNlZC5hZGQoZmlsZSlcbiAgICAgICAgICAgIGV4cG9ydHMuc2V0KElNUE9SVF9OQU1FU1BBQ0VfU1BFQ0lGSUVSLCB7IHdoZXJlVXNlZCB9KVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSlcblxuICAgICAgb2xkTmFtZXNwYWNlSW1wb3J0cy5mb3JFYWNoKHZhbHVlID0+IHtcbiAgICAgICAgaWYgKCFuZXdOYW1lc3BhY2VJbXBvcnRzLmhhcyh2YWx1ZSkpIHtcbiAgICAgICAgICBjb25zdCBpbXBvcnRzID0gb2xkSW1wb3J0UGF0aHMuZ2V0KHZhbHVlKVxuICAgICAgICAgIGltcG9ydHMuZGVsZXRlKElNUE9SVF9OQU1FU1BBQ0VfU1BFQ0lGSUVSKVxuXG4gICAgICAgICAgY29uc3QgZXhwb3J0cyA9IGV4cG9ydExpc3QuZ2V0KHZhbHVlKVxuICAgICAgICAgIGlmICh0eXBlb2YgZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIGNvbnN0IGN1cnJlbnRFeHBvcnQgPSBleHBvcnRzLmdldChJTVBPUlRfTkFNRVNQQUNFX1NQRUNJRklFUilcbiAgICAgICAgICAgIGlmICh0eXBlb2YgY3VycmVudEV4cG9ydCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgY3VycmVudEV4cG9ydC53aGVyZVVzZWQuZGVsZXRlKGZpbGUpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KVxuXG4gICAgICBuZXdJbXBvcnRzLmZvckVhY2goKHZhbHVlLCBrZXkpID0+IHtcbiAgICAgICAgaWYgKCFvbGRJbXBvcnRzLmhhcyhrZXkpKSB7XG4gICAgICAgICAgbGV0IGltcG9ydHMgPSBvbGRJbXBvcnRQYXRocy5nZXQodmFsdWUpXG4gICAgICAgICAgaWYgKHR5cGVvZiBpbXBvcnRzID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgaW1wb3J0cyA9IG5ldyBTZXQoKVxuICAgICAgICAgIH1cbiAgICAgICAgICBpbXBvcnRzLmFkZChrZXkpXG4gICAgICAgICAgb2xkSW1wb3J0UGF0aHMuc2V0KHZhbHVlLCBpbXBvcnRzKVxuXG4gICAgICAgICAgbGV0IGV4cG9ydHMgPSBleHBvcnRMaXN0LmdldCh2YWx1ZSlcbiAgICAgICAgICBsZXQgY3VycmVudEV4cG9ydFxuICAgICAgICAgIGlmICh0eXBlb2YgZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIGN1cnJlbnRFeHBvcnQgPSBleHBvcnRzLmdldChrZXkpXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGV4cG9ydHMgPSBuZXcgTWFwKClcbiAgICAgICAgICAgIGV4cG9ydExpc3Quc2V0KHZhbHVlLCBleHBvcnRzKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICh0eXBlb2YgY3VycmVudEV4cG9ydCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIGN1cnJlbnRFeHBvcnQud2hlcmVVc2VkLmFkZChmaWxlKVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCB3aGVyZVVzZWQgPSBuZXcgU2V0KClcbiAgICAgICAgICAgIHdoZXJlVXNlZC5hZGQoZmlsZSlcbiAgICAgICAgICAgIGV4cG9ydHMuc2V0KGtleSwgeyB3aGVyZVVzZWQgfSlcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pXG5cbiAgICAgIG9sZEltcG9ydHMuZm9yRWFjaCgodmFsdWUsIGtleSkgPT4ge1xuICAgICAgICBpZiAoIW5ld0ltcG9ydHMuaGFzKGtleSkpIHtcbiAgICAgICAgICBjb25zdCBpbXBvcnRzID0gb2xkSW1wb3J0UGF0aHMuZ2V0KHZhbHVlKVxuICAgICAgICAgIGltcG9ydHMuZGVsZXRlKGtleSlcblxuICAgICAgICAgIGNvbnN0IGV4cG9ydHMgPSBleHBvcnRMaXN0LmdldCh2YWx1ZSlcbiAgICAgICAgICBpZiAodHlwZW9mIGV4cG9ydHMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBjb25zdCBjdXJyZW50RXhwb3J0ID0gZXhwb3J0cy5nZXQoa2V5KVxuICAgICAgICAgICAgaWYgKHR5cGVvZiBjdXJyZW50RXhwb3J0ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICBjdXJyZW50RXhwb3J0LndoZXJlVXNlZC5kZWxldGUoZmlsZSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICdQcm9ncmFtOmV4aXQnOiBub2RlID0+IHtcbiAgICAgICAgdXBkYXRlRXhwb3J0VXNhZ2Uobm9kZSlcbiAgICAgICAgdXBkYXRlSW1wb3J0VXNhZ2Uobm9kZSlcbiAgICAgICAgY2hlY2tFeHBvcnRQcmVzZW5jZShub2RlKVxuICAgICAgfSxcbiAgICAgICdFeHBvcnREZWZhdWx0RGVjbGFyYXRpb24nOiBub2RlID0+IHtcbiAgICAgICAgY2hlY2tVc2FnZShub2RlLCBJTVBPUlRfREVGQVVMVF9TUEVDSUZJRVIpXG4gICAgICB9LFxuICAgICAgJ0V4cG9ydE5hbWVkRGVjbGFyYXRpb24nOiBub2RlID0+IHtcbiAgICAgICAgbm9kZS5zcGVjaWZpZXJzLmZvckVhY2goc3BlY2lmaWVyID0+IHtcbiAgICAgICAgICAgIGNoZWNrVXNhZ2Uobm9kZSwgc3BlY2lmaWVyLmV4cG9ydGVkLm5hbWUpXG4gICAgICAgIH0pXG4gICAgICAgIGlmIChub2RlLmRlY2xhcmF0aW9uKSB7XG4gICAgICAgICAgaWYgKFxuICAgICAgICAgICAgbm9kZS5kZWNsYXJhdGlvbi50eXBlID09PSBGVU5DVElPTl9ERUNMQVJBVElPTiB8fFxuICAgICAgICAgICAgbm9kZS5kZWNsYXJhdGlvbi50eXBlID09PSBDTEFTU19ERUNMQVJBVElPTlxuICAgICAgICAgICkge1xuICAgICAgICAgICAgY2hlY2tVc2FnZShub2RlLCBub2RlLmRlY2xhcmF0aW9uLmlkLm5hbWUpXG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChub2RlLmRlY2xhcmF0aW9uLnR5cGUgPT09IFZBUklBQkxFX0RFQ0xBUkFUSU9OKSB7XG4gICAgICAgICAgICBub2RlLmRlY2xhcmF0aW9uLmRlY2xhcmF0aW9ucy5mb3JFYWNoKGRlY2xhcmF0aW9uID0+IHtcbiAgICAgICAgICAgICAgY2hlY2tVc2FnZShub2RlLCBkZWNsYXJhdGlvbi5pZC5uYW1lKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgfVxuICB9LFxufVxuIl19