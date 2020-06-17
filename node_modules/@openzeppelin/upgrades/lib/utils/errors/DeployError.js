"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class DeployError extends Error {
    constructor(error, props) {
        super(error.message);
        this.stack = error.stack;
        this.name = 'DeployError';
        Object.keys(props).forEach((prop) => (this[prop] = props[prop]));
    }
}
exports.DeployError = DeployError;
//# sourceMappingURL=DeployError.js.map