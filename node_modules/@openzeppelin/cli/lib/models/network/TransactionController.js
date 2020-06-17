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
const lodash_1 = require("lodash");
const upgrades_1 = require("@openzeppelin/upgrades");
const units_1 = require("../../utils/units");
const constants_1 = require("../../utils/constants");
const async_1 = require("../../utils/async");
const ContractManager_1 = __importDefault(require("../local/ContractManager"));
const ProjectFile_1 = __importDefault(require("../files/ProjectFile"));
const NetworkFile_1 = __importDefault(require("../files/NetworkFile"));
const events_1 = require("../../utils/events");
const { getABIFunction, callDescription } = upgrades_1.ABI;
class TransactionController {
    constructor(txParams, network, networkFile) {
        if (txParams)
            this.txParams = txParams;
        if (!networkFile) {
            this.projectFile = new ProjectFile_1.default();
            this.networkFile = new NetworkFile_1.default(this.projectFile, network);
        }
        else {
            this.networkFile = networkFile;
            this.projectFile = this.networkFile.projectFile;
        }
    }
    transfer(to, amount, unit) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!units_1.isValidUnit(unit)) {
                throw Error(`Invalid unit ${unit}. Please try with: wei, kwei, gwei, milli, ether or any other valid unit.`);
            }
            const validUnit = unit.toLowerCase();
            const value = units_1.toWei(amount, validUnit);
            upgrades_1.Loggy.spin(__filename, 'transfer', 'transfer-funds', `Sending ${amount} ${validUnit} to ${to}`);
            const { transactionHash } = yield upgrades_1.Transactions.sendRawTransaction(to, { value }, this.txParams);
            upgrades_1.Loggy.succeed('transfer-funds', `Funds sent. Transaction hash: ${transactionHash}`);
        });
    }
    getBalanceOf(accountAddress, contractAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            if (contractAddress) {
                const { balance, tokenSymbol, tokenDecimals } = yield this.getTokenInfo(accountAddress, contractAddress);
                upgrades_1.Loggy.noSpin(__filename, 'getBalanceOf', 'balance-of', `Balance: ${units_1.prettifyTokenAmount(balance, tokenDecimals, tokenSymbol)}`);
                return balance;
            }
            else {
                const balance = yield upgrades_1.ZWeb3.eth.getBalance(accountAddress);
                upgrades_1.Loggy.noSpin(__filename, 'getBalanceOf', 'balance-of', `Balance: ${units_1.fromWei(balance, 'ether')} ETH`);
                return balance;
            }
        });
    }
    callContractMethod(proxyAddress, methodName, methodArgs) {
        return __awaiter(this, void 0, void 0, function* () {
            const { method, contract } = this.getContractAndMethod(proxyAddress, methodName, methodArgs);
            try {
                upgrades_1.Loggy.spin(__filename, 'callContractMethod', 'call-contract-method', `Calling: ${callDescription(method, methodArgs)}`);
                const result = yield contract.methods[methodName](...methodArgs).call(Object.assign({}, this.txParams));
                const parsedResult = this.parseFunctionCallResult(result);
                lodash_1.isNull(parsedResult) || lodash_1.isUndefined(parsedResult) || parsedResult === '()' || parsedResult.length === 0
                    ? upgrades_1.Loggy.succeed('call-contract-method', `Method '${methodName}' returned empty.`)
                    : upgrades_1.Loggy.succeed('call-contract-method', `Method '${methodName}' returned: ${parsedResult}`);
                return result;
            }
            catch (error) {
                throw Error(`Error while trying to call ${proxyAddress}#${methodName}. ${error}`);
            }
        });
    }
    sendTransaction(proxyAddress, methodName, methodArgs) {
        return __awaiter(this, void 0, void 0, function* () {
            const { method, contract } = this.getContractAndMethod(proxyAddress, methodName, methodArgs);
            try {
                upgrades_1.Loggy.spin(__filename, 'sendTransaction', 'send-transaction', `Calling: ${callDescription(method, methodArgs)}`);
                const { transactionHash, events } = yield upgrades_1.Transactions.sendTransaction(contract.methods[methodName], methodArgs, this.txParams);
                upgrades_1.Loggy.succeed('send-transaction', `Transaction successful. Transaction hash: ${transactionHash}`);
                if (!lodash_1.isEmpty(events))
                    events_1.describeEvents(events);
            }
            catch (error) {
                throw Error(`Error while trying to send transaction to ${proxyAddress}. ${error}`);
            }
        });
    }
    getTokenInfo(accountAddress, contractAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            let balance, tokenSymbol, tokenDecimals;
            try {
                const contract = new upgrades_1.ZWeb3.eth.Contract(constants_1.ERC20_PARTIAL_ABI, contractAddress);
                balance = yield contract.methods.balanceOf(accountAddress).call();
                [tokenSymbol, tokenDecimals] = yield async_1.allPromisesOrError([
                    contract.methods.symbol().call(),
                    contract.methods.decimals().call(),
                ]);
            }
            catch (error) {
                if (!balance) {
                    error.message = `Could not get balance of ${accountAddress} in ${contractAddress}. Error: ${error.message}`;
                    throw error;
                }
            }
            return { balance, tokenSymbol, tokenDecimals };
        });
    }
    getContractAndMethod(address, methodName, methodArgs) {
        if (!this.networkFile.hasProxies({ address }))
            throw Error(`Contract at address ${address} not found.`);
        const { package: packageName, contract: contractName } = this.networkFile.getProxy(address);
        const contractManager = new ContractManager_1.default(this.projectFile);
        const contract = contractManager.getContractClass(packageName, contractName).at(address);
        const method = getABIFunction(contract, methodName, methodArgs);
        return { contract, method };
    }
    parseFunctionCallResult(result) {
        if (Array.isArray(result)) {
            return `[${result}]`;
        }
        else if (result !== null && typeof result === 'object') {
            return `(${Object.values(result).join(', ')})`;
        }
        return result;
    }
}
exports.default = TransactionController;
//# sourceMappingURL=TransactionController.js.map