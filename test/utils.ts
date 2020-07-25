import {
  OtokenFactoryInstance,
  OtokenInstance,
  MockAddressBookInstance,
  WhitelistInstance,
} from '../build/types/truffle-types'

const OTokenFactory = artifacts.require('OtokenFactory.sol')
const MockAddressBook = artifacts.require('MockAddressBook.sol')
const Whitelist = artifacts.require('Whitelist.sol')
const Otoken = artifacts.require('Otoken.sol')

export async function setupContracts(deployer: string) {
  // Todoo: Use Real addressBook instance when available

  const addressBook: MockAddressBookInstance = await MockAddressBook.new({from: deployer})

  const otokenImpl: OtokenInstance = await Otoken.new(addressBook.address, {from: deployer})
  const whitelist: WhitelistInstance = await Whitelist.new(addressBook.address, {from: deployer})
  const factory: OtokenFactoryInstance = await OTokenFactory.new(addressBook.address, {from: deployer})

  // setup addressBook
  await addressBook.setOtokenImpl(otokenImpl.address, {from: deployer})
  await addressBook.setWhitelist(whitelist.address, {from: deployer})
  await addressBook.setOtokenFactory(factory.address, {from: deployer})

  return {factory, addressBook, whitelist, otokenImpl}
}
