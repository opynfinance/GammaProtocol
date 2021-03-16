import {
  MockERC20Instance,
  CalculatorTesterInstance,
  MockAddressBookInstance,
  MockOracleInstance,
  MockOtokenInstance,
} from '../../build/types/truffle-types'
import {createScaledNumber as scaleNum, createScaledBigNumber as scaleBigNum} from '../utils'
import {assert} from 'chai'
import BigNumber from 'bignumber.js'

const {expectRevert, time} = require('@openzeppelin/test-helpers')
const MockAddressBook = artifacts.require('MockAddressBook.sol')
const MockOracle = artifacts.require('MockOracle.sol')
const MockOtoken = artifacts.require('MockOtoken.sol')
const MockERC20 = artifacts.require('MockERC20.sol')
const MarginCalculator = artifacts.require('CalculatorTester.sol')
const ZERO_ADDR = '0x0000000000000000000000000000000000000000'

const expectedRequiredMargin = (
  shortAmount: number,
  strikePrice: number,
  underlyingPrice: number,
  isPut: boolean,
  upperBoundValue: number,
  spotShockValue: number,
) => {
  let a, b, marginRequired
  // if (isPut) {
  //   a = BigNumber.minimum(strikePrice, spotShockValue.times(underlyingPrice).dividedBy(1e27))
  //   b = BigNumber.maximum(strikePrice.minus(spotShockValue.times(underlyingPrice).dividedBy(1e27)), new BigNumber(0))
  //   marginRequired = upperBoundValue.times(a).plus(b).times(shortAmount).dividedBy(1e27)
  // } else {
  //   const one = scaleBigNum(1, 27)
  //   a = BigNumber.minimum(one, strikePrice.dividedBy(underlyingPrice.dividedBy(spotShockValue)))
  //   b = BigNumber.maximum(one.minus(strikePrice.dividedBy(underlyingPrice.dividedBy(spotShockValue))), new BigNumber(0))
  //   marginRequired = upperBoundValue.times(a).plus(b).times(shortAmount);
  // }

  if (isPut) {
    a = Math.min(strikePrice, spotShockValue * underlyingPrice)
    b = Math.max(strikePrice - spotShockValue * underlyingPrice, 0)
    marginRequired = upperBoundValue * a + b
  } else {
    a = Math.min(1, strikePrice / (underlyingPrice / spotShockValue))
    b = Math.max(1 - strikePrice / (underlyingPrice / spotShockValue), 0)
    marginRequired = upperBoundValue * a + b
  }

  return marginRequired
}

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
      const wethDust = scaleNum(1, 27)
      await calculator.setCollateralDust(weth.address, wethDust, {from: owner})

      const dustAmount = new BigNumber(await calculator.getCollateralDust(weth.address))

      assert.equal(dustAmount.toString(), wethDust.toString(), 'Weth dust amount mismatch')
    })

    it('should revert setting collateral dust from address other than owner', async () => {
      const wethDust = scaleNum(0, 27)

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
        calculator.setProductTimeToExpiry(weth.address, usdc.address, usdc.address, true, timeToExpiry, {
          from: random,
        }),
        'Ownable: caller is not the owner',
      )
    })

    it('should revert setting time to expiry value when caller is not owner', async () => {
      const upperBoundValue = scaleNum(0.5, 27)
      const timeToExpiry = 60 * 24 * 7

      await expectRevert(
        calculator.setTimeToExpiryValue(weth.address, usdc.address, usdc.address, true, timeToExpiry, upperBoundValue, {
          from: random,
        }),
        'Ownable: caller is not the owner',
      )
    })

    it('should revert setting time to expiry value when value is equal to zero', async () => {
      const upperBoundValue = scaleNum(0, 27)
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
        calculator.setProductTimeToExpiry(weth.address, usdc.address, usdc.address, true, timeToExpiry, {
          from: owner,
        }),
        'MarginCalculator: no expiry upper bound value found',
      )
    })

    it('should set time to expiry value when caller is not owner', async () => {
      const upperBoundValue = scaleNum(0.5, 27)
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
        calculator.setProductTimeToExpiry(weth.address, usdc.address, usdc.address, true, timeToExpiry, {
          from: owner,
        }),
        'MarginCalculator: expiry array is not in order',
      )
    })
  })

  describe('Spot shock value', async () => {
    it('should revert setting spot shock value when sender is not owner', async () => {
      const spotShockValue = scaleNum(0.75, 27)

      await expectRevert(
        calculator.setSpotShock(weth.address, usdc.address, usdc.address, true, spotShockValue, {from: random}),
        'Ownable: caller is not the owner',
      )
    })

    it('should set spot shock value', async () => {
      const spotShockValue = scaleNum(0.75, 27)

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
      const oracleDeviationValue = scaleNum(0.05, 27)

      await expectRevert(
        calculator.setOracleDeviation(oracleDeviationValue, {from: random}),
        'Ownable: caller is not the owner',
      )
    })

    it('should set oracle deviation value', async () => {
      const oracleDeviationValue = scaleNum(0.05, 27)

      await calculator.setOracleDeviation(oracleDeviationValue, {from: owner})

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
        for (let i = 0; i < expiryToValue.length; i++) {
          await calculator.setTimeToExpiryValue(
            weth.address,
            usdc.address,
            weth.address,
            false,
            timeToExpiry[i],
            expiryToValue[i],
            {from: owner},
          )
          await calculator.setProductTimeToExpiry(weth.address, usdc.address, weth.address, false, timeToExpiry[i], {
            from: owner,
          })
        }
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
    const timeToExpiry = [60 * 24, 60 * 24 * 7, 60 * 24 * 14, 60 * 24 * 30]
    // array of upper bound value correspond to time to expiry
    const expiryToValue = [scaleNum(0.3, 27), scaleNum(0.4, 27), scaleNum(0.2, 27), scaleNum(0.06, 27)]

    before(async () => {
      // setup new calculator
      calculator = await MarginCalculator.new(oracle.address, {from: owner})

      // set product spot shock value
      await calculator.setSpotShock(weth.address, usdc.address, usdc.address, true, productSpotShockValue)

      // set time to expiry and each upper bound value
      for (let i = 0; i < expiryToValue.length; i++) {
        await calculator.setTimeToExpiryValue(
          weth.address,
          usdc.address,
          usdc.address,
          true,
          timeToExpiry[i],
          expiryToValue[i],
          {from: owner},
        )
        await calculator.setProductTimeToExpiry(weth.address, usdc.address, usdc.address, true, timeToExpiry[i], {
          from: owner,
        })
      }
    })

    it('should return required margin for naked vault for a put option', async () => {
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
          isPut,
        ),
      )

      assert.equal(
        requiredMargin.dividedBy(1e27).toNumber(),
        expectedRequiredNakedMargin,
        'Required naked margin for put mismatch',
      )
    })
  })
})
