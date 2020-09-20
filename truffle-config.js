require('ts-node/register')
require('dotenv').config()

const HDWalletProvider = require('@truffle/hdwallet-provider');

const fs = require('fs');
const mnemonic = fs.readFileSync(".secret").toString().trim();  // deployer wallet mnemonic
const key = fs.readFileSync(".infuraKey").toString().trim();    // infura key

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
      gasPrice: 100000000000
    },
    kovan: {
      provider: () => {
        return new HDWalletProvider(mnemonic, `https://kovan.infura.io/v3/${key}`);
      },
      network_id: 42,
      gas: 6700000,
    },
    mainnet: {
      provider: () => new HDWalletProvider(mnemonic, `https://mainnet.infura.io/v3/${key}`),
      network_id: 1,
      chain_id: 1,
      confirmations: 2,   
      timeoutBlocks: 50,  
      skipDryRun: false,
      gasPrice: 400000000000
    }
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

  plugins: ['solidity-coverage', 'truffle-contract-size'],

  compilers: {
    solc: {
      version: '0.6.10',
      settings: {
        optimizer: {
          enabled: true,
          runs: 200,
        },
      },
    },
  },
}
