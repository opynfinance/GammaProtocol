const Whitelist = artifacts.require('Whitelist')

const deploymentConfig = require('./deployment-config.json')

module.exports = async function(deployer, network, accounts) {
  const [deployerAddress] = accounts

  // throw new Error('Wait, ok lah')

  const whitelist = await Whitelist.deployed()

  const weth = deploymentConfig.WETH[network]
  const wbtc = deploymentConfig.WBTC[network]
  const usdc = deploymentConfig.USDC[network]

  if (!weth || !wbtc || !usdc) {
    console.log(`Missing one of WETH, WBTC, USD, skipping this step.`)
    return
  }
  console.log(`Whitelisting WETH with address ${weth}`)
  console.log(`Whitelisting WBTC with address ${wbtc}`)
  console.log(`Whitelisting USDC with address ${usdc}`)

  // whitelist collateral
  await whitelist.whitelistCollateral(weth, {from: deployerAddress})
  await whitelist.whitelistCollateral(wbtc, {from: deployerAddress})
  await whitelist.whitelistCollateral(usdc, {from: deployerAddress})

  console.log(`whitelist assets done`)

  // whitelist ETH options
  await whitelist.whitelistProduct(weth, usdc, usdc, true, {from: deployerAddress})
  await whitelist.whitelistProduct(weth, usdc, weth, false, {from: deployerAddress})

  // whitelist WBTC options
  await whitelist.whitelistProduct(wbtc, usdc, usdc, true, {from: deployerAddress})
  await whitelist.whitelistProduct(wbtc, usdc, wbtc, false, {from: deployerAddress})
}
