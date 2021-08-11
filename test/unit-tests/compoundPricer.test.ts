import {
  MockPricerInstance,
  MockOracleInstance,
  MockERC20Instance,
  MockCTokenInstance,
  CompoundPricerInstance,
} from '../../build/types/truffle-types'

import { underlyingPriceToCtokenPrice } from '../utils'

import BigNumber from 'bignumber.js'
import { createScaledNumber } from '../utils'
const { expectRevert, time } = require('@openzeppelin/test-helpers')

const MockPricer = artifacts.require('MockPricer.sol')
const MockOracle = artifacts.require('MockOracle.sol')

const MockERC20 = artifacts.require('MockERC20.sol')
const MockCToken = artifacts.require('MockCToken.sol')
const CompoundPricer = artifacts.require('CompoundPricer.sol')

// address(0)
const ZERO_ADDR = '0x0000000000000000000000000000000000000000'

contract('CompoundPricer', ([owner, random]) => {
  let oracle: MockOracleInstance
  let weth: MockERC20Instance
  let usdc: MockERC20Instance
  let cETH: MockCTokenInstance
  let cUSDC: MockCTokenInstance
  // old pricer
  let wethPricer: MockPricerInstance
  // compound pricer
  let cethPricer: CompoundPricerInstance
  let cusdcPricer: CompoundPricerInstance

  before('Deployment', async () => {
    // deploy mock contracts
    oracle = await MockOracle.new({ from: owner })
    weth = await MockERC20.new('WETH', 'WETH', 18)
    usdc = await MockERC20.new('USDC', 'USDC', 6)
    cETH = await MockCToken.new('CETH', 'CETH')
    cUSDC = await MockCToken.new('cUSDC', 'cUSDC')
    // mock underlying pricers
    wethPricer = await MockPricer.new(weth.address, oracle.address)

    await oracle.setAssetPricer(weth.address, wethPricer.address)
  })

  describe('constructor', () => {
    it('should deploy the contract successfully', async () => {
      cethPricer = await CompoundPricer.new(cETH.address, weth.address, oracle.address)
      cusdcPricer = await CompoundPricer.new(cUSDC.address, usdc.address, oracle.address)
    })
    it('should revert if initializing with cToken = 0', async () => {
      await expectRevert(
        CompoundPricer.new(ZERO_ADDR, weth.address, oracle.address),
        'CompoundPricer: cToken address can not be 0',
      )
    })
    it('should revert if initializing with underlying = 0 address', async () => {
      await expectRevert(
        CompoundPricer.new(cETH.address, ZERO_ADDR, oracle.address),
        'CompoundPricer: underlying address can not be 0',
      )
    })
    it('should revert if initializing with oracle = 0 address', async () => {
      await expectRevert(
        CompoundPricer.new(cETH.address, weth.address, ZERO_ADDR),
        'CompoundPricer: oracle address can not be 0',
      )
    })
  })

  describe('getPrice for cETH', () => {
    const ethPrice = createScaledNumber(470)
    const exchangeRate = new BigNumber('200192735438752381581313918')
    before('mock data in chainlink pricer and cToken', async () => {
      await oracle.setRealTimePrice(usdc.address, '100000000')
      await oracle.setRealTimePrice(weth.address, ethPrice)
      // await wethPricer.setPrice(ethPrice)
      await cETH.setExchangeRate(exchangeRate)
    })
    it('should return the price in 1e8', async () => {
      // how much 1e8 cToken worth in USD
      const cTokenprice = await cethPricer.getPrice()
      const expectResult = await underlyingPriceToCtokenPrice(new BigNumber(ethPrice), exchangeRate, weth)
      assert.equal(cTokenprice.toString(), expectResult.toString())
      // hard coded answer
      // 1 cETH = 9.4 USD
      assert.equal(cTokenprice.toString(), '940905856')
    })
    it('should return the new price after resetting answer in underlying pricer', async () => {
      const newPrice = createScaledNumber(500)
      // await wethPricer.setPrice(newPrice)
      await oracle.setRealTimePrice(weth.address, newPrice)
      const cTokenPrice = await cethPricer.getPrice()
      const expectedResult = await underlyingPriceToCtokenPrice(new BigNumber(newPrice), exchangeRate, weth)
      assert.equal(cTokenPrice.toString(), expectedResult.toString())
    })
    it('should revert if price is lower than 0', async () => {
      // await wethPricer.setPrice('0')
      await oracle.setRealTimePrice(weth.address, '0')
      await expectRevert(cethPricer.getPrice(), 'CompoundPricer: underlying price is 0')
    })
  })

  describe('getPrice for cUSDC', () => {
    const usdPrice = createScaledNumber(1)
    const exchangeRate = new BigNumber('211619877757422')

    before('mock data in chainlink pricer and cToken', async () => {
      await oracle.setStablePrice(usdc.address, '100000000')
      await cUSDC.setExchangeRate(exchangeRate)
    })

    it('should return the price in 1e8', async () => {
      // how much 1e8 cToken worth in USD
      const cTokenprice = await cusdcPricer.getPrice()
      const expectResult = await underlyingPriceToCtokenPrice(new BigNumber(usdPrice), exchangeRate, usdc)
      assert.equal(cTokenprice.toString(), expectResult.toString())
      // hard coded answer
      // 1 cUSDC = 0.02 USD
      assert.equal(cTokenprice.toString(), '2116198') // 0.0211 usd
    })
    it('should return the new price after resetting answer in underlying pricer', async () => {
      const newPrice = createScaledNumber(1.1)
      await oracle.setStablePrice(usdc.address, newPrice)
      const cTokenPrice = await cusdcPricer.getPrice()
      const expectedResult = await underlyingPriceToCtokenPrice(new BigNumber(newPrice), exchangeRate, usdc)
      assert.equal(cTokenPrice.toString(), expectedResult.toString())
    })
  })

  describe('setExpiryPrice', () => {
    let expiry: number
    const ethPrice = new BigNumber(createScaledNumber(300))
    const exchangeRate = new BigNumber('200192735438752381581313918')

    before('setup oracle record for weth price', async () => {
      expiry = (await time.latest()) + time.duration.days(30).toNumber()
    })

    it("should revert if oracle don't have price of underlying yet", async () => {
      await expectRevert(cethPricer.setExpiryPriceInOracle(expiry), 'CompoundPricer: underlying price not set yet')
    })

    it('should set price successfully by arbitrary address', async () => {
      await oracle.setExpiryPrice(weth.address, expiry, ethPrice)
      await cethPricer.setExpiryPriceInOracle(expiry, { from: random })
      const [price] = await oracle.getExpiryPrice(cETH.address, expiry)
      const expectedResult = await underlyingPriceToCtokenPrice(ethPrice, exchangeRate, weth)
      assert.equal(price.toString(), expectedResult.toString())
    })
  })
})
