// import contract
const Whitelist = artifacts.require('Whitelist')
const Oracle = artifacts.require('Oracle')
const MarginPool = artifacts.require('MarginPool')
const AddressBook = artifacts.require('AddressBook')
const Controller = artifacts.require('Controller')

// import config file
const deploymentConfig = require('./deployment-config.json')

module.exports = async function(deployer, network, [deployerAddress]) {
  // switch this to true if want to transfer ownership right after deployment
  const updateOwner = false

  if (!updateOwner) return

  let config
  if (network == 'mainnet') {
    config = deploymentConfig.MAINNET
  } else if (network == 'rinkeby') {
    config = deploymentConfig.RINKEBY
  }

  // new protocol owner
  const newOwner = config.MULTISIG

  const addressbook = await AddressBook.deployed()
  const whitelist = await Whitelist.deployed()
  const oracle = await Oracle.deployed()
  const pool = await MarginPool.deployed()
  const controller = await Controller.deployed()

  // transfer ownership
  await addressbook.transferOwnership(newOwner, {from: deployerAddress})
  await whitelist.transferOwnership(newOwner, {from: deployerAddress})
  await oracle.transferOwnership(newOwner, {from: deployerAddress})
  await pool.transferOwnership(newOwner, {from: deployerAddress})
  await controller.transferOwnership(newOwner, {from: deployerAddress})
}
