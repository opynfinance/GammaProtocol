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
<<<<<<< HEAD

  // deploy MarginVault library
  await deployer.deploy(MarginVault, { from: deployerAddress })
=======
>>>>>>> 2be4cb7d (lint)

  // deploy AddressBook & transfer ownership
  await deployer.deploy(AddressBook, { from: deployerAddress })
  const addressbook = await AddressBook.deployed()

  // deploy OtokenFactory & set address
  await deployer.deploy(OtokenFactory, addressbook.address, { from: deployerAddress })
  const otokenFactory = await OtokenFactory.deployed()
<<<<<<< HEAD
  await addressbook.setOtokenFactory(otokenFactory.address, { from: deployerAddress })
=======
  await addressbook.setOtokenFactory(otokenFactory.address, {from: deployerAddress})

>>>>>>> 2be4cb7d (lint)
  // deploy Otoken implementation & set address
  await deployer.deploy(Otoken, { from: deployerAddress })
  const otokenImpl = await Otoken.deployed()
<<<<<<< HEAD
  await addressbook.setOtokenImpl(otokenImpl.address, { from: deployerAddress })
=======
  await addressbook.setOtokenImpl(otokenImpl.address, {from: deployerAddress})

>>>>>>> 2be4cb7d (lint)
  // deploy Whitelist module & set address
  await deployer.deploy(Whitelist, addressbook.address, { from: deployerAddress })
  const whitelist = await Whitelist.deployed()
<<<<<<< HEAD
  await addressbook.setWhitelist(whitelist.address, { from: deployerAddress })
  // deploy Oracle module & set address
  await deployer.deploy(Oracle, { from: deployerAddress })
  const oracle = await Oracle.deployed()
  await addressbook.setOracle(oracle.address, { from: deployerAddress })
=======
  await addressbook.setWhitelist(whitelist.address, {from: deployerAddress})

  // deploy Oracle module & set address
  await deployer.deploy(Oracle, {from: deployerAddress})
  const oracle = await Oracle.deployed()
  await addressbook.setOracle(oracle.address, {from: deployerAddress})

>>>>>>> 2be4cb7d (lint)
  // deploy MarginPool module & set address
  await deployer.deploy(MarginPool, addressbook.address, { from: deployerAddress })
  const pool = await MarginPool.deployed()
<<<<<<< HEAD
  await addressbook.setMarginPool(pool.address, { from: deployerAddress })
=======
  await addressbook.setMarginPool(pool.address, {from: deployerAddress})

>>>>>>> 2be4cb7d (lint)
  // deploy Calculator module & set address
  await deployer.deploy(MarginCalculator, addressbook.address, { from: deployerAddress })
  const calculator = await MarginCalculator.deployed()
<<<<<<< HEAD
  await addressbook.setMarginCalculator(calculator.address, { from: deployerAddress })
=======
  await addressbook.setMarginCalculator(calculator.address, {from: deployerAddress})

>>>>>>> 2be4cb7d (lint)
  // deploy Controller & set address
  // deploy MarginVault library
  await deployer.deploy(MarginVault, {from: deployerAddress})
  await deployer.link(MarginVault, Controller)
  await deployer.deploy(Controller, { from: deployerAddress })
  const controller = await Controller.deployed()
<<<<<<< HEAD
  await addressbook.setController(controller.address, { from: deployerAddress })
=======
  await addressbook.setController(controller.address, {from: deployerAddress})
>>>>>>> 2be4cb7d (lint)
}
