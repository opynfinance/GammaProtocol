"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const state = {
    silent: false,
};
function log(...args) {
    if (!state.silent && process.env.NODE_ENV !== 'test') {
        console.log(...args);
    }
}
exports.default = log;
function silent(value) {
    state.silent = value;
}
exports.silent = silent;
//# sourceMappingURL=stdout.js.map