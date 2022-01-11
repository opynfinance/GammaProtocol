//cone hre = require('hardhat')
import { ethers } from 'hardhat';

// import config file
const deploymentConfig = require('../deployment-config.json')

async function deployContracts() {



// import library
const MarginVault = await ethers.getContractFactory('MarginVault')
// import contract
const OtokenFactory = await ethers.getContractFactory('OtokenFactory ')
const Otoken = await ethers.getContractFactory('Otoken')
const Whitelist = await ethers.getContractFactory('Whitelist')
const Oracle = await ethers.getContractFactory('Oracle')
const MarginPool = await ethers.getContractFactory('MarginPool')
const MarginCalculator = await ethers.getContractFactory('MarginCalculator')
const AddressBook = await ethers.getContractFactory('AddressBook')

//contract deployer
const [deployer] = await ethers.getSigners()



  console.log('Deploying contracts with the account:', deployer.address)


  //deploy AddressBook & transfer ownership
  const addressBook = await AddressBook.deploy(deployer)

  // deploy OtokenFactory & set address
  const otokenFactory = await OtokenFactory.deploy(deployer, addressBook.address)
  await addressBook.setOtokenFactory(otokenFactory.address)

  // deploy Otoken implementation & set address
  const otoken = await Otoken.deploy(deployer)
  await addressBook.setOtoken(otoken.address)

  //deploy Whitelist module & set address
  const whitelist = await Whitelist.deploy(deployer, addressBook.address)
  await addressBook.setWhitelist(whitelist.address)

  // deploy Oracle module & set address
  const oracle = await Oracle.deploy(deployer)
  await addressBook.setOracle(oracle.address)

  // deploy MarginPool module & set address
  const pool = await MarginPool.deploy(deployer)
  await addressBook.setMarginPool(pool.address)

  // deploy Calculator module & set address
  const calculator = await MarginCalculator.deploy(deployer, oracle.address)
  await addressBook.setMarginCalculator(calculator.address)

  // deploy Controller & set address
  // deploy MarginVault library
  const marginVault = await MarginVault.deploy(deployer)

  const controller = await ethers.getContractFactory('Controller', {
    libraries: {
      MarginVault: marginVault.address,
    },
  })

  await controller.deploy(deployer)
  await addressBook.setController(controller.address);

  console.log("contract deployed to: ", controller.address)

  //return {addressBook, whitelist, oracle, pool, controller}
}

async function setupOwnership( {addressBook, whitelist, oracle, pool, controller} ) {

  // new protocol owner
  const newOwner = deploymentConfig.MULTISIG

  // const addressbook = await AddressBook.deployed()
  // const whitelist = await Whitelist.deployed()
  // const oracle = await Oracle.deployed()
  // const pool = await MarginPool.deployed()
  // const controller = await Controller.at(await addressbook.getController())

  // // transfer ownership
  // await addressbook.transferOwnership(newOwner, {from: deployerAddress})
  // await whitelist.transferOwnership(newOwner, {from: deployerAddress})
  // await oracle.transferOwnership(newOwner, {from: deployerAddress})
  // await pool.transferOwnership(newOwner, {from: deployerAddress})
  // await controller.transferOwnership(newOwner, {from: deployerAddress})



}

deployContracts()
  .then(deployContracts)
  //.then(setupOwnership)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })

