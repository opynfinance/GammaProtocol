import '@nomiclabs/hardhat-waffle';
import '@nomiclabs/hardhat-etherscan';
import '@typechain/hardhat';

import "dotenv/config"
import * as fs from 'fs';
import "hardhat-contract-sizer"
import "hardhat-gas-reporter"
import { HardhatUserConfig } from 'hardhat/config';
import 'solidity-coverage';
import "@nomiclabs/hardhat-web3";


const mnemonic = fs.existsSync('.secret')
  ? fs
      .readFileSync('.secret')
      .toString()
      .trim()
  : 'test test test test test test test test test test test junk';

const infuraKey = process.env.INFURA_KEY;
const etherscanKey = process.env.ETHERSCAN_KEY;

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

export default {
  networks: {
    // hardhat: {
    //   forking: {
    //     enabled: process.env.FORK === 'true',
    //     url: `https://eth-mainnet.alchemyapi.io/v2/SR-wBhpxMirgFtp4OGeJoWKO1ObmVeFg`,
    //   },
    //   initialBaseFeePerGas: 0 // workaround for eip-1559 (solidity-coverage)
    // },
    ropsten: {
      url: `https://ropsten.infura.io/v3/${infuraKey}`,
      accounts: {
        mnemonic
      }
    },
    kovan: {
      url: `https://kovan.infura.io/v3/${infuraKey}`,
      accounts: {
        mnemonic
      }
    }
  },
  solidity: {
  settings: {
    optimizer: {
      enabled: true,
      runs: 200
    },
  },
    version: '0.6.10',
  },
  namedAccounts: {
    deployer: 0,
  },
  typechain: {
    outDir: 'typechain',
    target: 'ethers-v5'
  },
  contractSizer: {
    alphaSort: true,
    runOnCompile: process.env.COVERAGE ? false: true,
    disambiguatePaths: false,
  },
  gasReporter: {
    currency: 'USD',
    gasPrice: 43,
    enabled: true,
  },
  etherscan: {
    apiKey: etherscanKey
  },
  mocha: {
    timeout: 40000
    
  }
} as HardhatUserConfig;
