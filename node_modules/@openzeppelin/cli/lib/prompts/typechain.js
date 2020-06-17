"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const validators_1 = require("./validators");
exports.TypechainSettingsQuestions = (force) => ({
    typechainTarget: {
        message: 'Typechain compilation target',
        type: 'list',
        choices: [
            { name: 'web3-v1 compatible', value: 'web3-v1' },
            { name: 'truffle-contract compatible', value: 'truffle' },
            { name: 'ethers.js compatible', value: 'ethers' },
        ],
        when: ({ typechainEnabled }) => typechainEnabled || force,
    },
    typechainOutdir: {
        message: 'Typechain output directory',
        type: 'input',
        validate: validators_1.notEmpty,
        default: './types/contracts/',
        when: ({ typechainEnabled }) => typechainEnabled || force,
    },
});
exports.TypechainQuestions = Object.assign({ typechainEnabled: {
        message: 'Enable typechain support?',
        type: 'confirm',
        default: true,
        when: () => fs_1.default.existsSync('tsconfig.json'),
    } }, exports.TypechainSettingsQuestions(false));
//# sourceMappingURL=typechain.js.map