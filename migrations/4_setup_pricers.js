rinkeby = '0x8A753747A1Fa494EC906cE90E9f37563A8AF630e'

// import contract
const ChainlinkPricer = artifacts.require('ChainlinkPricer')
const USDCPricer = artifacts.require('USDCPricer')
const CompoundPricer = artifacts.require('CompoundPricer')
const Oracle = artifacts.require('Oracle')

// import config file
const deploymentConfig = require('./deployment-config.json')

module.exports = async function(deployer, network, [deployerAddress]) {
  let config

  if (network == 'mainnet') {
    config = deploymentConfig.MAINNET
  } else if (network == 'rinkeby') {
    config = deploymentConfig.RINKEBY
  }

  // get the oracle instance
  const oracle = await Oracle.deployed()

  // deploy USDC pricer and link to oracle
  await deployer.deploy(USDCPricer, config.USDC, oracle.address, {from: deployerAddress})
  const usdcPricer = await USDCPricer.deployed()
  await oracle.setAssetPricer(config.USDC, usdcPricer.address)

  // deploy ETH pricer and link to oracle
  await deployer.deploy(ChainlinkPricer, config.WETH, config.CHAINLINK_ETHUSDC_AGGREGATOR, oracle.address, {
    from: deployerAddress,
  })
  const ethPricer = await ChainlinkPricer.deployed()
  await oracle.setAssetPricer(config.WETH, ethPricer.address)

  // deploy cUSDC pricer and link to oracle
  await deployer.deploy(CompoundPricer, config.CUSDC, config.USDC, usdcPricer.address, oracle.address, {
    from: deployerAddress,
  })
  const cusdcPricer = await CompoundPricer.deployed()
  await oracle.setAssetPricer(config.CUSDC, cusdcPricer.address)
}
