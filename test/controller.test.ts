import {MockAddressBookInstance, ControllerInstance} from '../build/types/truffle-types'

const {expectRevert} = require('@openzeppelin/test-helpers')

const MockAddressBook = artifacts.require('MockAddressBook.sol')
const Controller = artifacts.require('Controller.sol')

// address(0)
const ZERO_ADDR = '0x0000000000000000000000000000000000000000'

contract('Controller', ([owner1, operator1, random]) => {
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

  describe('Controller initialization', () => {
    it('should revert if initilized with 0 addressBook address', async () => {
      await expectRevert(Controller.new(ZERO_ADDR), 'Invalid address book')
    })
  })

  describe('Account operator', () => {
    it('should set operator', async () => {
      await controller.setOperator(operator1, true, {from: owner1})

      assert.equal(await controller.isOperator(owner1, operator1), true, 'Operator address mismatch')
    })
  })

  describe('Pause system', () => {
    it('should revert when pausing the system from non-owner', async () => {
      await expectRevert(controller.setSystemPaused(true, {from: random}), 'Ownable: caller is not the owner')
    })

    it('should pause system', async () => {
      const stateBefore = await controller.systemPaused()
      assert.equal(stateBefore, false, 'System already paused')

      await controller.setSystemPaused(true)

      const stateAfter = await controller.systemPaused()
      assert.equal(stateAfter, true, 'System not paused')
    })
  })
})
