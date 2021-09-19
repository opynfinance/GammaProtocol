// import contract
const Whitelist = artifacts.require('Whitelist')
const Oracle = artifacts.require('Oracle')
const MarginPool = artifacts.require('MarginPool')
const AddressBook = artifacts.require('AddressBook')
const Controller = artifacts.require('Controller')

const MarginVault = artifacts.require('MarginVault')
const MarginCalculator = artifacts.require('MarginCalculator')

// import config file
const deploymentConfig = require('./deployment-config.json')

module.exports = async function(deployer, network, accounts) {
  // // new protocol owner
  const newOwner = deploymentConfig.MULTISIG[network]
  if (!newOwner) {
    console.log(`No multisig address found on network ${network}, skipping this step..`)
    return
  }
  const addressbook = await AddressBook.deployed()
  const whitelist = await Whitelist.deployed()
  const oracle = await Oracle.deployed()
  const pool = await MarginPool.deployed()
  const calculator = await MarginCalculator.deployed()
  const controller = await Controller.at(await addressbook.getController())
  // transfer ownership
  await calculator.transferOwnership(newOwner, {from: deployerAddress})
  await addressbook.transferOwnership(newOwner, {from: deployerAddress})
  await whitelist.transferOwnership(newOwner, {from: deployerAddress})
  await oracle.transferOwnership(newOwner, {from: deployerAddress})
  await pool.transferOwnership(newOwner, {from: deployerAddress})
  await controller.transferOwnership(newOwner, {from: deployerAddress})
}
