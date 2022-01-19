import {
  MockPricerInstance,
  MockOracleInstance,
  MockERC20Instance,
  MockYTokenInstance,
  YearnPricerInstance,
} from '../../build/types/truffle-types'

import { underlyingPriceToYTokenPrice } from '../utils'

import BigNumber from 'bignumber.js'
import { createScaledNumber } from '../utils'
const { expectRevert, time } = require('@openzeppelin/test-helpers')

const MockPricer = artifacts.require('MockPricer.sol')
const MockOracle = artifacts.require('MockOracle.sol')

const MockERC20 = artifacts.require('MockERC20.sol')
const MockYToken = artifacts.require('MockYToken.sol')
const YearnPricer = artifacts.require('YearnPricer.sol')

// address(0)
const ZERO_ADDR = '0x0000000000000000000000000000000000000000'

contract('YearnPricer', ([owner, random]) => {
  let oracle: MockOracleInstance
  let weth: MockERC20Instance
  let usdc: MockERC20Instance
  let yWETH: MockYTokenInstance
  let yUSDC: MockYTokenInstance
  // old pricer
  let wethPricer: MockPricerInstance
  // yearn pricer
  let yvWETHPricer: YearnPricerInstance
  let yvUSDCPricer: YearnPricerInstance

  before('Deployment', async () => {
    // deploy mock contracts
    oracle = await MockOracle.new({ from: owner })
    weth = await MockERC20.new('WETH', 'WETH', 18)
    usdc = await MockERC20.new('USDC', 'USDC', 6)
    yWETH = await MockYToken.new('yWETH', 'yWETH')
    yUSDC = await MockYToken.new('yUSDC', 'yUSDC')
    // mock underlying pricers
    wethPricer = await MockPricer.new(weth.address, oracle.address)

    await oracle.setAssetPricer(weth.address, wethPricer.address)
  })

  describe('constructor', () => {
    it('should deploy the contract successfully with correct values', async () => {
      yvWETHPricer = await YearnPricer.new(yWETH.address, weth.address, oracle.address)
      yvUSDCPricer = await YearnPricer.new(yUSDC.address, usdc.address, oracle.address)

      assert.equal(await yvWETHPricer.yToken(), yWETH.address)
      assert.equal(await yvWETHPricer.underlying(), weth.address)
      assert.equal(await yvWETHPricer.oracle(), oracle.address)

      assert.equal(await yvUSDCPricer.yToken(), yUSDC.address)
      assert.equal(await yvUSDCPricer.underlying(), usdc.address)
      assert.equal(await yvUSDCPricer.oracle(), oracle.address)
    })
    it('should revert if initializing with yToken = 0', async () => {
      await expectRevert(
        YearnPricer.new(ZERO_ADDR, weth.address, oracle.address),
        'YearnPricer: yToken address can not be 0',
      )
    })
    it('should revert if initializing with underlying = 0 address', async () => {
      await expectRevert(
        YearnPricer.new(yWETH.address, ZERO_ADDR, oracle.address),
        'YearnPricer: underlying address can not be 0',
      )
    })
    it('should revert if initializing with oracle = 0 address', async () => {
      await expectRevert(
        YearnPricer.new(yWETH.address, weth.address, ZERO_ADDR),
        'YearnPricer: oracle address can not be 0',
      )
    })
  })

  describe('getPrice for yWETH', () => {
    const ethPrice = createScaledNumber(470)
    const pricePerShare = new BigNumber('1009262845672227655')
    before('mock data in chainlink pricer and yToken', async () => {
      await oracle.setRealTimePrice(usdc.address, '100000000')
      await oracle.setRealTimePrice(weth.address, ethPrice)
      // await wethPricer.setPrice(ethPrice)
      await yWETH.setPricePerShare(pricePerShare)
    })
    it('should return the price in 1e8', async () => {
      // how much 1e8 yToken worth in USD
      const yTokenprice = await yvWETHPricer.getPrice()
      const expectResult = await underlyingPriceToYTokenPrice(new BigNumber(ethPrice), pricePerShare, weth)
      assert.equal(yTokenprice.toString(), expectResult.toString())
      // hard coded answer
      // 1 yWETH = 9.4 USD
      assert.equal(yTokenprice.toString(), '47435353746')
    })
    it('should return the new price after resetting answer in underlying pricer', async () => {
      const newPrice = createScaledNumber(500)
      // await wethPricer.setPrice(newPrice)
      await oracle.setRealTimePrice(weth.address, newPrice)
      const yTokenPrice = await yvWETHPricer.getPrice()
      const expectedResult = await underlyingPriceToYTokenPrice(new BigNumber(newPrice), pricePerShare, weth)
      assert.equal(yTokenPrice.toString(), expectedResult.toString())
    })
    it('should revert if price is lower than 0', async () => {
      // await wethPricer.setPrice('0')
      await oracle.setRealTimePrice(weth.address, '0')
      await expectRevert(yvWETHPricer.getPrice(), 'YearnPricer: underlying price is 0')
    })
  })

  describe('getPrice for yUSDC', () => {
    const usdPrice = createScaledNumber(1)
    const pricePerShare = new BigNumber('1046810')

    before('mock data in chainlink pricer and yToken', async () => {
      await oracle.setStablePrice(usdc.address, '100000000')
      await yUSDC.setPricePerShare(pricePerShare)
    })

    it('should return the price in 1e8', async () => {
      // how much 1e8 yToken worth in USD
      const yTokenprice = await yvUSDCPricer.getPrice()
      const expectResult = await underlyingPriceToYTokenPrice(new BigNumber(usdPrice), pricePerShare, usdc)
      assert.equal(yTokenprice.toString(), expectResult.toString())
      // hard coded answer
      // 1 yUSDC = 0.02 USD
      assert.equal(yTokenprice.toString(), '104681000') // 0.0211 usd
    })
    it('should return the new price after resetting answer in underlying pricer', async () => {
      const newPrice = createScaledNumber(1.1)
      await oracle.setStablePrice(usdc.address, newPrice)
      const yTokenPrice = await yvUSDCPricer.getPrice()
      const expectedResult = await underlyingPriceToYTokenPrice(new BigNumber(newPrice), pricePerShare, usdc)
      assert.equal(yTokenPrice.toString(), expectedResult.toString())
    })
  })

  describe('setExpiryPrice', () => {
    let expiry: number
    const ethPrice = new BigNumber(createScaledNumber(300))
    const pricePerShare = new BigNumber('1009262845672227655')

    before('setup oracle record for weth price', async () => {
      expiry = (await time.latest()) + time.duration.days(30).toNumber()
    })

    it("should revert if oracle don't have price of underlying yet", async () => {
      await expectRevert(yvWETHPricer.setExpiryPriceInOracle(expiry), 'YearnPricer: underlying price not set yet')
    })

    it('should set price successfully by arbitrary address', async () => {
      await oracle.setExpiryPrice(weth.address, expiry, ethPrice)
      await yvWETHPricer.setExpiryPriceInOracle(expiry, { from: random })
      const [price] = await oracle.getExpiryPrice(yWETH.address, expiry)
      const expectedResult = await underlyingPriceToYTokenPrice(ethPrice, pricePerShare, weth)
      assert.equal(price.toString(), expectedResult.toString())
    })
  })
})
