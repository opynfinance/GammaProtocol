"use strict";
// in order to properly stub and mock libs which export function by default
// more https://github.com/sinonjs/sinon/issues/562
Object.defineProperty(exports, "__esModule", { value: true });
exports.cache = {};
function default_1(lib) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const module = require(lib);
    if (!exports.cache.hasOwnProperty(lib))
        exports.cache[lib] = module;
    return (...args) => exports.cache[lib].apply(this, args);
}
exports.default = default_1;
//# sourceMappingURL=patch.js.map