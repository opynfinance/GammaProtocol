"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function fromEntries(entries) {
    return Object.assign({}, ...entries.map(([name, value]) => ({
        [name]: value,
    })));
}
exports.fromEntries = fromEntries;
//# sourceMappingURL=lang.js.map