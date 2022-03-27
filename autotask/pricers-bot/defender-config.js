const fs = require('fs')
require('dotenv').config({ path: '././.env' })
var enums = require('./enums');


const infuraKey = fs.existsSync('./.infuraKey')
  ? fs
      .readFileSync('.infuraKey')
      .toString()
      .trim()
  : "put infura key inside a .infuraKey file, don't paste it here" // infura key


module.exports = {

  gammaNetworkDefaults : {
          mainnet:  {
              oracleAddress: '0x789cD7AB3742e23Ce0952F6Bc3Eb3A73A0E08833',
              addressBookAddress: '0x1E31F2DCBad4dc572004Eae6355fB18F9615cBe4',
              whitelistAddress: '0xa5EA18ac6865f315ff5dD9f1a7fb1d41A30a6779',
              strikeAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
              baseAssetDefaultBotAddress: '0xfacb407914655562d6619b0048a612b1795df783',
              blockchainExplorerApiUrl: `https://api.etherscan.io/api?`,
              blockchainExplorerApiKey: process.env.ETHERSCAN_API,
              nodeUrl:`https://mainnet.infura.io/v3/${infuraKey}`
          },
          avalanche_mainnet:  {
              oracleAddress: '0x108abfba5ad61bd61a930bfe73394558d60f0b10',
              addressBookAddress: '0xBCa124824326CF8aBc5E2E569FFf3A6f17110510',
              whitelistAddress: '0xe9963AFfc9a53e293c9bB547c52902071e6087c9',
              strikeAddress: '0xA7D7079b0FEaD91F3e65f86E8915Cb59c1a4C664',
              baseAssetDefaultBotAddress: '0x0ca7562e993341db1e435a27c9f56931306290a7',
              blockchainExplorerApiUrl: `https://api.etherscan.io/api?`,
              blockchainExplorerApiKey: process.env.ETHERSCAN_API,
              nodeUrl:`https://mainnet.infura.io/v3/${infuraKey}`
          },
          kovan:  {
            oracleAddress: '0x32724C61e948892A906f5EB8892B1E7e6583ba1f',
            addressBookAddress: '0x8812f219f507e8cfe9d2f1e790164714c5e06a73',
            whitelistAddress: '0x9164eb40a1b59512f1803ab4c2d1de4b89627a93',
            strikeAddress: '0x7e6edA50d1c833bE936492BF42C1BF376239E9e2',
            baseAssetDefaultBotAddress: '0x69ba16f3c3c4711321f50ceecb6292985d35025b',
            blockchainExplorerApiUrl: `https://api-kovan.etherscan.io/api?`,
            blockchainExplorerApiKey: process.env.ETHERSCAN_API,
            nodeUrl:`https://kovan.infura.io/v3/${infuraKey}`
        }

  },

  bots: {
    1: {
      name: 'Chainlink pricer bot: Mainnet',
      chain: 'mainnet',
      type: enums.BaseAsset,
      resourcePath: 'chains/mainnet',
      autoTaskId:'3e380513-1dc3-4e3b-b76e-43faee671bb3',
      botKey: 1
    },
    2: {
        name: 'sdcrvRenWSBTC pricer: Mainnet',
        chain: 'mainnet',
        type: enums.DerivedAsset,
        resourcePath: 'chains/mainnet',
        autoTaskId:'9320b314-0dd7-4f09-9b7d-154c40bfc1b3',
        botKey: 2
    },
    3: {
      name: 'sdFrax3Crv Pricer Bot: Mainnet code',
      chain: 'mainnet',
      type: enums.DerivedAsset,
      resourcePath: 'chains/mainnet',
      autoTaskId:'fc4f2b8e-a338-4e21-a9cb-6617faa7cfba',
      botKey: 3
    },
    4: {
      name: 'Stakedao bot oracle: mainnet code',
      chain: 'mainnet',
      type: enums.DerivedAsset,
      resourcePath: 'chains/mainnet',
      autoTaskId:'3b9fe60a-2802-4358-b47e-335dc0719e22',
      botKey: 4
    },
    5: {
      name: 'wSteth Pricer: Mainnet code',
      chain: 'mainnet',
      type: enums.DerivedAsset,
      resourcePath: 'chains/mainnet',
      autoTaskId:'a42f1204-b5b2-4247-af73-b7f21d77f71a',
      botKey: 5
    },
    6: {
      name: 'Yearn pricer bot: Mainnet code',
      chain: 'mainnet',
      type: enums.DerivedAsset,
      resourcePath: 'chains/mainnet',
      autoTaskId:'7e8ee201-87e7-4b18-b4e3-c9977ff53340',
      botKey: 6
    },
    7: {
      name: 'Chainlink pricer bot: Internal Kovan code',
      chain: 'kovan',
      type: enums.BaseAsset,
      resourcePath: 'chains/kovan',
      autoTaskId:'1ac191d0-1f99-4fc4-97ce-420016a50576',
      botKey: 7
    }, 
    8: {
      name: 'Chainlink pricer bot: Internal Mainnet code',
      chain: 'mainnet',
      type: enums.BaseAsset,
      resourcePath: 'chains/mainnet',
      autoTaskId:'85bded19-a1ea-46ce-b24a-655acb495f4c',
      botKey: 8
    },
    9: {
      name: 'Chainlink Pricer bot : Avalanche Mainnet code',
      chain: 'avalanche_mainnet',
      type: enums.BaseAsset,
      resourcePath: 'chains/avalanche_mainnet',
      autoTaskId:'5d4312cc-6424-40cb-a1f7-67f94f36bab3',
      botKey: 9
      
    }
  },

 
 
}