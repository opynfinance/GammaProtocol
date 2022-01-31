// import contract
const Whitelist = artifacts.require('Whitelist')
const Oracle = artifacts.require('Oracle')
const MarginPool = artifacts.require('MarginPool')
const AddressBook = artifacts.require('AddressBook')
const Controller = artifacts.require('Controller')
const MarginCalculator = artifacts.require('MarginCalculator')
const MarginVault = artifacts.require('MarginVault')
const OToken = artifacts.require('OToken')
const OtokenFactory = artifacts.require('OtokenFactory')
const PayableProxyController = artifacts.require('PayableProxyController')
const PermitCallee = artifacts.require('PermitCallee')
const OwnedUpgradeabilityProxy = artifacts.require('OwnedUpgradeabilityProxy')

const deploymentConfig = require('./deploy-address.json')

async function transferOwner(contractName, contract) {
  const owner = await contract.owner()
  if (owner != newOwner) {
    console.log('transferring owner for', contractName)
    if (contractName == 'Controller') {
      await controller.initialize(deploymentConfig.AddressBook, newOwner)
    } else {
      await contract.transferOwnership(newOwner, { from: owner })
    }
  }
}

module.exports = async function (callback) {
  try {
    const newOwner = deploymentConfig.newOwner

    const addressbook = await AddressBook.at(deploymentConfig.AddressBook)
    const whitelist = await Whitelist.at(deploymentConfig.Whitelist)
    const oracle = await Oracle.at(deploymentConfig.Oracle)
    const pool = await MarginPool.at(deploymentConfig.MarginPool)
    const controller = await Controller.at(deploymentConfig.Controller)
    const marginCalculator = await MarginCalculator.at(deploymentConfig.MarginCalculator)
    const marginVault = await MarginVault.at(deploymentConfig.MarginVault)
    const oToken = await OToken.at(deploymentConfig.OToken)
    const oTokenFactory = await OtokenFactory.at(deploymentConfig.OtokenFactory)
    const payableProxyController = await PayableProxyController.at(deploymentConfig.PayableProxyController)
    const permitCallee = await PermitCallee.at(deploymentConfig.PermitCallee)
    const ownedUpgradeabilityProxy = await OwnedUpgradeabilityProxy.at(deploymentConfig.OwnedUpgradeabilityProxy)

    // transfer ownership
    transferOwner('AddressBook', addressbook)
    transferOwner('Whitelist', whitelist)
    transferOwner('Oracle', oracle)
    transferOwner('MarginPool', pool)
    transferOwner('Controller', controller)
    transferOwner('MarginCalculator', marginCalculator)
    transferOwner('MarginVault', marginVault)
    transferOwner('OToken', oToken)
    transferOwner('OTokenFactory', oTokenFactory)
    transferOwner('PayableProxyController', payableProxyController)
    transferOwner('PermitCallee', permitCallee)
    transferOwner('OwnedUpgradeabilityProxy', ownedUpgradeabilityProxy)

    console.log('done')
    callback()
  } catch (err) {
    callback(err)
  }
}
