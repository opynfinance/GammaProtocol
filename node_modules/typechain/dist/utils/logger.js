"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Logger {
    log(...args) {
        if (!global.IS_CLI) {
            return;
        }
        // tslint:disable-next-line
        console.log(...args);
    }
    warn(...args) {
        if (!global.IS_CLI) {
            return;
        }
        // tslint:disable-next-line
        console.warn(...args);
    }
    error(...args) {
        if (!global.IS_CLI) {
            return;
        }
        // tslint:disable-next-line
        console.error(...args);
    }
}
exports.Logger = Logger;
exports.logger = new Logger();
