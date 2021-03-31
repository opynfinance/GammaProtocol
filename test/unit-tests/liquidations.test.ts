import {
  MockERC20Instance,
  CalculatorTesterInstance,
  MockAddressBookInstance,
  MockOracleInstance,
  MockOtokenInstance,
} from '../../build/types/truffle-types'
import {
  createScaledNumber as scaleNum,
  createScaledBigNumber as scaleBigNum,
  createVault,
  createScaledBigNumber,
  createScaledNumber,
  createTokenAmount,
} from '../utils'
import {assert} from 'chai'
import BigNumber from 'bignumber.js'

const {expectRevert, time} = require('@openzeppelin/test-helpers')
const MockAddressBook = artifacts.require('MockAddressBook.sol')
const MockOracle = artifacts.require('MockOracle.sol')
const MockOtoken = artifacts.require('MockOtoken.sol')
const MockERC20 = artifacts.require('MockERC20.sol')
const MarginCalculator = artifacts.require('CalculatorTester.sol')
const ZERO_ADDR = '0x0000000000000000000000000000000000000000'

// const expectedLiqudidationPrice = (
//   collateral: number,
//   debt: number,
//   cashValue: number,
//   spotPrice: number,
//   oracleDeviation: number,
//   auctionStartingTime: number,
//   collateralDecimals: number,
//   isPut: boolean
// ) => {
//   let a;

//   if(isPut) {
//     a = Math.max(cashValue - oracleDeviation * spotPrice, 0)
//   } else {
//     a = Math.max(cashValue - oracleDeviation * spotPrice, 0) / spotPrice
//   }

//   const auctionElapsedTime = auctionStartingTime
// }

//   - let A = max(CV - D*S, 0) in the case of a put (where collateral and spot have the same units)
// - A = max(CV - D*S, 0)/S in the case of a call.
// - A is the starting price of the auction (collateral/otoken).
// - let B = C/O, where C is the total collateral in the vault, and O the total debt.
// - B is the ending price of the auction.
// - then auction offers (price of collateral in terms of debt):

