import {
  MockPricerInstance,
  MockOracleInstance,
  MockERC20Instance,
  MockRETHTokenInstance,
  RETHPricerInstance,
} from '../../build/types/truffle-types'

import { underlyingPriceToYTokenPrice } from '../utils'

import BigNumber from 'bignumber.js'
import { createScaledNumber } from '../utils'
const { expectRevert, time } = require('@openzeppelin/test-helpers')

const MockPricer = artifacts.require('MockPricer.sol')
const MockOracle = artifacts.require('MockOracle.sol')

const MockERC20 = artifacts.require('MockERC20.sol')
const MockRETHToken = artifacts.require('MockRETHToken.sol')
const RethPricer = artifacts.require('RethPricer.sol')

// address(0)
const ZERO_ADDR = '0x0000000000000000000000000000000000000000'

contract('RethPricer', ([owner, random]) => {
  let oracle: MockOracleInstance
  let weth: MockERC20Instance
  let rETH: MockRETHTokenInstance
  // old pricer
  let wethPricer: MockPricerInstance
  // steth pricer
  let rethPricer: RETHPricerInstance

  before('Deployment', async () => {
    // deploy mock contracts
    oracle = await MockOracle.new({ from: owner })
    weth = await MockERC20.new('WETH', 'WETH', 18)
    rETH = await MockRETHToken.new('rETH', 'rETH')
    // mock underlying pricers
    wethPricer = await MockPricer.new(weth.address, oracle.address)

    await oracle.setAssetPricer(weth.address, wethPricer.address)
  })

  describe('constructor', () => {
    it('should deploy the contract successfully with correct values', async () => {
      rethPricer = await RethPricer.new(rETH.address, weth.address, oracle.address)

      assert.equal(await rethPricer.rETH(), rETH.address)
      assert.equal(await rethPricer.underlying(), weth.address)
      assert.equal(await rethPricer.oracle(), oracle.address)
    })

    it('should revert if initializing with rETH = 0', async () => {
      await expectRevert(RethPricer.new(ZERO_ADDR, weth.address, oracle.address), 'W1')
    })

    it('should revert if initializing with underlying = 0 address', async () => {
      await expectRevert(RethPricer.new(rETH.address, ZERO_ADDR, oracle.address), 'W2')
    })

    it('should revert if initializing with oracle = 0 address', async () => {
      await expectRevert(RethPricer.new(rETH.address, weth.address, ZERO_ADDR), 'W3')
    })
  })

  describe('getPrice for rETH', () => {
    const ethPrice = createScaledNumber(470)
    const pricePerShare = new BigNumber('1009262845672227655')
    before('mock data in chainlink pricer and rETH', async () => {
      await oracle.setRealTimePrice(weth.address, ethPrice)
      // await wethPricer.setPrice(ethPrice)
      await rETH.setEthPerToken(pricePerShare)
    })
    it('should return the price in 1e8', async () => {
      // how much 1e8 yToken worth in USD
      const rETHprice = await rethPricer.getPrice()
      const expectResult = await underlyingPriceToYTokenPrice(new BigNumber(ethPrice), pricePerShare, weth)
      assert.equal(rETHprice.toString(), expectResult.toString())
      // hard coded answer
      // 1 yWETH = 9.4 USD
      assert.equal(rETHprice.toString(), '47435353746')
    })

    it('should return the new price after resetting answer in underlying pricer', async () => {
      const newPrice = createScaledNumber(500)
      // await wethPricer.setPrice(newPrice)
      await oracle.setRealTimePrice(weth.address, newPrice)
      const rETHprice = await rethPricer.getPrice()
      const expectedResult = await underlyingPriceToYTokenPrice(new BigNumber(newPrice), pricePerShare, weth)
      assert.equal(rETHprice.toString(), expectedResult.toString())
    })

    it('should revert if price is lower than 0', async () => {
      // await wethPricer.setPrice('0')
      await oracle.setRealTimePrice(weth.address, '0')
      await expectRevert(rethPricer.getPrice(), 'W4')
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
      await expectRevert(rethPricer.setExpiryPriceInOracle(expiry), 'W5')
    })

    it('should set price successfully by arbitrary address', async () => {
      await oracle.setExpiryPrice(weth.address, expiry, ethPrice)
      await rethPricer.setExpiryPriceInOracle(expiry, { from: random })
      const [price] = await oracle.getExpiryPrice(rETH.address, expiry)
      const expectedResult = await underlyingPriceToYTokenPrice(ethPrice, pricePerShare, weth)
      assert.equal(price.toString(), expectedResult.toString())
    })
  })
})
