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
const axios_1 = __importDefault(require("axios"));
const cheerio_1 = __importDefault(require("cheerio"));
const querystring_1 = __importDefault(require("querystring"));
const upgrades_1 = require("@openzeppelin/upgrades");
// Max number of API request retries on error
const RETRY_COUNT = 3;
// Time to sleep between retries for API requests
const RETRY_SLEEP_TIME = 5000;
const Verifier = {
    verifyAndPublish(remote, params) {
        return __awaiter(this, void 0, void 0, function* () {
            if (remote === 'etherchain') {
                yield publishToEtherchain(params);
            }
            else if (remote === 'etherscan') {
                yield publishToEtherscan(params);
            }
            else {
                throw Error('Invalid remote. Currently, the OpenZeppelin contract verifier supports only etherchain and etherscan as remote verification applications.');
            }
        });
    },
};
function publishToEtherchain(params) {
    return __awaiter(this, void 0, void 0, function* () {
        if (params.network !== 'mainnet') {
            throw new Error('Invalid network. Currently, etherchain supports only mainnet');
        }
        const etherchainVerificationUrl = 'https://www.etherchain.org/tools/verifyContract';
        const etherchainContractUrl = 'https://www.etherchain.org/account';
        const { compilerVersion, optimizer, contractAddress } = params;
        const compiler = `soljson-v${compilerVersion.replace('.Emscripten.clang', '')}.js`;
        const optimizerStatus = optimizer ? 'Enabled' : 'Disabled';
        try {
            const response = yield axios_1.default.request({
                method: 'POST',
                url: etherchainVerificationUrl,
                data: querystring_1.default.stringify(Object.assign(Object.assign({}, params), { compilerVersion: compiler, optimizer: optimizerStatus })),
                headers: {
                    'Content-type': 'application/x-www-form-urlencoded',
                },
            });
            if (response.status === 200) {
                const html = cheerio_1.default.load(response.data);
                const message = html('#infoModal .modal-body').text();
                if (message.match(/successful/)) {
                    upgrades_1.Loggy.succeed('verify-and-publish', `Contract source code of ${params.contractName} verified and published successfully. You can check it here: ${etherchainContractUrl}/${contractAddress}#code`);
                }
                else if (message.match(/^No[\w\s]*provided\.$/)) {
                    throw new Error(`Error during contract verification: ${message}`);
                }
                else {
                    throw new Error(message);
                }
            }
        }
        catch (error) {
            throw Error(error.message || 'Error while trying to publish contract');
        }
    });
}
function publishToEtherscan(params) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!params.apiKey) {
            throw Error('Etherscan API key not specified. To get one, follow this link: https://etherscan.io/myapikey');
        }
        const { network, compilerVersion, optimizer, contractAddress } = params;
        const compiler = `v${compilerVersion.replace('.Emscripten.clang', '')}`;
        const optimizerStatus = optimizer ? 1 : 0;
        const apiSubdomain = setEtherscanApiSubdomain(network);
        const etherscanApiUrl = `https://${apiSubdomain}.etherscan.io/api`;
        const networkSubdomain = network === 'mainnet' ? '' : `${network}.`;
        const etherscanContractUrl = `https://${networkSubdomain}etherscan.io/address`;
        try {
            const response = yield axios_1.default.request({
                method: 'POST',
                url: etherscanApiUrl,
                data: querystring_1.default.stringify({
                    apikey: params.apiKey,
                    module: 'contract',
                    action: 'verifysourcecode',
                    contractaddress: contractAddress,
                    sourceCode: params.contractSource,
                    contractname: params.contractName,
                    compilerversion: compiler,
                    optimizationUsed: optimizerStatus,
                    runs: params.optimizerRuns,
                }),
                headers: {
                    'Content-type': 'application/x-www-form-urlencoded',
                },
            });
            if (response.status === 200 && response.data.status === '1') {
                yield checkEtherscanVerificationStatus(response.data.result, etherscanApiUrl, RETRY_COUNT);
                upgrades_1.Loggy.succeed('verify-and-publish', `Contract source code of ${params.contractName} verified and published successfully. You can check it here: ${etherscanContractUrl}/${contractAddress}#code`);
            }
            else {
                throw new Error(`Error while trying to verify contract: ${response.data.result}`);
            }
        }
        catch (error) {
            throw new Error(error.message || 'Error while trying to verify contract');
        }
    });
}
function checkEtherscanVerificationStatus(guid, etherscanApiUrl, retries = RETRY_COUNT) {
    return __awaiter(this, void 0, void 0, function* () {
        const queryParams = querystring_1.default.stringify({
            guid,
            action: 'checkverifystatus',
            module: 'contract',
        });
        try {
            const response = yield axios_1.default.request({
                method: 'GET',
                url: `${etherscanApiUrl}?${queryParams}`,
            });
            if (response.data.status !== '1') {
                throw new Error(`Error while trying to verify contract: ${response.data.result}`);
            }
        }
        catch (error) {
            if (retries === 0)
                throw new Error(error.message || 'Error while trying to check verification status');
            yield upgrades_1.sleep(RETRY_SLEEP_TIME);
            yield checkEtherscanVerificationStatus(guid, etherscanApiUrl, retries - 1);
        }
    });
}
function setEtherscanApiSubdomain(network) {
    switch (network) {
        case 'mainnet':
            return 'api';
        case 'rinkeby':
            return 'api-rinkeby';
        case 'ropsten':
            return 'api-ropsten';
        case 'kovan':
            return 'api-kovan';
        case 'goerli':
            return 'api-goerli';
        default:
            throw new Error('Invalid network. Currently, etherscan supports mainnet, rinkeby, ropsten, goerli and kovan');
    }
}
exports.default = Verifier;
//# sourceMappingURL=Verifier.js.map