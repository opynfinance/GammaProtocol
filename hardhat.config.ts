import '@nomiclabs/hardhat-waffle'
import {existsSync, readFileSync} from 'fs'
import {HardhatUserConfig} from 'hardhat/config'
import {NetworkUserConfig} from 'hardhat/types'

if (!existsSync('.infuraKey')) {
  throw new Error("Put infura api key inside a .infuraKey file, don't paste it in the config.") // infura api key
}

if (!existsSync('.secret')) {
  throw new Error("Put mnmenoic into a .secret file, don't paste it in the config.") // deployer wallet mnemonic
}

const infuraApiKey = readFileSync('.infuraKey')
  .toString()
  .trim()

const mnemonic = readFileSync('.secret')
  .toString()
  .trim()

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
