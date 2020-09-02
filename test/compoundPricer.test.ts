import {
  MockPricerInstance,
  MockOracleInstance,
  MockERC20Instance,
  MockCTokenInstance,
  CompoundPricerInstance,
} from '../build/types/truffle-types'
import BigNumber from 'bignumber.js'
import {createScaledNumber} from './utils'
const {expectRevert, time} = require('@openzeppelin/test-helpers')

const MockPricer = artifacts.require('MockPricer.sol')
const MockOracle = artifacts.require('MockOracle.sol')

const MockERC20 = artifacts.require('MockERC20.sol')
const MockCToken = artifacts.require('MockCToken.sol')
const CompoundPricer = artifacts.require('CompoundPricer.sol')

// address(0)
const ZERO_ADDR = '0x0000000000000000000000000000000000000000'

const underlyingPriceToCtokenPrice = async (
  underlyingPrice: BigNumber,
  exchangeRate: BigNumber,
  underlying: MockERC20Instance,
) => {
  const underlyingDecimals = new BigNumber(await underlying.decimals())
  const cTokenDecimals = new BigNumber(8)
  return exchangeRate
    .times(underlyingPrice)
    .times(new BigNumber(10).exponentiatedBy(cTokenDecimals))
    .div(new BigNumber(10).exponentiatedBy(underlyingDecimals.plus(new BigNumber(18))))
    .integerValue()
}

contract('CompoundPricer', ([owner, random]) => {
  let oracle: MockOracleInstance
  let weth: MockERC20Instance
  let cETH: MockCTokenInstance
  let chainlinkPricer: MockPricerInstance
  let compoundPricer: CompoundPricerInstance
  // mock contracts

  before('Deployment', async () => {
    // deploy mock contracts
    oracle = await MockOracle.new({from: owner})
    weth = await MockERC20.new('WETH', 'WETH')
    cETH = await MockCToken.new('CETH', 'CETH')
    //
    chainlinkPricer = await MockPricer.new(weth.address, oracle.address)
  })

  describe('constructor', () => {
    it('should deploy the contract successfully', async () => {
      compoundPricer = await CompoundPricer.new(cETH.address, weth.address, chainlinkPricer.address, oracle.address)
    })
    it('should revert if initializing with cToken = 0', async () => {
      await expectRevert(
        CompoundPricer.new(ZERO_ADDR, weth.address, chainlinkPricer.address, oracle.address),
        'CompoundPricer: cToken address can not be 0',
      )
    })
    it('should revert if initializing with underlying = 0 address', async () => {
      await expectRevert(
        CompoundPricer.new(cETH.address, ZERO_ADDR, chainlinkPricer.address, oracle.address),
        'CompoundPricer: underlying address can not be 0',
      )
    })
    it('should revert if initializing with underlying pricer = 0', async () => {
      await expectRevert(
        CompoundPricer.new(cETH.address, weth.address, ZERO_ADDR, oracle.address),
        'CompoundPricer: underlying pricer address can not be 0',
      )
    })
    it('should revert if initializing with oracle = 0 address', async () => {
      await expectRevert(
        CompoundPricer.new(cETH.address, weth.address, chainlinkPricer.address, ZERO_ADDR),
        'CompoundPricer: oracle address can not be 0',
      )
    })
  })

  describe('getPrice for cETH', () => {
    const ethPrice = createScaledNumber(470)
    const exchangeRate = new BigNumber('200192735438752381581313918')
    before('mock data in chainlink pricer and cToken', async () => {
      await chainlinkPricer.setPrice(ethPrice)
      await cETH.setExchangeRate(exchangeRate)
    })
    it('should return the price in 1e18', async () => {
      // how much 1e8 cToken worth in USD
      const cTokenprice = await compoundPricer.getPrice()
      const expectResult = await underlyingPriceToCtokenPrice(new BigNumber(ethPrice), exchangeRate, weth)
      assert.equal(cTokenprice.toString(), expectResult.toString())
      // hard coded answer
      // 1 cETH = 9.4 USD
      assert.equal(cTokenprice.toString(), '9409058565621361934')
    })
    it('should return the new price after resetting answer in aggregator', async () => {
      const newPrice = createScaledNumber(500)
      await chainlinkPricer.setPrice(newPrice)
      const cTokenPrice = await compoundPricer.getPrice()
      const expectedResult = await underlyingPriceToCtokenPrice(new BigNumber(newPrice), exchangeRate, weth)
      assert.equal(cTokenPrice.toString(), expectedResult.toString())
    })
    it('should revert if price is lower than 0', async () => {
      await chainlinkPricer.setPrice('0')
      await expectRevert(compoundPricer.getPrice(), 'CompoundPricer: underlying price is 0')
    })
  })

  describe('setExpiryPrice', () => {
    // time order: t0, t1, t2, t3, t4
    let expiry: number
    const ethPrice = new BigNumber(createScaledNumber(300))
    const exchangeRate = new BigNumber('200192735438752381581313918')

    before('setup oracle record for weth price', async () => {
      expiry = (await time.latest()) + time.duration.days(30).toNumber()
    })

    it("should revert if oracle don't have price of underlying yet", async () => {
      await expectRevert(compoundPricer.setExpiryPriceToOralce(expiry), 'CompoundPricer: underlying price not set yet.')
    })

    it('should set price successfully by arbitrary address', async () => {
      await oracle.setExpiryPrice(weth.address, expiry, ethPrice)
      await compoundPricer.setExpiryPriceToOralce(expiry, {from: random})
      const [price] = await oracle.getExpiryPrice(cETH.address, expiry)
      const expectedResult = await underlyingPriceToCtokenPrice(ethPrice, exchangeRate, weth)
      assert.equal(price.toString(), expectedResult.toString())
    })
  })
})
