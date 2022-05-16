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
  createTokenAmount,
  expectedLiquidationPrice,
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

contract('MarginCalculator: liquidation', ([owner, random]) => {
  let expiry: number

  let calculator: CalculatorTesterInstance
  let addressBook: MockAddressBookInstance
  let oracle: MockOracleInstance
  let whitelist: MockWhitelistModuleInstance
  let usdc: MockERC20Instance
  let dai: MockERC20Instance
  let weth: MockERC20Instance

  const usdcDecimals = 6
  const daiDecimals = 8
  const wethDecimals = 18

  const wethDust = scaleNum(1, 27)
  const usdcDust = scaleNum(1, 27)
  const wethCap = scaleNum(50000, wethDecimals)
  const usdcCap = scaleNum(1000000, wethDecimals)

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
    calculator = await MarginCalculator.new(oracle.address, addressBook.address, { from: owner })
    // set collateral dust
    await calculator.setCollateralDust(weth.address, wethDust, { from: owner })
    await calculator.setCollateralDust(usdc.address, usdcDust, { from: owner })
    // set product spot shock value
    await calculator.setSpotShock(weth.address, usdc.address, usdc.address, true, productSpotShockValue)
    await calculator.setSpotShock(weth.address, usdc.address, weth.address, false, productSpotShockValue)
    // set time to expiry and each upper bound value
    await calculator.setUpperBoundValues(weth.address, usdc.address, usdc.address, true, timeToExpiry, expiryToValue, {
      from: owner,
    })
    whitelist = await MockWhitelistModule.new(addressBook.address, { from: owner })
    await whitelist.whitelistCollateral(usdc.address)
    await whitelist.whitelistCollateral(weth.address)
    await whitelist.whitelistCoveredCollateral(usdc.address, weth.address, true)
    await whitelist.whitelistCoveredCollateral(weth.address, weth.address, false)
    await whitelist.whitelistNakedCollateral(usdc.address, weth.address, false)
    await addressBook.setWhitelist(whitelist.address)
  })

  describe('check if vault is liquidatable', () => {
    const oracleDeviation = 0.05

    const strikePrice = 200
    const scaledStrikePrice = createTokenAmount(strikePrice)
    const isPut = true

    let shortOtoken: MockOtokenInstance
    let optionExpiry: BigNumber

    beforeEach(async () => {
      const oracleDeviationValue = scaleNum(oracleDeviation, 27)
      await calculator.setOracleDeviation(oracleDeviationValue, { from: owner })

      optionExpiry = new BigNumber(await time.latest()).plus(timeToExpiry[1])

      shortOtoken = await MockOtoken.new()
      await shortOtoken.init(
        addressBook.address,
        weth.address,
        usdc.address,
        usdc.address,
        scaledStrikePrice,
        optionExpiry,
        isPut,
      )
    })

    it('should not be able to liquidate vault with type equal to 0', async () => {
      const vault = createVault(shortOtoken.address, undefined, undefined, scaleNum(1), undefined, undefined)
      const randomVaultLatestUpdate = '11111111'
      const randomRoundId = '1'
      const vaultType = '0'

      await expectRevert(
        calculator.isLiquidatable(vault, vaultType),
        'MarginCalculator: invalid vault type to liquidate',
      )
    })

    it('should return not liquidatable with 0 value for dust and price amount when vault have no short Otoken', async () => {
      const vault = createVault(undefined, undefined, undefined, scaleNum(0), undefined, undefined)
      const randomVaultLatestUpdate = '0'
      const randomRoundId = '1'

      const isLiquidatable = await calculator.isLiquidatable(vault, vaultType)

      assert.equal(isLiquidatable[0], false, 'isLiquidatable boolean value mismatch')
      assert.equal(new BigNumber(isLiquidatable[1]).toString(), '0', 'debt price value mismatch')
      assert.equal(new BigNumber(isLiquidatable[2]).toString(), '0', 'collateral dust value mismatch')
    })

    it('should not be able to liquidate vault with an expired short otoken', async () => {
      // advance time to after option expiry
      await time.increaseTo(optionExpiry.toNumber() + 10)

      const vault = createVault(shortOtoken.address, undefined, undefined, scaleNum(1), undefined, undefined)
      const randomVaultLatestUpdate = '0'
      const randomRoundId = '1'

      await expectRevert(
        calculator.isLiquidatable(vault, vaultType),
        'MarginCalculator: can not liquidate expired position',
      )
    })

    it('should return not liquidatable with 0 value for price and dust amount when vault is not undercollateralized', async () => {
      await time.increase(100)

      // set current underlying price and round price
      const roundId = '11198' // random round id
      const underlyingPrice = 300
      const scaledUnderlyingPrice = scaleBigNum(underlyingPrice, 8)
      await oracle.setRealTimePrice(weth.address, scaledUnderlyingPrice)

      const shortAmount = createTokenAmount(1)
      const requiredMargin = new BigNumber(
        await calculator.getNakedMarginRequired(
          weth.address,
          usdc.address,
          usdc.address,
          shortAmount,
          scaledStrikePrice,
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
      const isLiquidatable = await calculator.isLiquidatable(vault, vaultType)

      assert.equal(isLiquidatable[0], false, 'isLiquidatable boolean value mismatch')
      assert.equal(new BigNumber(isLiquidatable[1]).toString(), '0', 'debt price value mismatch')
      assert.equal(new BigNumber(isLiquidatable[2]).toString(), '0', 'collateral dust value mismatch')
    })

    it('should return liquidatable, the liquidation price and the dust amount for the collateral asset', async () => {
      const roundId = '11198' // random round id
      const roundTimestamp = (await time.latest()).toNumber()
      const underlyingPrice = 100
      const scaledUnderlyingPrice = scaleBigNum(underlyingPrice, 8)
      await oracle.setRealTimePrice(weth.address, scaledUnderlyingPrice)

      const shortAmount = createTokenAmount(1)
      const requiredMargin = new BigNumber(
        await calculator.getNakedMarginRequired(
          weth.address,
          usdc.address,
          usdc.address,
          shortAmount,
          scaledStrikePrice,
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
        requiredMargin.minus(5).toString(),
      )
      const randomVaultLatestUpdate = '0'
      const isLiquidatable = await calculator.isLiquidatable(vault, vaultType)

      const currentBlockTime = (await time.latest()).toNumber()
      const vaultCollateral = requiredMargin
        .minus(5)
        .dividedBy(10 ** usdcDecimals)
        .toNumber()
      const vaultDebt = 1
      const cv = strikePrice - underlyingPrice
      const expectedLiquidation = expectedLiquidationPrice(
        vaultCollateral,
        vaultDebt,
        cv,
        underlyingPrice,
        oracleDeviation,
        roundTimestamp,
        currentBlockTime,
        isPut,
        usdcDecimals,
        usdc.address,
        weth.address,
      )

      assert.equal(isLiquidatable[0], true, 'isLiquidatable boolean value mismatch')
      assert.equal(
        new BigNumber(isLiquidatable[1].toString()).toString(),
        new BigNumber(Math.round(expectedLiquidation).toString()).toString(),
        'debt price value mismatch',
      )
      assert.equal(isLiquidatable[2].toString(), usdcDust, 'collateral dust value mismatch')
    })

    it('should return ending price when auction elapsed time is greater than auction time', async () => {
      const roundId = '11198' // random round id
      const roundTimestamp = (await time.latest()).toNumber()
      const underlyingPrice = 100
      const scaledUnderlyingPrice = scaleBigNum(underlyingPrice, 8)
      await oracle.setRealTimePrice(weth.address, scaledUnderlyingPrice)

      const shortAmount = createTokenAmount(1)
      const requiredMargin = new BigNumber(
        await calculator.getNakedMarginRequired(
          weth.address,
          usdc.address,
          usdc.address,
          shortAmount,
          scaledStrikePrice,
          scaledUnderlyingPrice,
          optionExpiry,
          usdcDecimals,
          isPut,
        ),
      )

      // advance time so that now-auction timestamp < auction length
      await time.increase(3600)

      const vault = createVault(
        shortOtoken.address,
        undefined,
        usdc.address,
        scaleNum(1),
        undefined,
        requiredMargin.minus(5).toString(),
      )
      const randomVaultLatestUpdate = '0'
      const isLiquidatable = await calculator.isLiquidatable(vault, vaultType)

      const currentBlockTime = (await time.latest()).toNumber()
      const vaultCollateral = requiredMargin
        .minus(5)
        .dividedBy(10 ** usdcDecimals)
        .toNumber()
      const vaultDebt = 1
      const cv = strikePrice - underlyingPrice
      const expectedLiquidation = expectedLiquidationPrice(
        vaultCollateral,
        vaultDebt,
        cv,
        underlyingPrice,
        oracleDeviation,
        roundTimestamp,
        currentBlockTime,
        isPut,
        usdcDecimals,
        usdc.address,
        weth.address,
      )

      assert.equal(isLiquidatable[0], true, 'isLiquidatable boolean value mismatch')
      assert.equal(new BigNumber(isLiquidatable[1]).toNumber(), expectedLiquidation, 'debt price value mismatch')
      assert.equal(new BigNumber(isLiquidatable[2]).toString(), usdcDust, 'collateral dust value mismatch')
    })
  })

  describe('liquidation price', async () => {
    const oracleDeviation = 0.05

    before(async () => {
      const oracleDeviationValue = scaleNum(oracleDeviation, 27)

      await calculator.setOracleDeviation(oracleDeviationValue, { from: owner })
    })

    it('should return correct liquidation price for undercollateralized put option', async () => {
      const strikePrice = 100
      const spotPrice = 80
      const cv = strikePrice - spotPrice
      const vaultCollateral = 40
      const vaultDebt = 1
      const auctionStartingTime = (await time.latest()).toNumber() - 120

      const scaledSpotPrice = createTokenAmount(spotPrice)
      const scaledCashValue = createTokenAmount(cv)
      const scaledVaultCollateral = createTokenAmount(vaultCollateral, usdcDecimals)
      const scaledVaultDebt = createTokenAmount(vaultDebt)
      const isPut = true
      console.log(await whitelist.isCoveredWhitelistedCollateral(usdc.address, weth.address, true))
      const liquidationprice = new BigNumber(
        await calculator.price(
          scaledVaultCollateral,
          scaledVaultDebt,
          usdcDecimals
        ),
      )

      const currentBlockTime = (await time.latest()).toNumber()

      const expectedLiquidation = expectedLiquidationPrice(
        vaultCollateral,
        vaultDebt,
        cv,
        spotPrice,
        oracleDeviation,
        auctionStartingTime,
        currentBlockTime,
        isPut,
        usdcDecimals,
        usdc.address,
        weth.address,
      )
      console.log(liquidationprice.toNumber(), expectedLiquidation)
      assert.equal(liquidationprice.toNumber(), expectedLiquidation, 'liquidation price mismatch')
    })

    it('should return correct liquidation price for undercollateralized call option', async () => {
      const strikePrice = 1500
      const spotPrice = 5000
      const cv = spotPrice - strikePrice
      const vaultCollateral = 0.5
      const vaultDebt = 1
      const auctionStartingTime = (await time.latest()).toNumber() - 120

      const scaledSpotPrice = createTokenAmount(spotPrice)
      const scaledCashValue = createTokenAmount(cv)
      const scaledVaultCollateral = createTokenAmount(vaultCollateral, wethDecimals)
      const scaledVaultDebt = createTokenAmount(vaultDebt)
      const isPut = false

      const liquidationprice = new BigNumber(
        await calculator.price(
          scaledVaultCollateral,
          scaledVaultDebt,
          wethDecimals
        ),
      )

      const currentBlockTime = (await time.latest()).toNumber()

      const expectedLiquidation = expectedLiquidationPrice(
        vaultCollateral,
        vaultDebt,
        cv,
        spotPrice,
        oracleDeviation,
        auctionStartingTime,
        currentBlockTime,
        isPut,
        wethDecimals,
        weth.address,
        weth.address,
      )

      assert.equal(liquidationprice.toNumber(), expectedLiquidation, 'liquidation price mismatch')
    })

    it('should cap liquidation price to ending price when it is greater than vault collateral', async () => {
      const strikePrice = 150
      const spotPrice = 60
      const cv = strikePrice - spotPrice
      const vaultCollateral = 26
      const vaultDebt = 1
      const auctionStartingTime = (await time.latest()).toNumber() - 120

      const scaledSpotPrice = createTokenAmount(spotPrice)
      const scaledCashValue = createTokenAmount(cv)
      const scaledVaultCollateral = createTokenAmount(vaultCollateral, usdcDecimals)
      const scaledVaultDebt = createTokenAmount(vaultDebt)
      const isPut = true

      const liquidationprice = new BigNumber(
        await calculator.price(
          scaledVaultCollateral,
          scaledVaultDebt,
          usdcDecimals
        ),
      )

      const currentBlockTime = (await time.latest()).toNumber()

      const expectedLiquidation = expectedLiquidationPrice(
        vaultCollateral,
        vaultDebt,
        cv,
        spotPrice,
        oracleDeviation,
        auctionStartingTime,
        currentBlockTime,
        isPut,
        usdcDecimals,
        weth.address,
        weth.address,
      )

      assert.equal(
        liquidationprice.toNumber(),
        (vaultCollateral / vaultDebt) * 10 ** usdcDecimals,
        'liquidation price mismatch',
      )
    })
  })
})
