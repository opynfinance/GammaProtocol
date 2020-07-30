import {AddressBookInstance, OracleInstance} from '../build/types/truffle-types'

const {expectEvent, expectRevert} = require('@openzeppelin/test-helpers')

const AddressBook = artifacts.require('AddressBook.sol')
const Oracle = artifacts.require('Oracle.sol')
// address(0)
const ZERO_ADDR = '0x0000000000000000000000000000000000000000'

contract('Oracle', ([owner]) => {
  // AddressBook module
  let addressBook: AddressBookInstance
  // Oracle module
  let oracle: OracleInstance

  before('Deployment', async () => {
    // deploy AddressBook mock
    addressBook = await AddressBook.new()
    // deploy Whitelist module
    oracle = await Oracle.new(addressBook.address, {from: owner})
  })

  describe('oracle', () => {
    it('oracle', async () => {
      //empty
    })
  })
})
