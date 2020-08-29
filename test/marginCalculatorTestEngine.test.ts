import {
  MockERC20Instance,
  MarginCalculatorInstance,
  MockAddressBookInstance,
  MockOracleInstance,
  MockOtokenInstance,
} from '../build/types/truffle-types'
import {createVault, createScaledNumber} from './utils'
import {assert} from 'chai'
import {testCaseGenerator, Tests, Test} from './testCaseGenerator'

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
    let testPutsBeforeExpiry: Test[]
    let testPutsAfterExpiry: Test[]

    before('generate all the tests', () => {
      const tests: Tests = testCaseGenerator()
      testPutsBeforeExpiry = tests.beforeExpiryPuts
      testPutsAfterExpiry = tests.afterExpiryPuts
    })
    it('test the various excess margin scenarios for puts before expiry', async () => {
      const tests: Test[] = testPutsBeforeExpiry

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
    it('test the various excess margin scenarios for puts after expiry', async () => {
      const tests: Test[] = testPutsAfterExpiry

      if ((await time.latest()) < expiry) {
        await time.increaseTo(expiry + 2)
      }

      for (let i = 0; i < tests.length; i++) {
        const longStrike = tests[i].longStrike
        const shortStrike = tests[i].shortStrike

        const longAmount = tests[i].longAmount
        const shortAmount = tests[i].shortAmount

        const collateral = tests[i].collateral

        const expectedNetValue = tests[i].netValue
        const expectedIsExcess = tests[i].isExcess

        const spotPrice = tests[i].oraclePrice

        console.log(tests[i])

        await oracle.setMockedStatus(createScaledNumber(spotPrice), true)

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
