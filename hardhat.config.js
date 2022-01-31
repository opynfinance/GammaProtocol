/**
 * @type import('hardhat/config').HardhatUserConfig
 */
require('dotenv').config()
const fs = require('fs')
require('@nomiclabs/hardhat-etherscan')

const key = fs.existsSync('.infuraKey')
  ? fs.readFileSync('.infuraKey').toString().trim()
  : "put infura key inside a .infuraKey file, don't paste it here" // infura key
const mnemonic = fs.existsSync('.secret')
  ? fs.readFileSync('.secret').toString().trim()
  : "put mnemonic into .secret file, don't paste it here" // deployer wallet mnemonic

module.exports = {
  networks: {
    hardhat: {},
    polygon: {
      url: `https://polygon-mainnet.infura.io/v3/${key}`,
      accounts: {
        mnemonic: mnemonic,
      },
      chainId: 137,
    },
  },
  solidity: {
    version: '0.6.10',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  etherscan: {
    apiKey: {
      polygon: process.env.POLYGONSCAN_API,
    },
  },
}
