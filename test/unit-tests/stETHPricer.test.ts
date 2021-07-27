import {
  MockPricerInstance,
  MockOracleInstance,
  MockERC20Instance,
  MockSTETHTokenInstance,
  STETHPricerInstance,
} from '../../build/types/truffle-types'

import { underlyingPriceToYTokenPrice } from '../utils'

import BigNumber from 'bignumber.js'
import { createScaledNumber } from '../utils'
const { expectRevert, time } = require('@openzeppelin/test-helpers')

const MockPricer = artifacts.require('MockPricer.sol')
const MockOracle = artifacts.require('MockOracle.sol')

const MockERC20 = artifacts.require('MockERC20.sol')
const MockSTETHToken = artifacts.require('MockSTETHToken.sol')
const STETHPricer = artifacts.require('STETHPricer.sol')

// address(0)
const ZERO_ADDR = '0x0000000000000000000000000000000000000000'

contract('STETHPricer', ([owner, random]) => {
  let oracle: MockOracleInstance
  let weth: MockERC20Instance
  let stETH: MockSTETHTokenInstance
  // old pricer
  let wethPricer: MockPricerInstance
  // steth pricer
  let stETHPricer: STETHPricerInstance

  before('Deployment', async () => {
    // deploy mock contracts
    oracle = await MockOracle.new({ from: owner })
    weth = await MockERC20.new('WETH', 'WETH', 18)
    stETH = await MockSTETHToken.new('stETH', 'stETH')
    // mock underlying pricers
    wethPricer = await MockPricer.new(weth.address, oracle.address)

    await oracle.setAssetPricer(weth.address, wethPricer.address)
  })

  describe('constructor', () => {
    it('should deploy the contract successfully with correct values', async () => {
      stETHPricer = await STETHPricer.new(stETH.address, weth.address, oracle.address)

      assert.equal(await stETHPricer.stETH(), stETH.address)
      assert.equal(await stETHPricer.underlying(), weth.address)
      assert.equal(await stETHPricer.oracle(), oracle.address)
    })
    it('should revert if initializing with stETH = 0', async () => {
      await expectRevert(
        STETHPricer.new(ZERO_ADDR, weth.address, oracle.address),
        'STETHPricer: stETH address can not be 0',
      )
    })
    it('should revert if initializing with underlying = 0 address', async () => {
      await expectRevert(
        STETHPricer.new(stETH.address, ZERO_ADDR, oracle.address),
        'STETHPricer: underlying address can not be 0',
      )
    })
    it('should revert if initializing with oracle = 0 address', async () => {
      await expectRevert(
        STETHPricer.new(stETH.address, weth.address, ZERO_ADDR),
        'STETHPricer: oracle address can not be 0',
      )
    })
  })

  describe('getPrice for stETH', () => {
    const ethPrice = createScaledNumber(470)
    const pricePerShare = new BigNumber('1009262845672227655')
    before('mock data in chainlink pricer and stETH', async () => {
      await oracle.setRealTimePrice(weth.address, ethPrice)
      // await wethPricer.setPrice(ethPrice)
      await stETH.setPooledEthByShares(pricePerShare)
    })
    it('should return the price in 1e8', async () => {
      // how much 1e8 yToken worth in USD
      const stETHprice = await stETHPricer.getPrice()
      const expectResult = await underlyingPriceToYTokenPrice(new BigNumber(ethPrice), pricePerShare, weth)
      assert.equal(stETHprice.toString(), expectResult.toString())
      // hard coded answer
      // 1 yWETH = 9.4 USD
      assert.equal(stETHprice.toString(), '47435353746')
    })
    it('should return the new price after resetting answer in underlying pricer', async () => {
      const newPrice = createScaledNumber(500)
      // await wethPricer.setPrice(newPrice)
      await oracle.setRealTimePrice(weth.address, newPrice)
      const stETHprice = await stETHPricer.getPrice()
      const expectedResult = await underlyingPriceToYTokenPrice(new BigNumber(newPrice), pricePerShare, weth)
      assert.equal(stETHprice.toString(), expectedResult.toString())
    })
    it('should revert if price is lower than 0', async () => {
      // await wethPricer.setPrice('0')
      await oracle.setRealTimePrice(weth.address, '0')
      await expectRevert(stETHPricer.getPrice(), 'STETHPricer: underlying price is 0')
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
      await expectRevert(stETHPricer.setExpiryPriceInOracle(expiry), 'STETHPricer: underlying price not set yet')
    })

    it('should set price successfully by arbitrary address', async () => {
      await oracle.setExpiryPrice(weth.address, expiry, ethPrice)
      await stETHPricer.setExpiryPriceInOracle(expiry, { from: random })
      const [price] = await oracle.getExpiryPrice(stETH.address, expiry)
      const expectedResult = await underlyingPriceToYTokenPrice(ethPrice, pricePerShare, weth)
      assert.equal(price.toString(), expectedResult.toString())
    })
  })
})
