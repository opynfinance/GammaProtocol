"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class MalformedAbiError extends Error {
    constructor(message) {
        super(message);
    }
}
exports.MalformedAbiError = MalformedAbiError;
