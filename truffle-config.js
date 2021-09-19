require('ts-node/register')
const wrapProvider = require('arb-ethers-web3-bridge').wrapProvider
require('dotenv').config()

const HDWalletProvider = require('@truffle/hdwallet-provider')

const fs = require('fs')
const mnemonic = fs.existsSync('.secret')
  ? fs
      .readFileSync('.secret')
      .toString()
      .trim()
  : "put mnemonic into .secret file, don't paste it here" // deployer wallet mnemonic
const key = fs.existsSync('.infuraKey')
  ? fs
      .readFileSync('.infuraKey')
      .toString()
      .trim()
  : "put infura key inside a .infuraKey file, don't paste it here" // infura key

module.exports = {
  networks: {
    development: {
      host: '127.0.0.1',
      port: 8545,
      network_id: '*',
    },
    rinkeby: {
      provider: () => new HDWalletProvider(mnemonic, `https://rinkeby.infura.io/v3/${key}`),
      network_id: 4,
      timeoutBlocks: 2000,
      skipDryRun: true,
      gasPrice: 100000000000,
    },
    ropsten: {
      provider: () => new HDWalletProvider(mnemonic, `https://ropsten.infura.io/v3/${key}`),
      network_id: 3,
      timeoutBlocks: 2000,
      skipDryRun: true,
      gasPrice: 100000000000,
    },
    kovan: {
      provider: () => {
        return new HDWalletProvider(mnemonic, `https://kovan.infura.io/v3/${key}`)
      },
      network_id: 42,
      gas: 6700000,
    },
    ropsten: {
      provider: () => {
        return new HDWalletProvider(mnemonic, `https://ropsten.infura.io/v3/${key}`)
      },
      network_id: 3,
      gasPrice: 50000000000,
      gas: 4000000,
    },
    mainnet: {
      provider: () => new HDWalletProvider(mnemonic, `https://mainnet.infura.io/v3/${key}`),
      network_id: 1,
      chain_id: 1,
      confirmations: 2,
      timeoutBlocks: 50,
      skipDryRun: false,
      gasPrice: 120000000000,
    },
    arbitrum_testnet: {
      // gas: 200000000,
      network_id: 421611,
      provider: () => new HDWalletProvider(mnemonic, `https://rinkeby.arbitrum.io/rpc`),
      gasPrice: 30000000, // 0.03 gwei
    },
    arbitrum_mainnet: {
      network_id: 42161,
      chain_id: 42161,
      gasPrice: 600000000, // 0.6 gwei
      provider: () => new HDWalletProvider(mnemonic, `https://arb1.arbitrum.io/rpc`),
    },
  },

  mocha: {
    reporter: 'eth-gas-reporter',
    reporterOptions: {
      currency: 'USD',
      artifactType: 'truffle-v5',
      coinmarketcap: process.env.COINMARKETCAP_API,
      excludeContracts: ['Migrations'],
      showTimeSpent: true,
    },
  },

  plugins: ['solidity-coverage', 'truffle-contract-size', 'truffle-plugin-verify'],

  api_keys: {
    etherscan: process.env.ETHERSCAN_API,
  },

  compilers: {
    solc: {
      version: '0.6.10',
      settings: {
        optimizer: {
          enabled: true,
          runs: 1,
        },
      },
    },
  },
}
