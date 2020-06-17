"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const upgrades_1 = require("@openzeppelin/upgrades");
const GENERIC_ERROR_MESSAGE = 'There was an undefined error. Please execute the same command again in verbose mode if necessary.';
function handle(error, verbose = false) {
    if (!verbose) {
        upgrades_1.Loggy.stopAll();
        const errorMessage = error.message || GENERIC_ERROR_MESSAGE;
        upgrades_1.Loggy.noSpin.error(__filename, 'call', 'error-message', errorMessage);
    }
    else {
        upgrades_1.Loggy.noSpin.error(__filename, 'call', 'error-message', error.stack);
    }
    process.exit(1);
}
function registerErrorHandler(program) {
    const handler = (error) => handle(error, program.verbose);
    process.on('unhandledRejection', handler);
    process.on('uncaughtException', handler);
    program.on('command:*', function () {
        console.error(`Invalid command: ${program.args.join(' ')}\nSee --help for a list of available commands.`);
        process.exit(1);
    });
}
exports.default = registerErrorHandler;
//# sourceMappingURL=errors.js.map