//     P = A + (B-A) * max(t_e, T)/T
const expectedRequiredMargin = (
  shortAmount: number,
  strikePrice: number,
  underlyingPrice: number,
  isPut: boolean,
  upperBoundValue: number,
  spotShockValue: number,
) => {
  let a, b, marginRequired

  if (isPut) {
    a = Math.min(strikePrice, spotShockValue * underlyingPrice)
    b = Math.max(strikePrice - spotShockValue * underlyingPrice, 0)
    marginRequired = (upperBoundValue * a + b) * shortAmount
  } else {
    a = Math.min(1, strikePrice / (underlyingPrice / spotShockValue))
    b = Math.max(1 - strikePrice / (underlyingPrice / spotShockValue), 0)
    marginRequired = (upperBoundValue * a + b) * shortAmount
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

  const wethDust = scaleNum(1, 27)

  const vaultType = 1

  const errorDelta = 0.1

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
    // set collateral dust
    await calculator.setCollateralDust(weth.address, wethDust, {from: owner})
    // set product spot shock value
    await calculator.setSpotShock(weth.address, usdc.address, usdc.address, true, productSpotShockValue)
    await calculator.setSpotShock(weth.address, usdc.address, weth.address, false, productSpotShockValue)
    // set time to expiry and each upper bound value
    for (let i = 0; i < expiryToValue.length; i++) {
      // set for put product
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

      // set for call product
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

  describe('check if vault is liquidatable', async () => {
    const strikePrice = createTokenAmount(200)
    const isPut = true

    let shortOtoken: MockOtokenInstance
    let optionExpiry: BigNumber

    beforeEach(async () => {
      optionExpiry = new BigNumber(await time.latest()).plus(timeToExpiry[1])

      shortOtoken = await MockOtoken.new()
      await shortOtoken.init(
        addressBook.address,
        weth.address,
        usdc.address,
        usdc.address,
        strikePrice,
        optionExpiry,
        isPut,
      )
    })

    it('should not be able to liquidate vault with type equal to 1', async () => {
      const vault = createVault(shortOtoken.address, undefined, undefined, scaleNum(1), undefined, undefined)
      const randomVaultLatestUpdate = '11111111'
      const randomRoundId = '1'
      const vaultType = '0'

      await expectRevert(
        calculator.isLiquidatable(vault, vaultType, randomVaultLatestUpdate, randomRoundId),
        'MarginCalculator: invalid vault type to liquidate',
      )
    })

    it('should not be able to liquidate vault with an auction start timestamp less than latest vault update timestamp', async () => {
      const vault = createVault(shortOtoken.address, undefined, undefined, scaleNum(1), undefined, undefined)
      const randomVaultLatestUpdate = '11111111'
      const randomRoundId = '1'

      await expectRevert(
        calculator.isLiquidatable(vault, vaultType, randomVaultLatestUpdate, randomRoundId),
        'MarginCalculator: auction timestamp should be post vault latest update',
      )
    })

    it('should return not liquidatable with 0 value for dust and price amount when vault have no short Otoken', async () => {
      const vault = createVault(undefined, undefined, undefined, scaleNum(0), undefined, undefined)
      const randomVaultLatestUpdate = '0'
      const randomRoundId = '1'

      const isLiquidatable = await calculator.isLiquidatable(vault, vaultType, randomVaultLatestUpdate, randomRoundId)

      assert.equal(isLiquidatable[0], false, 'isLiquidatable boolean value mismatch')
      assert.equal(isLiquidatable[1].toString(), '0', 'debt price value mismatch')
      assert.equal(isLiquidatable[2].toString(), '0', 'collateral dust value mismatch')
    })

    it('should not be able to liquidate vault with an expired short otoken', async () => {
      // advance time to after option expiry
      await time.increaseTo(optionExpiry.toNumber() + 10)

      const vault = createVault(shortOtoken.address, undefined, undefined, scaleNum(1), undefined, undefined)
      const randomVaultLatestUpdate = '0'
      const randomRoundId = '1'

      await expectRevert(
        calculator.isLiquidatable(vault, vaultType, randomVaultLatestUpdate, randomRoundId),
        'MarginCalculator: can not liquidate vault with expired short otoken',
      )
    })

    it('should return not liquidatable with 0 value for price and dust amount when vault is not undercollateralized', async () => {
      // set current underlying price and round price
      const roundId = '11198' // random round id
      const underlyingPrice = 300
      const scaledUnderlyingPrice = scaleBigNum(underlyingPrice, 8)
      await oracle.setRealTimePrice(weth.address, scaledUnderlyingPrice)
      await oracle.setChainlinkRoundData(weth.address, roundId, scaledUnderlyingPrice, '0')

      const shortAmount = createTokenAmount(1)
      const requiredMargin = new BigNumber(
        await calculator.getNakedMarginRequired(
          weth.address,
          usdc.address,
          usdc.address,
          shortAmount,
          strikePrice,
          scaledUnderlyingPrice,
          optionExpiry,
          usdcDecimals,
          isPut,
        ),
      )
      const vault = createVault(
        shortOtoken.address,
        undefined,
        usdc.address,
        scaleNum(1),
        undefined,
        requiredMargin.toString(),
      )
      const randomVaultLatestUpdate = '0'
      const isLiquidatable = await calculator.isLiquidatable(vault, vaultType, randomVaultLatestUpdate, roundId)

      assert.equal(isLiquidatable[0], false, 'isLiquidatable boolean value mismatch')
      assert.equal(isLiquidatable[1].toString(), '0', 'debt price value mismatch')
      assert.equal(isLiquidatable[2].toString(), '0', 'collateral dust value mismatch')
    })
  })
})
