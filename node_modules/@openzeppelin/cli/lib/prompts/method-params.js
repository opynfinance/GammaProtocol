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
Object.defineProperty(exports, "__esModule", { value: true });
const upgrades_1 = require("@openzeppelin/upgrades");
const lodash_1 = require("lodash");
const input_1 = require("../utils/input");
const prompt_1 = require("./prompt");
function promptForMethodParams(contractFullName, options, additionalOpts = {}, constant = upgrades_1.ContractMethodMutability.NotConstant) {
    return __awaiter(this, void 0, void 0, function* () {
        const { interactive } = options;
        let { methodName, methodArgs } = input_1.parseMethodParams(options, 'initialize');
        const opts = Object.assign(Object.assign({}, additionalOpts), { methodName });
        const methodProps = getCommandProps(contractFullName, methodName, methodArgs, constant, additionalOpts);
        // prompt for method name if not provided
        ({ methodName } = yield prompt_1.promptIfNeeded({ opts, props: methodProps }, interactive));
        const methodArgsKeys = prompt_1.argsList(contractFullName, methodName.selector, constant).reduce((accum, { name: current }) => (Object.assign(Object.assign({}, accum), { [current]: undefined })), {});
        // if there are no methodArgs defined, or the methodArgs array length provided is smaller than the
        // number of arguments in the function, prompt for remaining arguments
        if (!methodArgs || methodArgs.length < Object.keys(methodArgsKeys).length) {
            const methodArgsProps = getCommandProps(contractFullName, methodName.selector, methodArgs, constant);
            const promptedArgs = yield prompt_1.promptIfNeeded({ opts: methodArgsKeys, props: methodArgsProps }, interactive);
            methodArgs = [...methodArgs, ...Object.values(lodash_1.pickBy(promptedArgs, lodash_1.negate(lodash_1.isUndefined)))];
        }
        return { methodName: methodName.selector, methodArgs };
    });
}
exports.default = promptForMethodParams;
function getCommandProps(contractFullName, methodName, methodArgs, constant, additionalOpts = {}) {
    const methods = prompt_1.methodsList(contractFullName, constant);
    const args = prompt_1.argsList(contractFullName, methodName, constant).reduce((accum, arg, index) => {
        return Object.assign(Object.assign({}, accum), { [arg.name]: {
                message: `${prompt_1.argLabel(arg)}:`,
                type: 'input',
                when: () => !methodArgs || !methodArgs[index],
                validate: (input) => {
                    try {
                        input_1.parseArg(input, arg);
                        return true;
                    }
                    catch (err) {
                        const placeholder = input_1.getSampleInput(arg);
                        const msg = placeholder ? `Enter a valid ${arg.type} such as: ${placeholder}` : `Enter a valid ${arg.type}`;
                        return `${err.message}. ${msg}.`;
                    }
                },
                normalize: input => input_1.parseArg(input, arg),
            } });
    }, {});
    return Object.assign({ askForMethodParams: {
            type: 'confirm',
            message: additionalOpts['askForMethodParamsMessage'],
            when: () => methods.length !== 0 && methodName !== 'initialize' && additionalOpts.hasOwnProperty('askForMethodParams'),
        }, methodName: {
            type: 'list',
            message: 'Select which function',
            choices: methods,
            when: ({ askForMethodParams }) => !additionalOpts.hasOwnProperty('askForMethodParams') ||
                (additionalOpts.hasOwnProperty('askForMethodParams') && askForMethodParams),
            normalize: input => {
                if (typeof input !== 'object') {
                    return { name: input, selector: input };
                }
                else
                    return input;
            },
        } }, args);
}
//# sourceMappingURL=method-params.js.map