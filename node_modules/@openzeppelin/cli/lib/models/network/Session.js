"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = __importDefault(require("fs-extra"));
const lodash_1 = require("lodash");
const path_1 = __importDefault(require("path"));
const upgrades_1 = require("@openzeppelin/upgrades");
const constants_1 = require("../files/constants");
const defaults_1 = require("./defaults");
const state = { alreadyPrintedSessionInfo: false };
const SESSION_FILE = '.session';
const SESSION_PATH = path_1.default.join(constants_1.OPEN_ZEPPELIN_FOLDER, SESSION_FILE);
const Session = {
    getOptions(overrides = {}, silent) {
        const session = this._parseSession();
        if (!session || this._hasExpired(session))
            return this._setDefaults(overrides);
        if (!silent && !state.alreadyPrintedSessionInfo) {
            state.alreadyPrintedSessionInfo = true;
            const fields = lodash_1.omitBy(session, (v, key) => overrides[key] && overrides[key] !== v);
            upgrades_1.Loggy.noSpin(__filename, 'getOptions', `get-options`, `Using session with ${describe(fields)}`);
        }
        return Object.assign(Object.assign({}, session), overrides);
    },
    setDefaultNetworkIfNeeded(network) {
        const session = this._parseSession();
        if (!session || this._hasExpired(session))
            this.open({ network }, 0, false);
    },
    getNetwork() {
        const session = this._parseSession();
        const network = session ? session.network : undefined;
        return { network, expired: this._hasExpired(session) };
    },
    open({ network, from, timeout, blockTimeout }, expires = defaults_1.DEFAULT_EXPIRATION_TIMEOUT, logInfo = true) {
        const expirationTimestamp = new Date(new Date().getTime() + expires * 1000);
        fs_extra_1.default.writeJsonSync(SESSION_PATH, {
            network,
            from,
            timeout,
            blockTimeout,
            expires: expirationTimestamp,
        }, { spaces: 2 });
        if (logInfo) {
            upgrades_1.Loggy.noSpin(__filename, 'getOptions', `get-options`, `Using ${describe({ network, from, timeout, blockTimeout })} by default.`);
        }
    },
    close() {
        if (fs_extra_1.default.existsSync(SESSION_PATH))
            fs_extra_1.default.unlinkSync(SESSION_PATH);
        upgrades_1.Loggy.noSpin(__filename, 'getOptions', `close-session`, 'Closed openzeppelin session');
    },
    ignoreFile() {
        const GIT_IGNORE = '.gitignore';
        if (fs_extra_1.default.existsSync(GIT_IGNORE) &&
            fs_extra_1.default
                .readFileSync(GIT_IGNORE, 'utf8')
                .toString()
                .indexOf(SESSION_PATH) < 0) {
            fs_extra_1.default.appendFileSync(GIT_IGNORE, `\n${SESSION_PATH}\n`);
        }
    },
    _parseSession() {
        const session = fs_extra_1.default.existsSync(SESSION_PATH) ? fs_extra_1.default.readJsonSync(SESSION_PATH) : null;
        if (lodash_1.isEmpty(session))
            return undefined;
        const parsedSession = lodash_1.pick(session, 'network', 'timeout', 'blockTimeout', 'from', 'expires');
        return this._setDefaults(parsedSession);
    },
    _setDefaults(session) {
        if (!session.timeout)
            session.timeout = defaults_1.DEFAULT_TX_TIMEOUT;
        if (!session.blockTimeout)
            session.blockTimeout = defaults_1.DEFAULT_TX_BLOCK_TIMEOUT;
        return session;
    },
    _hasExpired(session) {
        return !!session && new Date(session.expires) <= new Date();
    },
};
function describe(session) {
    return (lodash_1.compact([
        session.network && `network ${session.network}`,
        session.from && `sender address ${session.from}`,
        session.timeout && `timeout ${session.timeout} seconds`,
        session.blockTimeout && `blockTimeout ${session.blockTimeout} blocks`,
    ]).join(', ') || 'no options');
}
exports.default = Session;
//# sourceMappingURL=Session.js.map