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

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

module.exports = async function(deployer, network, accounts) {
  // const [deployerAddress] = accounts
  // // new protocol owner
  // const newOwner = deploymentConfig.MULTISIG
  // const addressbook = await AddressBook.deployed()
  // const whitelist = await Whitelist.deployed()
  // const oracle = await Oracle.deployed()
  // const pool = await MarginPool.deployed()
  // const controller = await Controller.at(await addressbook.getController())
  // transfer ownership
  // await addressbook.transferOwnership(newOwner, {from: deployerAddress})
  // await whitelist.transferOwnership(newOwner, {from: deployerAddress})
  // await oracle.transferOwnership(newOwner, {from: deployerAddress})
  // await pool.transferOwnership(newOwner, {from: deployerAddress})
  // await controller.transferOwnership(newOwner, {from: deployerAddress})
}
