import {Contract, ContractFactory} from '@ethersproject/contracts'
import {ethers} from 'hardhat'

const {MULTISIG} = require('./deployment-config.json')

async function deployContracts() {
  // deploy AddressBook
  const AddressBook: ContractFactory = await ethers.getContractFactory('AddressBook')
  const addressBook = await AddressBook.deploy()

  // deploy OtokenFactory & set address
  const OtokenFactory: ContractFactory = await ethers.getContractFactory('OtokenFactory')
  const oTokenFactory = await OtokenFactory.deploy(addressBook.address)
  await addressBook.setOtokenFactory(oTokenFactory.address)

  // deploy Otoken implementation & set address
  const Otoken: ContractFactory = await ethers.getContractFactory('Otoken')
  const oTokenImplementation = await Otoken.deploy()
  await addressBook.setOtokenImpl(oTokenImplementation.address)

  // deploy Whitelist module & set address
  const Whitelist: ContractFactory = await ethers.getContractFactory('Whitelist')
  const whitelist = await Whitelist.deploy(addressBook.address)
  await addressBook.setWhitelist(whitelist.address)

  // deploy Oracle module & set address
  const Oracle: ContractFactory = await ethers.getContractFactory('Oracle')
  const oracle = await Oracle.deploy()
  await addressBook.setOracle(oracle.address)

  // deploy MarginPool module & set address
  const MarginPool: ContractFactory = await ethers.getContractFactory('MarginPool')
  const marginPool = await MarginPool.deploy(addressBook.address)
  await addressBook.setMarginPool(marginPool.address)

  // deploy MarginCalculator module & set address
  const MarginCalculator: ContractFactory = await ethers.getContractFactory('MarginCalculator')
  const marginCalculator = await MarginCalculator.deploy(addressBook.address)
  await addressBook.setMarginCalculator(marginCalculator.address)

  // deploy MarginVault library
  const MarginVault: ContractFactory = await ethers.getContractFactory('MarginVault')
  const marginVault = await MarginVault.deploy()

  // deploy Controller & set address
  const Controller: ContractFactory = await ethers.getContractFactory('Controller', {
    libraries: {
      MarginVault: marginVault.address,
    },
  })
  const controller = await Controller.deploy()
  await addressBook.setController(controller.address)

  return {addressBook, controller, marginPool, oracle, whitelist}
}

async function setupOwnership({
  addressBook,
  controller,
  marginPool,
  oracle,
  whitelist,
}: {
  [contractName: string]: Contract
}) {
  // new protocol owner
  const newOwner = MULTISIG

  controller = await controller.attach(await addressBook.getController())

  // transfer ownership
  await addressBook.transferOwnership(newOwner)
  await whitelist.transferOwnership(newOwner)
  await oracle.transferOwnership(newOwner)
  await marginPool.transferOwnership(newOwner)
  await controller.transferOwnership(newOwner)
}

deployContracts()
  .then(setupOwnership)
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error)
    process.exit(1)
  })
