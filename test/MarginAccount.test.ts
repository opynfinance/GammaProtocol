import {MarginAccountTesterInstance, MockERC20Instance} from '../build/types/truffle-types'

const {expectRevert} = require('@openzeppelin/test-helpers')

const MockERC20 = artifacts.require('MockERC20.sol')
const MarginAccountTester = artifacts.require('MarginAccountTester.sol')
import {MarginAccountTesterContract} from '../build/types/truffle-types'

contract('MarginAccount', ([deployer]) => {
  // ERC20 mocks
  let weth: MockERC20Instance
  // addressbook instance
  let marginAccountTester: MarginAccountTesterInstance

  before('Deployment', async () => {
    // deploy WETH token
    weth = await MockERC20.new('WETH', 'WETH')
    // deploy AddressBook token
    marginAccountTester = await MarginAccountTester.new()
  })

  describe('Open new vault', () => {
    it('vaultID should be zero', async () => {
      const account = await marginAccountTester.getAccount({from: deployer})
      console.log(account)

      // assert.equal(await marginAccountTester.getAccount()., otokenImplAdd, 'Otoken implementation address mismatch')
    })

    // it('should increment vaultID otoken implementation address', async () => {
    //   await marginAccountTester.testOpenNewVault(otokenImplAdd, {from: owner})
    //
    //   assert.equal(await marginAccountTester.getAccount()., otokenImplAdd, 'Otoken implementation address mismatch')
    // })
  })
})
