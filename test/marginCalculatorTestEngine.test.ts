import {
  MockERC20Instance,
  MarginCalculatorInstance,
  MockAddressBookInstance,
  MockOracleInstance,
  MockOtokenInstance,
} from '../build/types/truffle-types'
import {createVault, createScaledNumber} from './utils'
import {assert} from 'chai'
import {testCaseGenerator, Tests, Test, testToString} from './testCaseGenerator'

const {expectRevert, time} = require('@openzeppelin/test-helpers')
const MockAddressBook = artifacts.require('MockAddressBook.sol')
const MockOracle = artifacts.require('MockOracle.sol')
const MockOtoken = artifacts.require('MockOtoken.sol')
const MockERC20 = artifacts.require('MockERC20.sol')
const MarginCalculator = artifacts.require('MarginCalculator.sol')
const ZERO_ADDR = '0x0000000000000000000000000000000000000000'

contract('MarginCalculator Test Engine', () => {
  let expiry: number

  let calculator: MarginCalculatorInstance
  let addressBook: MockAddressBookInstance
  let oracle: MockOracleInstance
  let longOption: MockOtokenInstance
  let shortOption: MockOtokenInstance
  let usdc: MockERC20Instance
  let dai: MockERC20Instance
  let weth: MockERC20Instance

  before('set up contracts', async () => {
    const now = (await time.latest()).toNumber()
    expiry = now + time.duration.days(30).toNumber()
    // initiate addressbook first.
    addressBook = await MockAddressBook.new()
    // setup calculator
    calculator = await MarginCalculator.new(addressBook.address)
    // setup oracle
    oracle = await MockOracle.new()
    await addressBook.setOracle(oracle.address)
    // setup usdc and weth
    // TODO: scaling
    usdc = await MockERC20.new('USDC', 'USDC', 18)
    weth = await MockERC20.new('WETH', 'WETH', 18)
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

        longOption = await MockOtoken.new()
        await longOption.init(
          addressBook.address,
          weth.address,
          usdc.address,
          usdc.address,
          createScaledNumber(longStrike),
          expiry,
          true,
        )
        shortOption = await MockOtoken.new()
        await shortOption.init(
          addressBook.address,
          weth.address,
          usdc.address,
          usdc.address,
          createScaledNumber(shortStrike),
          expiry,
          true,
        )

        const vaultWithCollateral = createVault(
          shortOption.address,
          longOption.address,
          usdc.address,
          createScaledNumber(shortAmount),
          createScaledNumber(longAmount),
          createScaledNumber(collateral),
        )

        const [netValue, isExcess] = await calculator.getExcessCollateral(vaultWithCollateral)
        assert.equal(isExcess, expectedIsExcess, testToString(tests[i]))
        assert.equal(netValue.toString(), createScaledNumber(expectedNetValue), testToString(tests[i]))
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

        await oracle.setExpiryPriceFinalizedAllPeiodOver(weth.address, expiry, createScaledNumber(spotPrice), true)
        await oracle.setExpiryPriceFinalizedAllPeiodOver(usdc.address, expiry, createScaledNumber(1), true)

        longOption = await MockOtoken.new()
        await longOption.init(
          addressBook.address,
          weth.address,
          usdc.address,
          usdc.address,
          createScaledNumber(longStrike),
          expiry,
          true,
        )
        shortOption = await MockOtoken.new()
        await shortOption.init(
          addressBook.address,
          weth.address,
          usdc.address,
          usdc.address,
          createScaledNumber(shortStrike),
          expiry,
          true,
        )

        const vaultWithCollateral = createVault(
          shortOption.address,
          longOption.address,
          usdc.address,
          createScaledNumber(shortAmount),
          createScaledNumber(longAmount),
          createScaledNumber(collateral),
        )

        const [netValue, isExcess] = await calculator.getExcessCollateral(vaultWithCollateral)
        assert.equal(isExcess, expectedIsExcess, testToString(tests[i]))
        assert.equal(netValue.toString(), createScaledNumber(expectedNetValue), testToString(tests[i]))
      }
    })
  })
})
