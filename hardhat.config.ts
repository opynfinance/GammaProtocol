import { Wallet } from "@ethersproject/wallet"
import "@nomiclabs/hardhat-ethers"
import "@nomiclabs/hardhat-etherscan"
import "@nomiclabs/hardhat-waffle"
import "@typechain/hardhat"
import * as dotenv from "dotenv"

const ethers = require("ethers")
const bip39 = require("bip39")
dotenv.config({ path: __dirname + "/.env" })

const mnemonic = process.env.TEST_MNEMONIC || bip39.generateMnemonic()

let accounts
let hardhatEvmAccounts
if (mnemonic) {
	accounts = {
		mnemonic
	}
	hardhatEvmAccounts = []
	for (let i = 0; i < 10; i++) {
		const wallet = Wallet.fromMnemonic(mnemonic, "m/44'/60'/0'/0/" + i)
		hardhatEvmAccounts.push({
			privateKey: wallet.privateKey,
			balance: "1000000000000000000000"
		})
	}
}
const ropsten = process.env.ROPSTEN || new ethers.providers.InfuraProvider("ropsten").connection.url

const rinkeby = process.env.RINKEBY || new ethers.providers.InfuraProvider("rinkeby").connection.url

module.exports = {
	typechain: {
		outDir: "types",
		target: "ethers-v5"
	},
	contractSizer: {
		alphaSort: false,
		runOnCompile: true,
		disambiguatePaths: false
	},
	solidity: {
		compilers: [
			{
				version: "0.6.8",
				settings: {
					optimizer: {
						enabled: true,
						runs: 200
					}
				}
			},
			{
				version: "0.6.10",
				settings: {
					optimizer: {
						enabled: true,
						runs: 200
					}
				}
			},
			{
				version: "0.8.9",
				settings: {
					optimizer: {
						enabled: true,
						runs: 200
					}
				}
			},
			{
				version: "0.8.10",
				settings: {
					optimizer: {
						enabled: true,
						runs: 200
					}
				}
			},
			{
				version: "0.8.12",
				settings: {
					optimizer: {
						enabled: true,
						runs: 200
					}
				}
			}
		]
	},
	namedAccounts: {
		deployer: 0,
		admin: "0xA0b4E98dB8Be8A3a6D8506dD5f3a826855633cb3"
	},
	networks: {
		mainnetFork: {
			chainId: 1,
			url: `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY}`,
			forking: {
				blockNumber: 12821000
			}
		},
		hardhat: {
			gas: 12000000,
			blockGasLimit: 0x1fffffffffffff,
			allowUnlimitedContractSize: true,
			chainId: 1337
		},
		ropsten: {
			url: ropsten,
			accounts,
			chainId: 3
		},
		rinkeby: {
			url: rinkeby,
			accounts,
			chainId: 4,
			saveDeployments: true
		},
		arbitrumrinkeby: {
			url: `https://arb-rinkeby.g.alchemy.com/v2/${process.env.ALCHEMY}`,
			accounts,
			chainId: 421611,
			gas: 10000000000,
			saveDeployments: true
		}
	},
	etherscan: {
		apiKey: process.env.ETHERSCAN
	}
}
