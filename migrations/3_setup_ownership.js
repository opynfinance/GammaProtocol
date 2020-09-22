// import contract
const Whitelist = artifacts.require("Whitelist")
const Oracle = artifacts.require("Oracle")
const MarginPool = artifacts.require("MarginPool")
const AddressBook = artifacts.require("AddressBook")
const Controller = artifacts.require("Controller")

// import config file
const deploymentConfig = require("./deployment-config.json");

module.exports = async function(network, accounts) {
  const [deployerAddress] = accounts;

  if(network == "mainnet") {
    // new protocol owner
    const newOwner = deploymentConfig.MAINNET.MULTISIG

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
  } else if (network == "rinkeby") {
    // new protocol owner
    const newOwner = deploymentConfig.RINKEBY.MULTISIG

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
}
