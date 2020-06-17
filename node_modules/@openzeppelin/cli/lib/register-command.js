"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const inquirer_1 = __importDefault(require("inquirer"));
const prompt_1 = require("./prompts/prompt");
const telemetry_1 = __importDefault(require("./telemetry"));
function generateSignature(name, args) {
    return [name, ...args.map(a => `[${a.name}${a.variadic ? '...' : ''}]`)].join(' ');
}
exports.generateSignature = generateSignature;
function register(program, spec, getAction) {
    validateSpec(spec);
    const signature = generateSignature(spec.name, spec.args);
    const command = program
        .command(signature, undefined, { noHelp: true })
        .description(spec.description)
        .action((...actionArgs) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        const { preAction, action } = yield getAction();
        const [cmd, params] = getCommandParams(...actionArgs);
        const abort = yield ((_a = preAction) === null || _a === void 0 ? void 0 : _a(params));
        if (abort) {
            return abort();
        }
        yield promptOrValidateAll(cmd, spec, params);
        telemetry_1.default.report(cmd.name(), params, !!params.interactive);
        yield action(params);
        process.exit(0);
    }));
    for (const opt of spec.options) {
        command.option(opt.format, opt.description, opt.default);
    }
}
exports.register = register;
// Unifies both options and positional arguments under the same interface of name + Param.
function* allParams(cmd, spec) {
    var _a;
    for (const opt of spec.options) {
        // An option's name is determined by Commander by removing the leading
        // dashes and camel-casing the flag. In order to avoid accidental
        // differences in the algorithm we look it up in the command and use
        // whatever Commander says.
        const name = (_a = cmd.options.find(o => o.flags === opt.format)) === null || _a === void 0 ? void 0 : _a.attributeName();
        if (name === undefined) {
            // Just a sanity check. Should never happen.
            throw new Error('Could not find option: ' + opt.format);
        }
        yield [name, opt];
    }
    for (const arg of spec.args) {
        yield [arg.name, arg];
    }
}
function promptOrValidateAll(cmd, spec, params) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        for (const [name, param] of allParams(cmd, spec)) {
            if (param.variadic === true) {
                yield promptOrValidateVariadic(name, param, params);
            }
            else {
                yield promptOrValidateSimple(name, param, params);
            }
            yield ((_b = (_a = param).after) === null || _b === void 0 ? void 0 : _b.call(_a, params));
        }
    });
}
function promptOrValidateVariadic(name, param, params) {
    var _a, _b, _c, _d;
    return __awaiter(this, void 0, void 0, function* () {
        const values = params[name];
        if (!Array.isArray(values)) {
            throw new Error(`Expected multiple values for ${name}`);
        }
        const details = yield ((_b = (_a = param).details) === null || _b === void 0 ? void 0 : _b.call(_a, params));
        if (details) {
            if (values.length === 0 && ((_d = (_c = details) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.prompt) !== undefined) {
                const values = [];
                for (const d of details) {
                    if (!params.interactive || prompt_1.DISABLE_INTERACTIVITY) {
                        throw new Error(`Missing required parameters ${name}`);
                    }
                    values.push(yield askQuestion(name, d));
                }
                params[name] = values;
            }
            else {
                if (details.length !== values.length) {
                    throw new Error(`Expected ${details.length} values for ${name} but got ${values.length}`);
                }
                for (const [i, d] of details.entries()) {
                    throwIfInvalid(values[i], name, d);
                }
            }
        }
    });
}
function promptOrValidateSimple(name, param, params) {
    var _a, _b, _c;
    return __awaiter(this, void 0, void 0, function* () {
        const value = params[name];
        const details = yield ((_b = (_a = param).details) === null || _b === void 0 ? void 0 : _b.call(_a, params));
        if (details) {
            if (value === undefined && ((_c = details) === null || _c === void 0 ? void 0 : _c.prompt) !== undefined) {
                if (!params.interactive || prompt_1.DISABLE_INTERACTIVITY) {
                    throw new Error(`Missing required parameter ${name}`);
                }
                params[name] = yield askQuestion(name, details);
            }
            else {
                throwIfInvalid(value, name, details);
            }
        }
    });
}
function askQuestion(name, details) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const { prompt, choices, validationError } = details;
        const type = (_a = details.promptType, (_a !== null && _a !== void 0 ? _a : (choices === undefined ? 'input' : 'list')));
        const validate = value => { var _a, _b; return _b = (_a = validationError) === null || _a === void 0 ? void 0 : _a(value), (_b !== null && _b !== void 0 ? _b : true); };
        const answers = yield inquirer_1.default.prompt({
            name: 'question',
            type,
            message: prompt,
            choices,
            validate,
            default: details.preselect,
        });
        const value = answers.question;
        // Inquirer doesn't run validations for confirm (yes/no) prompts, but we do
        // want to validate because in some cases only one answer is acceptable.
        // (e.g. --migrate-manifest)
        if (type === 'confirm' && validationError) {
            const error = validationError(value);
            if (error) {
                throw new Error(error);
            }
        }
        return value;
    });
}
function throwIfInvalid(value, name, details) {
    const { validationError, choices } = (details !== null && details !== void 0 ? details : {});
    let error;
    if (validationError) {
        error = validationError(value);
    }
    else if (choices) {
        if (!choices.some(c => (typeof c === 'object' && 'value' in c ? c.value === value : c === value))) {
            error = `Invalid ${name} '${value}'`;
        }
    }
    if (error) {
        throw new Error(error);
    }
}
// Converts the arguments that Commander passes to an action into an object
// where the key-value pairs correspond to positional arguments and options,
// and extracts the Command object.
function getCommandParams(...args) {
    const cmd = args.pop();
    const params = Object.assign({}, cmd.opts());
    for (let i = 0; i < cmd._args.length; i++) {
        params[cmd._args[i].name] = args[i];
    }
    return [cmd, params];
}
function validateSpec(spec) {
    const firstVariadic = spec.args.findIndex(arg => arg.variadic);
    if (firstVariadic !== -1 && firstVariadic < spec.args.length - 1) {
        throw new Error('Only the last positional argument can be variadic');
    }
}
//# sourceMappingURL=register-command.js.map