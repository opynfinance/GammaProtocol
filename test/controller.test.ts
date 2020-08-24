import {MockAddressBookInstance, ControllerInstance} from '../build/types/truffle-types'

const {expectRevert} = require('@openzeppelin/test-helpers')

const MockAddressBook = artifacts.require('MockAddressBook.sol')
const Controller = artifacts.require('Controller.sol')

// address(0)
const ZERO_ADDR = '0x0000000000000000000000000000000000000000'

contract('Controller', () => {
  // addressbook module mock
  let addressBook: MockAddressBookInstance
  // controller module
  let controller: ControllerInstance

  before('Deployment', async () => {
    addressBook = await MockAddressBook.new()
    // deploy Controller module
    controller = await Controller.new(addressBook.address)

    assert.equal(await controller.systemPaused(), false, 'System is paused')
  })

  describe('MarginPool initialization', () => {
    it('should revert if initilized with 0 addressBook address', async () => {
      await expectRevert(Controller.new(ZERO_ADDR), 'Invalid address book')
    })
  })

  describe('Account operator', () => {
    it('should set operator', async () => {
      //
    })
  })

  describe('Batch underlyig price', () => {
    it('should set batch udnerlying price', async () => {
      //
    })
  })

  describe('Pause system', () => {
    it('should pause system', async () => {
      //
    })
  })
})
