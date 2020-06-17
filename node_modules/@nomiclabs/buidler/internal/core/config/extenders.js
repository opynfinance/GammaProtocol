"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ExtenderManager {
    constructor() {
        this._extenders = [];
    }
    add(extender) {
        this._extenders.push(extender);
    }
    getExtenders() {
        return this._extenders;
    }
}
exports.ExtenderManager = ExtenderManager;
//# sourceMappingURL=extenders.js.map