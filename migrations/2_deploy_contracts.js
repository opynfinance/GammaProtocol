// import library
const MarginVault = artifacts.require('MarginVault')
// import contract
const OtokenFactory = artifacts.require('OtokenFactory')
const Otoken = artifacts.require('Otoken')
const Whitelist = artifacts.require('Whitelist')
const Oracle = artifacts.require('Oracle')
const MarginPool = artifacts.require('MarginPool')
const MarginCalculator = artifacts.require('MarginCalculator')
const AddressBook = artifacts.require('AddressBook')
const Controller = artifacts.require('Controller')

module.exports = async function(deployer, network, accounts) {
  const [deployerAddress] = accounts

  // deploy AddressBook & transfer ownership
  // await deployer.deploy(AddressBook, {from: deployerAddress})
  // const addressbook = await AddressBook.deployed()
  const addressbook = await AddressBook.at('0x9a33230f59Cc7Cc9A084E0098A2b2934FC7BF7c0')
  // 0x9a33230f59Cc7Cc9A084E0098A2b2934FC7BF7c0

  // deploy Otoken implementation & set address
  await deployer.deploy(Otoken, {from: deployerAddress, gas: 200000000})
  const otokenImpl = await Otoken.deployed()
  await addressbook.setOtokenImpl(otokenImpl.address, {from: deployerAddress})

  // deploy OtokenFactory & set address
  // await deployer.deploy(OtokenFactory, addressbook.address, {from: deployerAddress})
  // const otokenFactory = await OtokenFactory.deployed()
  // 0x4D3a52A0e98144CAf46Ac226d83e8f144b5c654D
  // await addressbook.setOtokenFactory(otokenFactory.address, {from: deployerAddress})

  // deploy Whitelist module & set address
  await deployer.deploy(Whitelist, addressbook.address, {from: deployerAddress})
  const whitelist = await Whitelist.deployed()
  await addressbook.setWhitelist(whitelist.address, {from: deployerAddress})

  // deploy Oracle module & set address
  await deployer.deploy(Oracle, {from: deployerAddress})
  const oracle = await Oracle.deployed()
  await addressbook.setOracle(oracle.address, {from: deployerAddress})

  // deploy MarginPool module & set address
  await deployer.deploy(MarginPool, addressbook.address, {from: deployerAddress})
  const pool = await MarginPool.deployed()
  await addressbook.setMarginPool(pool.address, {from: deployerAddress})

  // deploy Calculator module & set address
  await deployer.deploy(MarginCalculator, addressbook.address, {from: deployerAddress, gas: 200000000})
  const calculator = await MarginCalculator.deployed()
  await addressbook.setMarginCalculator(calculator.address, {from: deployerAddress})

  // deploy Controller & set address
  // deploy MarginVault library
  await deployer.deploy(MarginVault, {from: deployerAddress})
  await deployer.link(MarginVault, Controller)
  await deployer.deploy(Controller, {from: deployerAddress, gas: 200000000})
  const controller = await Controller.deployed()
  await addressbook.setController(controller.address, {from: deployerAddress})

  console.log(`controller proxy address`, await addressbook.getController())
}
