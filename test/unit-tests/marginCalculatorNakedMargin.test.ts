import {
  MockERC20Instance,
  CalculatorTesterInstance,
  MockAddressBookInstance,
  MockOracleInstance,
  MockOtokenInstance,
} from '../../build/types/truffle-types'
import {createVault, createScaledNumber as scaleNum, createTokenAmount} from '../utils'
import {assert} from 'chai'
import BigNumber from 'bignumber.js'

const {expectRevert, time} = require('@openzeppelin/test-helpers')
const MockAddressBook = artifacts.require('MockAddressBook.sol')
const MockOracle = artifacts.require('MockOracle.sol')
const MockOtoken = artifacts.require('MockOtoken.sol')
const MockERC20 = artifacts.require('MockERC20.sol')
const MarginCalculator = artifacts.require('CalculatorTester.sol')
const ZERO_ADDR = '0x0000000000000000000000000000000000000000'

contract('MarginCalculator', ([owner, random]) => {
  let expiry: number

  let calculator: CalculatorTesterInstance
  let addressBook: MockAddressBookInstance
  let oracle: MockOracleInstance

  let usdc: MockERC20Instance
  let dai: MockERC20Instance
  let weth: MockERC20Instance

  const usdcDecimals = 6
  const daiDecimals = 8
  const wethDecimals = 18

  before('set up contracts', async () => {
    // setup usdc and weth
    usdc = await MockERC20.new('USDC', 'USDC', usdcDecimals)
    dai = await MockERC20.new('DAI', 'DAI', daiDecimals)
    weth = await MockERC20.new('WETH', 'WETH', wethDecimals)

    const now = (await time.latest()).toNumber()
    expiry = now + time.duration.days(30).toNumber()
    // initiate addressbook first.
    addressBook = await MockAddressBook.new()
    // setup oracle
    oracle = await MockOracle.new()
    await addressBook.setOracle(oracle.address)
    // setup calculator
    calculator = await MarginCalculator.new(oracle.address, {from: owner})
  })

  describe('Collateral dust', async () => {
    it('only owner should be able to set collateral dust amunt', async () => {
      const wethDust = createTokenAmount(1, 27)
      await calculator.setCollateralDust(weth.address, wethDust, {from: owner})

      const dustAmount = new BigNumber(await calculator.getCollateralDust(weth.address))

      assert.equal(dustAmount.toString(), wethDust.toString(), 'Weth dust amount mismatch')
    })

    it('should revert setting collateral dust from address other than owner', async () => {
      const wethDust = createTokenAmount(0, 27)

      await expectRevert(
        calculator.setCollateralDust(weth.address, wethDust, {from: random}),
        'Ownable: caller is not the owner',
      )
    })
  })

  describe('Upper bound value', async () => {
    it('should revert setting product time to expiry from non owner', async () => {
      const timeToExpiry = 60 * 24 * 7

      await expectRevert(
        calculator.setProductTimeToExpiry(weth.address, usdc.address, usdc.address, true, timeToExpiry, {from: random}),
        'Ownable: caller is not the owner',
      )
    })

    it('should revert setting time to expiry value when caller is not owner', async () => {
      const upperBoundValue = createTokenAmount(0.5, 27)
      const timeToExpiry = 60 * 24 * 7

      await expectRevert(
        calculator.setTimeToExpiryValue(weth.address, usdc.address, usdc.address, true, timeToExpiry, upperBoundValue, {
          from: random,
        }),
        'Ownable: caller is not the owner',
      )
    })

    it('should revert setting time to expiry value when value is equal to zero', async () => {
      const upperBoundValue = createTokenAmount(0, 27)
      const timeToExpiry = 60 * 24 * 7

      await expectRevert(
        calculator.setTimeToExpiryValue(weth.address, usdc.address, usdc.address, true, timeToExpiry, upperBoundValue, {
          from: owner,
        }),
        'MarginCalculator: invalid option upper bound value',
      )
    })

    it('should revert setting product time to expiry when no expiry value available', async () => {
      const timeToExpiry = 60 * 24 * 7

      await expectRevert(
        calculator.setProductTimeToExpiry(weth.address, usdc.address, usdc.address, true, timeToExpiry, {from: owner}),
        'MarginCalculator: no expiry upper bound value found',
      )
    })

    it('should set time to expiry value when caller is not owner', async () => {
      const upperBoundValue = createTokenAmount(0.5, 27)
      const timeToExpiry = 60 * 24 * 7

      await calculator.setTimeToExpiryValue(
        weth.address,
        usdc.address,
        usdc.address,
        true,
        timeToExpiry,
        upperBoundValue,
        {from: owner},
      )

      assert.equal(
        new BigNumber(
          await calculator.getTimeToExpiryValue(weth.address, usdc.address, usdc.address, true, timeToExpiry),
        ).toString(),
        upperBoundValue.toString(),
        'Upper bound value for this time to expiry not correct',
      )
    })

    it('should set product time to expiry ', async () => {
      const timeToExpiry = 60 * 24 * 7

      await calculator.setProductTimeToExpiry(weth.address, usdc.address, usdc.address, true, timeToExpiry, {
        from: owner,
      })

      assert.equal(
        new BigNumber(
          (await calculator.getProductTimeToExpiry(weth.address, usdc.address, usdc.address, true))[0],
        ).toNumber(),
        timeToExpiry,
        'Product time to expiry mismatch',
      )
    })

    it('should revert setting product time to expiry when no new expiry is not in array order', async () => {
      const timeToExpiry = 60 * 24 * 3

      await expectRevert(
        calculator.setProductTimeToExpiry(weth.address, usdc.address, usdc.address, true, timeToExpiry, {from: owner}),
        'MarginCalculator: expiry array is not in order',
      )
    })
  })

  describe('Spot shock value', async () => {
    it('should revert setting spot shock value when sender is not owner', async () => {
      const spotShockValue = createTokenAmount(0.75, 27)

      await expectRevert(
        calculator.setSpotShock(weth.address, usdc.address, usdc.address, true, spotShockValue, {from: random}),
        'Ownable: caller is not the owner',
      )
    })

    it('should set spot shock value', async () => {
      const spotShockValue = createTokenAmount(0.75, 27)

      await calculator.setSpotShock(weth.address, usdc.address, usdc.address, true, spotShockValue, {from: owner})

      assert.equal(
        new BigNumber(await calculator.getSpotShock(weth.address, usdc.address, usdc.address, true)).toString(),
        spotShockValue.toString(),
        'Weth spot shock value mismatch',
      )
    })
  })

  describe('Oracle deviation value', async () => {
    it('should revert setting oracle deviation value when sender is not owner', async () => {
      const oracleDeviationValue = createTokenAmount(0.05, 27)

      await expectRevert(
        calculator.setOracleDeviation(oracleDeviationValue, {from: random}),
        'Ownable: caller is not the owner',
      )
    })

    it('should set oracle deviation value', async () => {
      const oracleDeviationValue = createTokenAmount(0.05, 27)

      await calculator.setOracleDeviation(oracleDeviationValue, {from: owner})

      assert.equal(
        new BigNumber(await calculator.getOracleDeviation()).toString(),
        oracleDeviationValue.toString(),
        'Oracle deviation value mismatch',
      )
    })
  })
})
