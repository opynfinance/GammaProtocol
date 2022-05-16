import {
  MockERC20Instance,
  CalculatorTesterInstance,
  MockAddressBookInstance,
  MockOracleInstance,
  MockOtokenInstance,
  MockWhitelistModuleInstance,
} from '../../build/types/truffle-types'
import {
  createScaledNumber as scaleNum,
  createScaledBigNumber as scaleBigNum,
  createVault,
  createScaledBigNumber,
  createScaledNumber,
} from '../utils'
import { assert } from 'chai'
import BigNumber from 'bignumber.js'

const { expectRevert, time } = require('@openzeppelin/test-helpers')
const MockAddressBook = artifacts.require('MockAddressBook.sol')
const MockOracle = artifacts.require('MockOracle.sol')
const MockOtoken = artifacts.require('MockOtoken.sol')
const MockERC20 = artifacts.require('MockERC20.sol')
const MarginCalculator = artifacts.require('CalculatorTester.sol')
const MockWhitelistModule = artifacts.require('MockWhitelistModule.sol')
const ZERO_ADDR = '0x0000000000000000000000000000000000000000'

const expectedRequiredMargin = (
  shortAmount: number,
  strikePrice: number,
  underlyingPrice: number,
  isPut: boolean,
  upperBoundValue: number,
  spotShockValue: number,
  collateralAsset: string,
  underlyingAsset: string,
) => {
  let a, b, marginRequired

  if (isPut && collateralAsset == underlyingAsset) {
    a = Math.min(strikePrice / underlyingPrice, spotShockValue)
    b = Math.max(strikePrice / underlyingPrice - spotShockValue, 0)
    marginRequired = (1 + spotShockValue) * (upperBoundValue * a + b) * shortAmount
  } else if (isPut && collateralAsset != underlyingAsset) {
    a = Math.min(strikePrice, spotShockValue * underlyingPrice)
    b = Math.max(strikePrice - spotShockValue * underlyingPrice, 0)
    marginRequired = (upperBoundValue * a + b) * shortAmount
  } else if (!isPut && collateralAsset == underlyingAsset) {
    a = Math.min(1, strikePrice / (underlyingPrice / spotShockValue))
    b = Math.max(1 - strikePrice / (underlyingPrice / spotShockValue), 0)
    marginRequired = (upperBoundValue * a + b) * shortAmount
  } else {
    a = Math.min(underlyingPrice, strikePrice * spotShockValue)
    b = Math.max(underlyingPrice - strikePrice * spotShockValue, 0)
    marginRequired = (1 + spotShockValue) * (upperBoundValue * a + b) * shortAmount
  }

  return marginRequired
}

const calcRelativeDiff = (expected: BigNumber, actual: BigNumber): BigNumber => {
  let diff: BigNumber

  if (actual.isGreaterThan(expected)) {
    diff = actual.minus(expected)
  } else {
    diff = expected.minus(actual)
  }
  return diff
}

