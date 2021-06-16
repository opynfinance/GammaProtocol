import '@nomiclabs/hardhat-waffle'
import 'dotenv/config'
import {HardhatUserConfig} from 'hardhat/config'
import {NetworkUserConfig} from 'hardhat/types'

const infuraApiKey = process.env.INFURA_API_KEY

if (!infuraApiKey) {
  throw new Error('Please set your INFURA_API_KEY in a .env file.')
}

const mnemonic = process.env.MNEMONIC

if (!mnemonic) {
  throw new Error('Please set your MNEMONIC in a .env file.')
}

function createNetworkConfig(network: string): NetworkUserConfig {
  const url: string = 'https://' + network + '.infura.io/v3/' + infuraApiKey
  return {
    accounts: {
      mnemonic,
    },
    url,
  }
}

export default {
  networks: {
    kovan: createNetworkConfig('kovan'),
    mainnet: createNetworkConfig('mainnet'),
    rinkeby: createNetworkConfig('rinkeby'),
    ropsten: createNetworkConfig('ropsten'),
  },
  solidity: {
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
    version: '0.6.10',
  },
} as HardhatUserConfig
