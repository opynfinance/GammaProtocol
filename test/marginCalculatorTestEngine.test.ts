import {
  MockERC20Instance,
  MarginCalculatorInstance,
  MockAddressBookInstance,
  MockOracleInstance,
  MockOtokenInstance,
} from '../build/types/truffle-types'
import {createVault, createScaledNumber} from './utils'
import {assert} from 'chai'
import {testCaseGenerator, Test} from './testCaseGenerator'

const {expectRevert, time} = require('@openzeppelin/test-helpers')
const MockAddressBook = artifacts.require('MockAddressBook.sol')
const MockOracle = artifacts.require('MockOracle.sol')
const MockOtoken = artifacts.require('MockOtoken.sol')
const MockERC20 = artifacts.require('MockERC20.sol')
const MarginCalculator = artifacts.require('MarginCalculator.sol')
const ZERO_ADDR = '0x0000000000000000000000000000000000000000'

contract('MarginCalculator', () => {
  let expiry: number

  let calculator: MarginCalculatorInstance
  let addressBook: MockAddressBookInstance
  let oracle: MockOracleInstance
  let longPut: MockOtokenInstance
  let shortPut: MockOtokenInstance
  let usdc: MockERC20Instance
  let dai: MockERC20Instance
  let weth: MockERC20Instance

  before('set up contracts', async () => {
    const now = (await time.latest()).toNumber()
    expiry = now + time.duration.days(30).toNumber()
    // initiate addressbook first.
    addressBook = await MockAddressBook.new()
    // setup calculator
    calculator = await MarginCalculator.new()
    await calculator.init(addressBook.address)
    // setup oracle
    oracle = await MockOracle.new(addressBook.address)
    await addressBook.setOracle(oracle.address)
    // setup usdc and weth
    usdc = await MockERC20.new('USDC', 'USDC')
    dai = await MockERC20.new('DAI', 'DAI')
    weth = await MockERC20.new('WETH', 'WETH')
  })

  describe('Excess Margin Test', () => {
    it('test the various excess margin scenarios', async () => {
      const tests: Test[] = testCaseGenerator()

      for (let i = 0; i < tests.length; i++) {
        const longStrike = tests[i].longStrike
        const shortStrike = tests[i].shortStrike

        const longAmount = tests[i].longAmount
        const shortAmount = tests[i].shortAmount

        const collateral = tests[i].collateral

        const expectedNetValue = tests[i].netValue
        const expectedIsExcess = tests[i].isExcess

        console.log(tests[i])

        longPut = await MockOtoken.new()
        await longPut.init(weth.address, usdc.address, usdc.address, createScaledNumber(longStrike), expiry, true)
        shortPut = await MockOtoken.new()
        await shortPut.init(weth.address, usdc.address, usdc.address, createScaledNumber(shortStrike), expiry, true)

        const vaultWithCollateral = createVault(
          shortPut.address,
          longPut.address,
          usdc.address,
          createScaledNumber(shortAmount),
          createScaledNumber(longAmount),
          createScaledNumber(collateral),
        )

        const [netValue, isExcess] = await calculator.getExcessMargin(vaultWithCollateral, usdc.address)
        assert.equal(isExcess, expectedIsExcess)
        assert.equal(netValue.toString(), createScaledNumber(expectedNetValue))
      }
    })
  })
})
