import {
  MockERC20Instance,
  MarginCalculatorInstance,
  MockAddressBookInstance,
  MockOracleInstance,
  MockOtokenInstance,
  MockWhitelistModuleInstance,
} from '../../build/types/truffle-types'
import { createVault, createTokenAmount } from '../utils'
import { testCaseGenerator, Tests, Test, testToString, callMarginRequiredBeforeExpiry } from './testCaseGenerator'
import BigNumber from 'bignumber.js'

const { time } = require('@openzeppelin/test-helpers')
const MockAddressBook = artifacts.require('MockAddressBook.sol')
const MockOracle = artifacts.require('MockOracle.sol')
const MockOtoken = artifacts.require('MockOtoken.sol')
const MockERC20 = artifacts.require('MockERC20.sol')
const MarginCalculator = artifacts.require('MarginCalculator.sol')
const MockWhitelistModule = artifacts.require('MockWhitelistModule.sol')

contract('MarginCalculator Test Engine', () => {
  let expiry: number

  let calculator: MarginCalculatorInstance
  let addressBook: MockAddressBookInstance
  let oracle: MockOracleInstance
  let longOption: MockOtokenInstance
  let shortOption: MockOtokenInstance
  let usdc: MockERC20Instance
  let weth: MockERC20Instance
  let whitelist: MockWhitelistModuleInstance
  const usdcDecimals = 6
  const wethDecimals = 18

  before('set up contracts', async () => {
    const now = (await time.latest()).toNumber()
    expiry = now + time.duration.days(30).toNumber()
    // initiate addressbook first.
    addressBook = await MockAddressBook.new()
    // setup oracle
    oracle = await MockOracle.new()
    // setup whitelist module
    whitelist = await MockWhitelistModule.new(addressBook.address)
    // setup calculator
    calculator = await MarginCalculator.new(oracle.address, addressBook.address)
    await addressBook.setOracle(oracle.address)
    await addressBook.setWhitelist(whitelist.address)
    // setup usdc and weth
    usdc = await MockERC20.new('USDC', 'USDC', usdcDecimals)
    weth = await MockERC20.new('WETH', 'WETH', wethDecimals)
    await whitelist.whitelistCoveredCollateral(weth.address, weth.address, false)
    await whitelist.whitelistCoveredCollateral(usdc.address, weth.address, true)
  })

  describe('Excess Margin Test', () => {
    let testPutsBeforeExpiry: Test[]
    let testPutsAfterExpiry: Test[]
    let testCallsBeforeExpiry: Test[]
    let testCallsAfterExpiry: Test[]

    before('generate all the tests', () => {
      const tests: Tests = testCaseGenerator()
      testPutsBeforeExpiry = tests.beforeExpiryPuts
      testPutsAfterExpiry = tests.afterExpiryPuts
      testCallsBeforeExpiry = tests.beforeExpiryCalls
      testCallsAfterExpiry = tests.afterExpiryCalls
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
          createTokenAmount(longStrike),
          expiry,
          true,
        )
        shortOption = await MockOtoken.new()
        await shortOption.init(
          addressBook.address,
          weth.address,
          usdc.address,
          usdc.address,
          createTokenAmount(shortStrike),
          expiry,
          true,
        )
        // if the amount is zero, pass in an empty array
        const vaultShortAmount = shortAmount > 0 ? createTokenAmount(shortAmount) : undefined
        const vaultLongAmount = longAmount > 0 ? createTokenAmount(longAmount) : undefined
        const vaultCollateralAmount = collateral.gt(0) ? createTokenAmount(collateral, usdcDecimals) : undefined
        const shortAddress = shortAmount > 0 ? shortOption.address : undefined
        const longAddress = longAmount > 0 ? longOption.address : undefined
        const collateralAddress = collateral.gt(0) ? usdc.address : undefined

        // create the vault
        const vault = createVault(
          shortAddress,
          longAddress,
          collateralAddress,
          vaultShortAmount,
          vaultLongAmount,
          vaultCollateralAmount,
        )
        // Check that the test passes, only fail if it doesn't
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault, 0)
        assert.equal(netValue.toString(), createTokenAmount(expectedNetValue, usdcDecimals), testToString(tests[i]))
        assert.equal(isExcess, expectedIsExcess, testToString(tests[i]))
      }
    })

    it('test the various excess margin scenarios for calls before expiry', async () => {
      const tests: Test[] = testCallsBeforeExpiry

      for (let i = 0; i < tests.length; i++) {
        const longStrike = tests[i].longStrike
        const shortStrike = tests[i].shortStrike

        const longAmount = tests[i].longAmount
        const shortAmount = tests[i].shortAmount

        const collateral = tests[i].collateral

        const expectedNetValue = new BigNumber(tests[i].netValue)
        const expectedIsExcess = tests[i].isExcess

        longOption = await MockOtoken.new()
        await longOption.init(
          addressBook.address,
          weth.address,
          usdc.address,
          weth.address,
          createTokenAmount(longStrike),
          expiry,
          false,
        )
        shortOption = await MockOtoken.new()
        await shortOption.init(
          addressBook.address,
          weth.address,
          usdc.address,
          weth.address,
          createTokenAmount(shortStrike),
          expiry,
          false,
        )

        const vaultWithCollateral = createVault(
          shortOption.address,
          longOption.address,
          weth.address,
          createTokenAmount(shortAmount),
          createTokenAmount(longAmount),
          createTokenAmount(collateral, wethDecimals),
        )

        const [netValue, isExcess] = await calculator.getExcessCollateral(vaultWithCollateral, 0)
        assert.equal(netValue.toString(), createTokenAmount(expectedNetValue, wethDecimals), testToString(tests[i]))
        assert.equal(isExcess, expectedIsExcess, testToString(tests[i]))
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
        // set the mock oracle price to have been finalized
        await oracle.setExpiryPriceFinalizedAllPeiodOver(weth.address, expiry, createTokenAmount(spotPrice), true)
        await oracle.setExpiryPriceFinalizedAllPeiodOver(usdc.address, expiry, createTokenAmount(1), true)

        longOption = await MockOtoken.new()
        await longOption.init(
          addressBook.address,
          weth.address,
          usdc.address,
          usdc.address,
          createTokenAmount(longStrike),
          expiry,
          true,
        )
        shortOption = await MockOtoken.new()
        await shortOption.init(
          addressBook.address,
          weth.address,
          usdc.address,
          usdc.address,
          createTokenAmount(shortStrike),
          expiry,
          true,
        )
        // if the amount is zero, pass in an empty array
        const vaultShortAmount = shortAmount > 0 ? createTokenAmount(shortAmount) : undefined
        const vaultLongAmount = longAmount > 0 ? createTokenAmount(longAmount) : undefined
        const vaultCollateralAmount = collateral.gt(0) ? createTokenAmount(collateral, usdcDecimals) : undefined
        const shortAddress = shortAmount > 0 ? shortOption.address : undefined
        const longAddress = longAmount > 0 ? longOption.address : undefined
        const collateralAddress = collateral.gt(0) ? usdc.address : undefined
        // create the vault
        const vault = createVault(
          shortAddress,
          longAddress,
          collateralAddress,
          vaultShortAmount,
          vaultLongAmount,
          vaultCollateralAmount,
        )

        // Check that the test passes, only fail if it doesn't
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault, 0)
        assert.equal(netValue.toString(), createTokenAmount(expectedNetValue, usdcDecimals), testToString(tests[i]))
        assert.equal(isExcess, expectedIsExcess, testToString(tests[i]))
      }
    })

    it('test the various excess margin scenarios for calls after expiry', async () => {
      const tests: Test[] = testCallsAfterExpiry

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
        // set the mock oracle price to have been finalized
        await oracle.setExpiryPriceFinalizedAllPeiodOver(weth.address, expiry, createTokenAmount(spotPrice), true)
        await oracle.setExpiryPriceFinalizedAllPeiodOver(usdc.address, expiry, createTokenAmount(1), true)

        longOption = await MockOtoken.new()
        await longOption.init(
          addressBook.address,
          weth.address,
          usdc.address,
          weth.address,
          createTokenAmount(longStrike),
          expiry,
          false,
        )
        shortOption = await MockOtoken.new()
        await shortOption.init(
          addressBook.address,
          weth.address,
          usdc.address,
          weth.address,
          createTokenAmount(shortStrike),
          expiry,
          false,
        )
        // if the amount is zero, pass in an empty array
        const vaultShortAmount = shortAmount > 0 ? createTokenAmount(shortAmount) : undefined
        const vaultLongAmount = longAmount > 0 ? createTokenAmount(longAmount) : undefined
        const vaultCollateralAmount = collateral.gt(0) ? createTokenAmount(collateral, wethDecimals) : undefined
        const shortAddress = shortAmount > 0 ? shortOption.address : undefined
        const longAddress = longAmount > 0 ? longOption.address : undefined
        const collateralAddress = collateral.gt(0) ? weth.address : undefined
        // create the vault
        const vault = createVault(
          shortAddress,
          longAddress,
          collateralAddress,
          vaultShortAmount,
          vaultLongAmount,
          vaultCollateralAmount,
        )

        // Check that the test passes, only fail if it doesn't
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault, 0)
        assert.equal(netValue.toString(), createTokenAmount(expectedNetValue, wethDecimals), testToString(tests[i]))
        assert.equal(isExcess, expectedIsExcess, testToString(tests[i]))
      }
    })
  })
})
