"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const lodash_1 = require("lodash");
const chalk_1 = __importDefault(require("chalk"));
const spinnies_1 = __importDefault(require("spinnies"));
const spinners = new spinnies_1.default({
    spinnerColor: 'blueBright',
    succeedColor: 'blueBright',
    failColor: 'redBright',
});
var LogType;
(function (LogType) {
    LogType[LogType["Info"] = 0] = "Info";
    LogType[LogType["Warn"] = 1] = "Warn";
    LogType[LogType["Err"] = 2] = "Err";
})(LogType = exports.LogType || (exports.LogType = {}));
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["Normal"] = 0] = "Normal";
    LogLevel[LogLevel["Verbose"] = 1] = "Verbose";
    LogLevel[LogLevel["Silent"] = 2] = "Silent";
})(LogLevel = exports.LogLevel || (exports.LogLevel = {}));
var SpinnerAction;
(function (SpinnerAction) {
    SpinnerAction["Add"] = "spinning";
    SpinnerAction["Update"] = "update";
    SpinnerAction["Fail"] = "fail";
    SpinnerAction["Succeed"] = "succeed";
    SpinnerAction["NonSpinnable"] = "non-spinnable";
})(SpinnerAction = exports.SpinnerAction || (exports.SpinnerAction = {}));
const defaultLogInfo = {
    logLevel: LogLevel.Normal,
    logType: LogType.Info,
    spinnerAction: SpinnerAction.Add,
};
const logTypes = {
    info: LogType.Info,
    warn: LogType.Warn,
    error: LogType.Err,
};
class Loggy {
    static silent(value) {
        this.isSilent = value;
    }
    static verbose(value) {
        this.isVerbose = value;
    }
    static testing(value) {
        this.isTesting = value;
    }
    static add(file, fnName, reference, text, { logLevel, logType, spinnerAction } = defaultLogInfo) {
        if (!logLevel)
            logLevel = LogLevel.Normal;
        if (!logType)
            logType = LogType.Info;
        if (!spinnerAction)
            spinnerAction = SpinnerAction.Add;
        this.logs[reference] = {
            file,
            fnName,
            text,
            logLevel,
            logType,
            spinnerAction,
        };
        this.log(reference);
    }
    static update(reference, { spinnerAction, text }, file) {
        if (this.logs[reference]) {
            const args = lodash_1.pickBy({ file, text, spinnerAction });
            this.logs[reference] = Object.assign(Object.assign({}, this.logs[reference]), args);
            this.log(reference);
        }
    }
    static succeed(reference, text) {
        if (!text && this.logs[reference])
            text = this.logs[reference].text;
        this.logs[reference] = Object.assign(Object.assign({}, this.logs[reference]), { spinnerAction: SpinnerAction.Succeed, text });
        this.log(reference);
    }
    static fail(reference, text) {
        if (!text && this.logs[reference])
            text = this.logs[reference].text;
        this.logs[reference] = Object.assign(Object.assign({}, this.logs[reference]), { spinnerAction: SpinnerAction.Fail, text });
        this.log(reference);
    }
    static stopAll(spinnerAction = SpinnerAction.Fail) {
        if (this.isSilent || this.isVerbose)
            return;
        spinners.stopAll(spinnerAction);
    }
    static onVerbose(file, fnName, reference, text) {
        this.add(file, fnName, reference, text, {
            logLevel: LogLevel.Verbose,
        });
    }
    static log(reference) {
        try {
            if (this.isSilent)
                return;
            const { file, fnName, text, spinnerAction, logLevel, logType } = this.logs[reference];
            const color = this.getColorFor(logType);
            if (this.isVerbose || this.isTesting) {
                const location = `${path_1.default.basename(file)}#${fnName}`;
                const message = `[${new Date().toISOString()}@${location}] <${this.actionToText(spinnerAction)}> ${text}`;
                const coloredMessage = color ? chalk_1.default.keyword(color)(message) : message;
                if (!this.isTesting)
                    console.error(coloredMessage);
            }
            else if (logLevel === LogLevel.Normal) {
                const options = color ? { text, status: spinnerAction, color } : { text, status: spinnerAction };
                !spinners.pick(reference) ? spinners.add(reference, options) : spinners.update(reference, options);
            }
        }
        catch (err) {
            if (this.isTesting)
                throw new Error(`Error logging ${reference}: ${err}`);
            else
                console.error(`Error logging ${reference}: ${err}`);
        }
    }
    static actionToText(action) {
        switch (action) {
            case SpinnerAction.Add:
                return 'started';
            case SpinnerAction.NonSpinnable:
                return 'started';
            case SpinnerAction.Succeed:
                return 'succeeded';
            case SpinnerAction.Fail:
                return 'failed';
            case SpinnerAction.Update:
                return 'updated';
            default:
                return '';
        }
    }
    static getColorFor(logType) {
        switch (logType) {
            case LogType.Err:
                return 'red';
            case LogType.Warn:
                return 'yellow';
            case LogType.Info:
                return null;
            default:
                return null;
        }
    }
}
exports.Loggy = Loggy;
Loggy.logs = {};
Loggy.isSilent = true;
Loggy.isVerbose = false;
Loggy.isTesting = false;
Loggy.spin = logSpinner(SpinnerAction.Add);
Loggy.noSpin = logSpinner(SpinnerAction.NonSpinnable);
function logSpinner(action) {
    const log = (file, fnName, reference, text) => Loggy.add(file, fnName, reference, text, {
        spinnerAction: action,
    });
    log.onVerbose = (file, fnName, reference, text) => Loggy.add(file, fnName, reference, text, {
        spinnerAction: action,
        logLevel: LogLevel.Verbose,
    });
    for (const logType in logTypes) {
        log[logType] = (file, fnName, reference, text) => Loggy.add(file, fnName, reference, text, {
            spinnerAction: action,
            logType: logTypes[logType],
        });
        log[logType].onVerbose = (file, fnName, reference, text) => Loggy.add(file, fnName, reference, text, {
            spinnerAction: action,
            logType: logTypes[logType],
            logLevel: LogLevel.Verbose,
        });
    }
    return log;
}
//# sourceMappingURL=Logger.js.map