contract('MarginCalculator: partial collateralization', ([owner, random]) => {
  let expiry: number

  let calculator: CalculatorTesterInstance
  let addressBook: MockAddressBookInstance
  let whitelist: MockWhitelistModuleInstance
  let oracle: MockOracleInstance

  let usdc: MockERC20Instance
  let dai: MockERC20Instance
  let weth: MockERC20Instance

  const usdcDecimals = 6
  const daiDecimals = 8
  const wethDecimals = 18

  const vaultType = 1

  const errorDelta = 0.1

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
    calculator = await MarginCalculator.new(oracle.address, addressBook.address, { from: owner })
    whitelist = await MockWhitelistModule.new(addressBook.address, { from: owner })
    await whitelist.whitelistCollateral(usdc.address)
    await whitelist.whitelistCollateral(weth.address)
    await whitelist.whitelistCoveredCollateral(usdc.address, weth.address, true)
    await whitelist.whitelistCoveredCollateral(weth.address, weth.address, false)
    await whitelist.whitelistNakedCollateral(usdc.address, weth.address, false)
    await whitelist.whitelistNakedCollateral(weth.address, weth.address, true)
    await addressBook.setWhitelist(whitelist.address)
  })

  describe('Collateral dust', async () => {
    it('only owner should be able to set collateral dust amount', async () => {
      const wethDust = scaleNum(1, wethDecimals)
      await calculator.setCollateralDust(weth.address, wethDust, { from: owner })

      const dustAmount = new BigNumber(await calculator.getCollateralDust(weth.address))

      assert.equal(dustAmount.toString(), wethDust.toString(), 'Weth dust amount mismatch')
    })

    it('should revert setting collateral dust from address other than owner', async () => {
      const wethDust = scaleNum(1, wethDecimals)

      await expectRevert(
        calculator.setCollateralDust(weth.address, wethDust, { from: random }),
        'Ownable: caller is not the owner',
      )
    })

    it('should revert setting collateral dust amount equal to zero', async () => {
      const wethDust = scaleNum(0, wethDecimals)

      await expectRevert(
        calculator.setCollateralDust(weth.address, wethDust, { from: owner }),
        'MarginCalculator: dust amount should be greater than zero',
      )
    })
  })

  describe('Upper bound value', async () => {
    it('should revert setting product upper bound value from non owner', async () => {
      const timeToExpiry = 60 * 24 * 7
      const upperBoundValue = scaleNum(0.5, 27)

      await expectRevert(
        calculator.setUpperBoundValues(
          weth.address,
          usdc.address,
          usdc.address,
          true,
          [timeToExpiry],
          [upperBoundValue],
          { from: random },
        ),
        'Ownable: caller is not the owner',
      )
    })

    it('should revert setting upper bound values when time to expiry array length is equal to zero', async () => {
      const upperBoundValue = scaleNum(0.03, 27)

      await expectRevert(
        calculator.setUpperBoundValues(weth.address, usdc.address, usdc.address, true, [], [upperBoundValue], {
          from: owner,
        }),
        'MarginCalculator: invalid times to expiry array',
      )
    })

    it('should revert setting upper bound values when time to expiry and value arrays length are not equal', async () => {
      const upperBoundValue = [scaleNum(0.03, 27), scaleNum(0.05, 27)]
      const timeToExpiry = [60 * 24 * 7]

      await expectRevert(
        calculator.setUpperBoundValues(weth.address, usdc.address, usdc.address, true, timeToExpiry, upperBoundValue, {
          from: owner,
        }),
        'MarginCalculator: invalid values array',
      )
    })

    it('should revert setting product upper bound value when value is equal to zero', async () => {
      const timeToExpiry = 60 * 24 * 7
      const upperBoundValue = scaleNum(0, 27)

      await expectRevert(
        calculator.setUpperBoundValues(
          weth.address,
          usdc.address,
          usdc.address,
          true,
          [timeToExpiry],
          [upperBoundValue],
          { from: owner },
        ),
        'MarginCalculator: no expiry upper bound value found',
      )
    })

    it('should set product upper bound value', async () => {
      const upperBoundValue = scaleNum(0.5, 27)
      const timeToExpiry = 60 * 24 * 7

      await calculator.setUpperBoundValues(
        weth.address,
        usdc.address,
        usdc.address,
        true,
        [timeToExpiry],
        [upperBoundValue],
        { from: owner },
      )

      assert.equal(
        new BigNumber(
          await calculator.getMaxPrice(weth.address, usdc.address, usdc.address, true, timeToExpiry),
        ).toString(),
        upperBoundValue.toString(),
        'Upper bound value for this time to expiry not correct',
      )

      assert.equal(
        new BigNumber(
          (await calculator.getTimesToExpiry(weth.address, usdc.address, usdc.address, true))[0],
        ).toNumber(),
        timeToExpiry,
        'Product time to expiry mismatch',
      )
    })

    it('should revert setting product time to expiry when new expiry is not in array order', async () => {
      const timeToExpiry = 60 * 24 * 3
      const upperBoundValue = scaleNum(0.2, 27)

      await expectRevert(
        calculator.setUpperBoundValues(
          weth.address,
          usdc.address,
          usdc.address,
          true,
          [timeToExpiry],
          [upperBoundValue],
          {
            from: owner,
          },
        ),
        'MarginCalculator: expiry array is not in order',
      )
    })

    it('should revert setting product time to expiry when new expiry array is not oredered', async () => {
      const timeToExpiry = [60 * 24 * 21, 60 * 24 * 14]
      const upperBoundValue = [scaleNum(0.2, 27), scaleNum(0.2, 27)]

      await expectRevert(
        calculator.setUpperBoundValues(weth.address, usdc.address, usdc.address, true, timeToExpiry, upperBoundValue, {
          from: owner,
        }),
        'MarginCalculator: time should be in order',
      )
    })
  })

  describe('Spot shock value', async () => {
    it('should revert setting spot shock value when sender is not owner', async () => {
      const spotShockValue = scaleNum(0.75, 27)

      await expectRevert(
        calculator.setSpotShock(weth.address, usdc.address, usdc.address, true, spotShockValue, { from: random }),
        'Ownable: caller is not the owner',
      )
    })

    it('should revert setting spot shock value when value is equal to zero', async () => {
      const spotShockValue = scaleNum(0, 27)

      await expectRevert(
        calculator.setSpotShock(weth.address, usdc.address, usdc.address, true, spotShockValue, { from: owner }),
        'MarginCalculator: invalid spot shock value',
      )
    })

    it('should set spot shock value', async () => {
      const spotShockValue = scaleNum(0.75, 27)

      await calculator.setSpotShock(weth.address, usdc.address, usdc.address, true, spotShockValue, { from: owner })

      assert.equal(
        new BigNumber(await calculator.getSpotShock(weth.address, usdc.address, usdc.address, true)).toString(),
        spotShockValue.toString(),
        'Weth spot shock value mismatch',
      )
    })
  })

  describe('Oracle deviation value', async () => {
    it('should revert setting oracle deviation value when sender is not owner', async () => {
      const oracleDeviationValue = scaleNum(0.05, 27)

      await expectRevert(
        calculator.setOracleDeviation(oracleDeviationValue, { from: random }),
        'Ownable: caller is not the owner',
      )
    })

    it('should set oracle deviation value', async () => {
      const oracleDeviationValue = scaleNum(0.05, 27)

      await calculator.setOracleDeviation(oracleDeviationValue, { from: owner })

      assert.equal(
        new BigNumber(await calculator.getOracleDeviation()).toString(),
        oracleDeviationValue.toString(),
        'Oracle deviation value mismatch',
      )
    })
  })

  describe('Find upper bound value', async () => {
    it('should revert when product have an emptry time to expiry array', async () => {
      const optionExpiry = 60 * 24 * 7

      await expectRevert(
        calculator.findUpperBoundValue(weth.address, weth.address, weth.address, true, optionExpiry),
        'MarginCalculator: product have no expiry values',
      )
    })

    it('should revert when product have no upper bound value', async () => {
      const timeToExpiy = 60 * 24 * 10000
      const optionExpiry = new BigNumber(await time.latest()).plus(timeToExpiy)

      await expectRevert(
        calculator.findUpperBoundValue(weth.address, usdc.address, usdc.address, true, optionExpiry),
        'MarginCalculator: product have no upper bound value',
      )
    })

    describe('find upper bound value', async () => {
      // array of time to expiry
      const timeToExpiry = [60 * 24, 60 * 24 * 7, 60 * 24 * 14, 60 * 24 * 30]
      // array of upper bound value correspond to time to expiry
      const expiryToValue = [scaleNum(0.3, 27), scaleNum(0.4, 27), scaleNum(0.2, 27), scaleNum(0.06, 27)]

      before(async () => {
        // set time to expiry and each upper bound value
        await calculator.setUpperBoundValues(
          weth.address,
          usdc.address,
          weth.address,
          false,
          timeToExpiry,
          expiryToValue,
          {
            from: owner,
          },
        )
      })

      it('should return the upper bound value for the specific time to expiry', async () => {
        const optionExpiry = new BigNumber(await time.latest()).plus(timeToExpiry[1])

        const upperBoundValue = new BigNumber(
          await calculator.findUpperBoundValue(weth.address, usdc.address, weth.address, false, optionExpiry),
        )

        assert.equal(upperBoundValue.toString(), expiryToValue[1].toString(), 'Upper bound value found mismatch')
      })
    })
  })

  describe('Get naked margin requirement', async () => {
    const productSpotShockValue = scaleBigNum(0.75, 27)
    // array of time to expiry
    const day = 60 * 24
    const timeToExpiry = [day * 7, day * 14, day * 28, day * 42, day * 56]
    // array of upper bound value correspond to time to expiry
    const expiryToValue = [
      scaleNum(0.1678, 27),
      scaleNum(0.237, 27),
      scaleNum(0.3326, 27),
      scaleNum(0.4032, 27),
      scaleNum(0.4603, 27),
    ]

    before(async () => {
      // setup new calculator
      calculator = await MarginCalculator.new(oracle.address, addressBook.address, { from: owner })

      // set product spot shock value
      await calculator.setSpotShock(weth.address, usdc.address, usdc.address, true, productSpotShockValue)
      await calculator.setSpotShock(weth.address, usdc.address, weth.address, true, productSpotShockValue)
      await calculator.setSpotShock(weth.address, usdc.address, weth.address, false, productSpotShockValue)
      await calculator.setSpotShock(weth.address, usdc.address, usdc.address, false, productSpotShockValue)

      // set product upper bound values
      await calculator.setUpperBoundValues(
        weth.address,
        usdc.address,
        weth.address,
        false,
        timeToExpiry,
        expiryToValue,
        {
          from: owner,
        },
      )
      await calculator.setUpperBoundValues(
        weth.address,
        usdc.address,
        usdc.address,
        true,
        timeToExpiry,
        expiryToValue,
        {
          from: owner,
        },
      )
      await calculator.setUpperBoundValues(
        weth.address,
        usdc.address,
        weth.address,
        true,
        timeToExpiry,
        expiryToValue,
        {
          from: owner,
        },
      )
      await calculator.setUpperBoundValues(
        weth.address,
        usdc.address,
        usdc.address,
        false,
        timeToExpiry,
        expiryToValue,
        {
          from: owner,
        },
      )
      await calculator.setCollateralDust(usdc.address, scaleNum(10, usdcDecimals))
      await calculator.setCollateralDust(weth.address, scaleNum(0.01, wethDecimals))
    })

    it('should return required margin for naked margin vault: 100$ WETH put option with 150 spot price and 1 week to expiry', async () => {
      const shortAmount = 1
      const shortStrike = 100
      const underlyingPrice = 150
      const scaledShortAmount = scaleBigNum(shortAmount, 8)
      const scaledShortStrike = scaleBigNum(shortStrike, 8)
      const scaledUnderlyingPrice = scaleBigNum(underlyingPrice, 8)
      const isPut = true
      const optionExpiry = new BigNumber(await time.latest()).plus(timeToExpiry[0])
      // get option upper bound value
      const upperBoundValue = new BigNumber(
        await calculator.findUpperBoundValue(weth.address, usdc.address, usdc.address, true, optionExpiry),
      )
        .dividedBy(1e27)
        .toNumber()

      // expected required margin
      const expectedRequiredNakedMargin = expectedRequiredMargin(
        shortAmount,
        shortStrike,
        underlyingPrice,
        isPut,
        upperBoundValue,
        productSpotShockValue.dividedBy(1e27).toNumber(),
        usdc.address,
        weth.address,
      )

      const requiredMargin = new BigNumber(
        await calculator.getNakedMarginRequired(
          weth.address,
          usdc.address,
          usdc.address,
          scaledShortAmount,
          scaledShortStrike,
          scaledUnderlyingPrice,
          optionExpiry,
          usdcDecimals,
          isPut,
        ),
      )

      assert.equal(
        requiredMargin.dividedBy(10 ** usdcDecimals).toNumber(),
        expectedRequiredNakedMargin,
        'Required naked margin for put mismatch',
      )

      assert.isAtMost(
        calcRelativeDiff(new BigNumber('16.77778677'), requiredMargin.dividedBy(10 ** usdcDecimals)).toNumber(),
        errorDelta,
        'big error delta',
      )
    })

    it('should return required margin for naked margin vault: 100$ WETH put option ETH collateralised with 150 spot price and 1 week to expiry', async () => {
      const shortAmount = 1
      const shortStrike = 100
      const underlyingPrice = 150
      const scaledShortAmount = scaleBigNum(shortAmount, 8)
      const scaledShortStrike = scaleBigNum(shortStrike, 8)
      const scaledUnderlyingPrice = scaleBigNum(underlyingPrice, 8)
      const isPut = true
      const optionExpiry = new BigNumber(await time.latest()).plus(timeToExpiry[0])
      // get option upper bound value
      const upperBoundValue = new BigNumber(
        await calculator.findUpperBoundValue(weth.address, usdc.address, weth.address, true, optionExpiry),
      )
        .dividedBy(1e27)
        .toNumber()

      // expected required margin
      const expectedRequiredNakedMargin = expectedRequiredMargin(
        shortAmount,
        shortStrike,
        underlyingPrice,
        isPut,
        upperBoundValue,
        productSpotShockValue.dividedBy(1e27).toNumber(),
        weth.address,
        weth.address,
      )

      const requiredMargin = new BigNumber(
        await calculator.getNakedMarginRequired(
          weth.address,
          usdc.address,
          weth.address,
          scaledShortAmount,
          scaledShortStrike,
          scaledUnderlyingPrice,
          optionExpiry,
          wethDecimals,
          isPut,
        ),
      )

      assert.equal(
        requiredMargin.dividedBy(10 ** wethDecimals).toNumber(),
        expectedRequiredNakedMargin,
        'Required naked margin for put mismatch',
      )

      assert.isAtMost(
        calcRelativeDiff(new BigNumber('0.111867'), requiredMargin.dividedBy(10 ** wethDecimals)).toNumber(),
        errorDelta,
        'big error delta',
      )
    })

    it('should return required margin for naked margin vault: 1 options 2500$ WETH call option with 1800 spot price and 1 week to expiry', async () => {
      // set product shock value
      const spotShockValue = scaleNum(0.75, 27)
      await calculator.setSpotShock(weth.address, usdc.address, weth.address, false, spotShockValue, { from: owner })

      const shortAmount = 1
      const shortStrike = 2500
      const underlyingPrice = 1800
      const scaledShortAmount = scaleBigNum(shortAmount, 8)
      const scaledShortStrike = scaleBigNum(shortStrike, 8)
      const scaledUnderlyingPrice = scaleBigNum(underlyingPrice, 8)
      const isPut = false
      const optionExpiry = new BigNumber(await time.latest()).plus(timeToExpiry[0])
      // get option upper bound value
      const upperBoundValue = new BigNumber(
        await calculator.findUpperBoundValue(weth.address, usdc.address, weth.address, false, optionExpiry),
      )
        .dividedBy(1e27)
        .toNumber()

      // expected required margin
      const expectedRequiredNakedMargin = expectedRequiredMargin(
        shortAmount,
        shortStrike,
        underlyingPrice,
        isPut,
        upperBoundValue,
        productSpotShockValue.dividedBy(1e27).toNumber(),
        weth.address,
        weth.address,
      )

      const requiredMargin = new BigNumber(
        await calculator.getNakedMarginRequired(
          weth.address,
          usdc.address,
          weth.address,
          scaledShortAmount,
          scaledShortStrike,
          scaledUnderlyingPrice,
          optionExpiry,
          wethDecimals,
          isPut,
        ),
      )

      assert.equal(
        requiredMargin.dividedBy(10 ** wethDecimals).toNumber(),
        expectedRequiredNakedMargin,
        'Required naked margin for put mismatch',
      )

      assert.isAtMost(
        calcRelativeDiff(new BigNumber('0.1677778677'), requiredMargin.dividedBy(10 ** wethDecimals)).toNumber(),
        errorDelta,
        'big error delta',
      )
    })

    it('should return required margin for naked margin vault: 100k options 2500$ WETH call option with 1800 spot price and 1 week to expiry', async () => {
      // set product shock value
      const spotShockValue = scaleNum(0.75, 27)
      await calculator.setSpotShock(weth.address, usdc.address, weth.address, false, spotShockValue, { from: owner })

      const shortAmount = 100000
      const shortStrike = 2500
      const underlyingPrice = 1800
      const scaledShortAmount = scaleBigNum(shortAmount, 8)
      const scaledShortStrike = scaleBigNum(shortStrike, 8)
      const scaledUnderlyingPrice = scaleBigNum(underlyingPrice, 8)
      const isPut = false
      const optionExpiry = new BigNumber(await time.latest()).plus(timeToExpiry[0])
      // get option upper bound value
      const upperBoundValue = new BigNumber(
        await calculator.findUpperBoundValue(weth.address, usdc.address, weth.address, false, optionExpiry),
      )
        .dividedBy(1e27)
        .toNumber()

      // expected required margin
      const expectedRequiredNakedMargin = expectedRequiredMargin(
        shortAmount,
        shortStrike,
        underlyingPrice,
        isPut,
        upperBoundValue,
        productSpotShockValue.dividedBy(1e27).toNumber(),
        weth.address,
        weth.address,
      )

      const requiredMargin = new BigNumber(
        await calculator.getNakedMarginRequired(
          weth.address,
          usdc.address,
          weth.address,
          scaledShortAmount,
          scaledShortStrike,
          scaledUnderlyingPrice,
          optionExpiry,
          wethDecimals,
          isPut,
        ),
      )

      assert.equal(
        requiredMargin.dividedBy(10 ** wethDecimals).toNumber(),
        expectedRequiredNakedMargin,
        'Required naked margin for put mismatch',
      )
    })

    it('should return required margin for naked margin vault: 100k options 2500$ WETH call option with USDC collateral with 1800 spot price and 1 week to expiry', async () => {
      // set product shock value
      const spotShockValue = scaleNum(0.75, 27)
      await calculator.setSpotShock(weth.address, usdc.address, usdc.address, false, spotShockValue, { from: owner })

      const shortAmount = 100000
      const shortStrike = 2500
      const underlyingPrice = 1800
      const scaledShortAmount = scaleBigNum(shortAmount, 8)
      const scaledShortStrike = scaleBigNum(shortStrike, 8)
      const scaledUnderlyingPrice = scaleBigNum(underlyingPrice, 8)
      const isPut = false
      const optionExpiry = new BigNumber(await time.latest()).plus(timeToExpiry[0])
      // get option upper bound value
      const upperBoundValue = new BigNumber(
        await calculator.findUpperBoundValue(weth.address, usdc.address, usdc.address, false, optionExpiry),
      )
        .dividedBy(1e27)
        .toNumber()

      // expected required margin
      const expectedRequiredNakedMargin = expectedRequiredMargin(
        shortAmount,
        shortStrike,
        underlyingPrice,
        isPut,
        upperBoundValue,
        productSpotShockValue.dividedBy(1e27).toNumber(),
        usdc.address,
        weth.address,
      )

      const requiredMargin = new BigNumber(
        await calculator.getNakedMarginRequired(
          weth.address,
          usdc.address,
          usdc.address,
          scaledShortAmount,
          scaledShortStrike,
          scaledUnderlyingPrice,
          optionExpiry,
          usdcDecimals,
          isPut,
        ),
      )
      console.log(requiredMargin.dividedBy(10 ** usdcDecimals).toNumber(), expectedRequiredNakedMargin.toString())
      assert.equal(
        requiredMargin.dividedBy(10 ** usdcDecimals).toNumber(),
        Math.round(expectedRequiredNakedMargin),
        'Required naked margin for put mismatch',
      )
    })

    it('should return required margin for naked margin vault: 100$ WETH put option with 150 spot price and 2 weeks to expiry', async () => {
      const shortAmount = 1
      const shortStrike = 100
      const underlyingPrice = 150
      const scaledShortAmount = scaleBigNum(shortAmount, 8)
      const scaledShortStrike = scaleBigNum(shortStrike, 8)
      const scaledUnderlyingPrice = scaleBigNum(underlyingPrice, 8)
      const isPut = true
      const optionExpiry = new BigNumber(await time.latest()).plus(timeToExpiry[1])
      // get option upper bound value
      const upperBoundValue = new BigNumber(
        await calculator.findUpperBoundValue(weth.address, usdc.address, usdc.address, true, optionExpiry),
      )
        .dividedBy(1e27)
        .toNumber()

      // expected required margin
      const expectedRequiredNakedMargin = expectedRequiredMargin(
        shortAmount,
        shortStrike,
        underlyingPrice,
        isPut,
        upperBoundValue,
        productSpotShockValue.dividedBy(1e27).toNumber(),
        usdc.address,
        weth.address,
      )

      const requiredMargin = new BigNumber(
        await calculator.getNakedMarginRequired(
          weth.address,
          usdc.address,
          usdc.address,
          scaledShortAmount,
          scaledShortStrike,
          scaledUnderlyingPrice,
          optionExpiry,
          usdcDecimals,
          isPut,
        ),
      )

      assert.equal(
        requiredMargin.dividedBy(10 ** usdcDecimals).toNumber(),
        expectedRequiredNakedMargin,
        'Required naked margin for put mismatch',
      )

      assert.isAtMost(
        calcRelativeDiff(new BigNumber('23.6996538'), requiredMargin.dividedBy(10 ** usdcDecimals)).toNumber(),
        errorDelta,
        'big error delta',
      )
    })

    it('should revert if naked margin vault have long otoken', async () => {
      const optionExpiry = new BigNumber(await time.latest()).plus(timeToExpiry[1])

      const shortOtoken = await MockOtoken.new()
      await shortOtoken.init(
        addressBook.address,
        weth.address,
        usdc.address,
        usdc.address,
        scaleNum(200),
        optionExpiry,
        true,
      )
      const longOtoken = await MockOtoken.new()
      await longOtoken.init(
        addressBook.address,
        weth.address,
        usdc.address,
        usdc.address,
        scaleNum(250),
        optionExpiry,
        true,
      )

      const vault = createVault(shortOtoken.address, longOtoken.address, undefined, scaleNum(1), scaleNum(1), undefined)

      await expectRevert(
        calculator.getExcessCollateral(vault, vaultType),
        'MarginCalculator: naked margin vault cannot have long otoken',
      )
    })

    it('should revert if naked margin vault have collateral amount less than dust amount', async () => {
      // set dust amount for USDC
      const usdcDustAmount = createScaledBigNumber(30, usdcDecimals)
      await calculator.setCollateralDust(usdc.address, usdcDustAmount, { from: owner })

      const optionExpiry = new BigNumber(await time.latest()).plus(timeToExpiry[1])
      const shortOtoken = await MockOtoken.new()
      await shortOtoken.init(
        addressBook.address,
        weth.address,
        usdc.address,
        usdc.address,
        scaleNum(200),
        optionExpiry,
        true,
      )
      const collateralAmount = scaleNum(10, usdcDecimals)
      const vault = createVault(shortOtoken.address, undefined, usdc.address, scaleNum(1), undefined, collateralAmount)

      await expectRevert(
        calculator.getExcessCollateral(vault, vaultType),
        'MarginCalculator: naked margin vault should have collateral amount greater than dust amount',
      )
    })

    it('should return correct excess value for naked margin vault: 100$ WETH put option with 150 spot price, 1 week to expiry, 16.78 USDC collateral and 0 USDC excess', async () => {
      const shortAmount = 1
      const shortStrike = 100
      const underlyingPrice = 150
      const scaledUnderlyingPrice = scaleBigNum(underlyingPrice, 8)
      const isPut = true
      const optionExpiry = new BigNumber(await time.latest()).plus(timeToExpiry[0])
      // get option upper bound value
      const upperBoundValue = new BigNumber(
        await calculator.findUpperBoundValue(weth.address, usdc.address, usdc.address, true, optionExpiry),
      )
        .dividedBy(1e27)
        .toNumber()

      // expected required margin
      const expectedRequiredNakedMargin = expectedRequiredMargin(
        shortAmount,
        shortStrike,
        underlyingPrice,
        isPut,
        upperBoundValue,
        productSpotShockValue.dividedBy(1e27).toNumber(),
        usdc.address,
        weth.address,
      )

      assert.isAtMost(
        calcRelativeDiff(new BigNumber('16.77778677'), new BigNumber(expectedRequiredNakedMargin)).toNumber(),
        errorDelta,
        'big error delta',
      )

      const shortOtoken = await MockOtoken.new()
      await shortOtoken.init(
        addressBook.address,
        weth.address,
        usdc.address,
        usdc.address,
        scaleNum(100),
        optionExpiry,
        true,
      )

      // update dust amount for this test case to work
      const usdcDust = scaleNum(expectedRequiredNakedMargin - 0.5, usdcDecimals)
      await calculator.setCollateralDust(usdc.address, usdcDust, { from: owner })

      // set underlying price in oracle
      await oracle.setRealTimePrice(weth.address, scaledUnderlyingPrice)

      const collateralAmount = scaleNum(expectedRequiredNakedMargin, usdcDecimals)
      const vault = createVault(shortOtoken.address, undefined, usdc.address, scaleNum(1), undefined, collateralAmount)

      const getExcessCollateralResult = await calculator.getExcessCollateral(vault, vaultType)

      assert.equal(getExcessCollateralResult[0].toString(), '0', 'Excess collateral value mismatch')
      assert.equal(getExcessCollateralResult[1], true, 'isValid vault result mismatch')
    })

    it('should return correct excess value for naked margin vault: 100$ WETH put option with 150 spot price, 1 week to expiry, 30 USDC collateral and 13.22 USDC excess', async () => {
      const shortAmount = 1
      const shortStrike = 100
      const underlyingPrice = 150
      const scaledUnderlyingPrice = scaleBigNum(underlyingPrice, 8)
      const isPut = true
      const optionExpiry = new BigNumber(await time.latest()).plus(timeToExpiry[0])
      // get option upper bound value
      const upperBoundValue = new BigNumber(
        await calculator.findUpperBoundValue(weth.address, usdc.address, usdc.address, true, optionExpiry),
      )
        .dividedBy(1e27)
        .toNumber()

      // expected required margin
      const expectedRequiredNakedMargin = expectedRequiredMargin(
        shortAmount,
        shortStrike,
        underlyingPrice,
        isPut,
        upperBoundValue,
        productSpotShockValue.dividedBy(1e27).toNumber(),
        usdc.address,
        weth.address,
      )

      assert.isAtMost(
        calcRelativeDiff(new BigNumber('16.77778677'), new BigNumber(expectedRequiredNakedMargin)).toNumber(),
        errorDelta,
        'big error delta',
      )

      const shortOtoken = await MockOtoken.new()
      await shortOtoken.init(
        addressBook.address,
        weth.address,
        usdc.address,
        usdc.address,
        scaleNum(100),
        optionExpiry,
        true,
      )

      // set underlying price in oracle
      await oracle.setRealTimePrice(weth.address, scaledUnderlyingPrice)

      const collateralAmount = scaleNum(30, usdcDecimals)
      const vault = createVault(shortOtoken.address, undefined, usdc.address, scaleNum(1), undefined, collateralAmount)

      const getExcessCollateralResult = await calculator.getExcessCollateral(vault, vaultType)

      assert.equal(
        getExcessCollateralResult[0].toString(),
        new BigNumber(collateralAmount).minus(expectedRequiredNakedMargin * 10 ** usdcDecimals).toString(),
        'Excess collateral value mismatch',
      )
      assert.equal(getExcessCollateralResult[1], true, 'isValid vault result mismatch')
    })

    it('should return correct excess value for naked margin vault: 100$ WETH call option usdc collat with 50 spot, 1 week to expiry, 30 USDC collateral and 13.22 USDC excess', async () => {
      const shortAmount = 1
      const shortStrike = 100
      const underlyingPrice = 50
      const scaledUnderlyingPrice = scaleBigNum(underlyingPrice, 8)
      const isPut = false
      const optionExpiry = new BigNumber(await time.latest()).plus(timeToExpiry[0])
      // get option upper bound value
      const upperBoundValue = new BigNumber(
        await calculator.findUpperBoundValue(weth.address, usdc.address, usdc.address, false, optionExpiry),
      )
        .dividedBy(1e27)
        .toNumber()

      // expected required margin
      const expectedRequiredNakedMargin = expectedRequiredMargin(
        shortAmount,
        shortStrike,
        underlyingPrice,
        isPut,
        upperBoundValue,
        productSpotShockValue.dividedBy(1e27).toNumber(),
        usdc.address,
        weth.address,
      )
      assert.isAtMost(
        calcRelativeDiff(new BigNumber('14.6825'), new BigNumber(expectedRequiredNakedMargin)).toNumber(),
        errorDelta,
        'big error delta',
      )

      const shortOtoken = await MockOtoken.new()
      await shortOtoken.init(
        addressBook.address,
        weth.address,
        usdc.address,
        usdc.address,
        scaleNum(100),
        optionExpiry,
        false,
      )

      // set underlying price in oracle
      await oracle.setRealTimePrice(weth.address, scaledUnderlyingPrice)

      const collateralAmount = scaleNum(30, usdcDecimals)
      const vault = createVault(shortOtoken.address, undefined, usdc.address, scaleNum(1), undefined, collateralAmount)

      const getExcessCollateralResult = await calculator.getExcessCollateral(vault, vaultType)
      assert.approximately(
        getExcessCollateralResult[0].toNumber(),
        new BigNumber(collateralAmount).minus(expectedRequiredNakedMargin * 10 ** usdcDecimals).toNumber(),
        errorDelta,
        'Excess collateral value mismatch',
      )
      assert.equal(getExcessCollateralResult[1], true, 'isValid vault result mismatch')
    })

    it('should return false and the needed collateral amount for undercollateralized naked margin vault: 1 options 2500$ WETH call option with 1800 spot price and 1 week to expiry,', async () => {
      const shortAmount = 1
      const shortStrike = 2500
      const underlyingPrice = 1800
      const scaledUnderlyingPrice = scaleBigNum(underlyingPrice, 8)
      const isPut = false
      const optionExpiry = new BigNumber(await time.latest()).plus(timeToExpiry[0])
      // get option upper bound value
      const upperBoundValue = new BigNumber(
        await calculator.findUpperBoundValue(weth.address, usdc.address, weth.address, isPut, optionExpiry),
      )
        .dividedBy(1e27)
        .toNumber()

      // expected required margin
      const expectedRequiredNakedMargin = expectedRequiredMargin(
        shortAmount,
        shortStrike,
        underlyingPrice,
        isPut,
        upperBoundValue,
        productSpotShockValue.dividedBy(1e27).toNumber(),
        weth.address,
        weth.address,
      )

      assert.isAtMost(
        calcRelativeDiff(new BigNumber('0.1677778677'), new BigNumber(expectedRequiredNakedMargin)).toNumber(),
        errorDelta,
        'big error delta',
      )

      const shortOtoken = await MockOtoken.new()
      await shortOtoken.init(
        addressBook.address,
        weth.address,
        usdc.address,
        weth.address,
        scaleNum(2500),
        optionExpiry,
        isPut,
      )

      // set underlying price in oracle
      await oracle.setRealTimePrice(weth.address, scaledUnderlyingPrice)

      const collateralAmount = scaleNum(expectedRequiredNakedMargin - 0.1, wethDecimals)
      const vault = createVault(shortOtoken.address, undefined, weth.address, scaleNum(1), undefined, collateralAmount)

      const getExcessCollateralResult = await calculator.getExcessCollateral(vault, vaultType)

      assert.equal(
        getExcessCollateralResult[0].toString(),
        new BigNumber(0.1).multipliedBy(10 ** wethDecimals).toString(),
        'Needed collateral value mismatch',
      )
      assert.equal(getExcessCollateralResult[1], false, 'isValid vault result mismatch')
    })
  })

  describe('Update upper bound value', async () => {
    it('should revert updating time to expiry upper bound to a value equal to zero', async () => {
      const timeToExpiry = 60 * 24 * 7
      const upperBoundValue = scaleNum(0, 27)

      await expectRevert(
        calculator.updateUpperBoundValue(
          weth.address,
          usdc.address,
          usdc.address,
          true,
          timeToExpiry,
          upperBoundValue,
          { from: owner },
        ),
        'MarginCalculator: invalid option upper bound value',
      )
    })

    it('should revert updating non existant upper bound value', async () => {
      const timeToExpiry = 60 * 24 * 336
      const upperBoundValue = scaleNum(0.05, 27)

      await expectRevert(
        calculator.updateUpperBoundValue(
          weth.address,
          usdc.address,
          usdc.address,
          true,
          timeToExpiry,
          upperBoundValue,
          { from: owner },
        ),
        'MarginCalculator: upper bound value not found',
      )
    })

    it('should update upper bound value', async () => {
      const timeToExpiry = 60 * 24 * 7
      const upperBoundValue = scaleNum(0.1, 27)

      const oldUpperBoundValue = await calculator.getMaxPrice(
        weth.address,
        usdc.address,
        usdc.address,
        true,
        timeToExpiry,
      )

      await calculator.updateUpperBoundValue(
        weth.address,
        usdc.address,
        usdc.address,
        true,
        timeToExpiry,
        upperBoundValue,
        { from: owner },
      )

      const updatedUpperBoundValue = await calculator.getMaxPrice(
        weth.address,
        usdc.address,
        usdc.address,
        true,
        timeToExpiry,
      )

      assert.notEqual(oldUpperBoundValue, updatedUpperBoundValue, 'updated upper bound value mismatch')
    })
  })
})
