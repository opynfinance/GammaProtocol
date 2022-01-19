import {
  MockPricerInstance,
  MockOracleInstance,
  MockERC20Instance,
  MockWSTETHTokenInstance,
  WstethPricerInstance,
} from '../../build/types/truffle-types'

import { underlyingPriceToYTokenPrice } from '../utils'

import BigNumber from 'bignumber.js'
import { createScaledNumber } from '../utils'
const { expectRevert, time } = require('@openzeppelin/test-helpers')

const MockPricer = artifacts.require('MockPricer.sol')
const MockOracle = artifacts.require('MockOracle.sol')

const MockERC20 = artifacts.require('MockERC20.sol')
const MockWSTETHToken = artifacts.require('MockWSTETHToken.sol')
const WstethPricer = artifacts.require('WstethPricer.sol')

// address(0)
const ZERO_ADDR = '0x0000000000000000000000000000000000000000'

contract('WstethPricer', ([owner, random]) => {
  let oracle: MockOracleInstance
  let weth: MockERC20Instance
  let wstETH: MockWSTETHTokenInstance
  // old pricer
  let wethPricer: MockPricerInstance
  // steth pricer
  let wstethPricer: WstethPricerInstance

  before('Deployment', async () => {
    // deploy mock contracts
    oracle = await MockOracle.new({ from: owner })
    weth = await MockERC20.new('WETH', 'WETH', 18)
    wstETH = await MockWSTETHToken.new('wstETH', 'wstETH')
    // mock underlying pricers
    wethPricer = await MockPricer.new(weth.address, oracle.address)

    await oracle.setAssetPricer(weth.address, wethPricer.address)
  })

  describe('constructor', () => {
    it('should deploy the contract successfully with correct values', async () => {
      wstethPricer = await WstethPricer.new(wstETH.address, weth.address, oracle.address)

      assert.equal(await wstethPricer.wstETH(), wstETH.address)
      assert.equal(await wstethPricer.underlying(), weth.address)
      assert.equal(await wstethPricer.oracle(), oracle.address)
    })

    it('should revert if initializing with wstETH = 0', async () => {
      await expectRevert(WstethPricer.new(ZERO_ADDR, weth.address, oracle.address), 'W1')
    })

    it('should revert if initializing with underlying = 0 address', async () => {
      await expectRevert(WstethPricer.new(wstETH.address, ZERO_ADDR, oracle.address), 'W2')
    })

    it('should revert if initializing with oracle = 0 address', async () => {
      await expectRevert(WstethPricer.new(wstETH.address, weth.address, ZERO_ADDR), 'W3')
    })
  })

  describe('getPrice for wstETH', () => {
    const ethPrice = createScaledNumber(470)
    const pricePerShare = new BigNumber('1009262845672227655')
    before('mock data in chainlink pricer and wstETH', async () => {
      await oracle.setRealTimePrice(weth.address, ethPrice)
      // await wethPricer.setPrice(ethPrice)
      await wstETH.setStEthPerToken(pricePerShare)
    })
    it('should return the price in 1e8', async () => {
      // how much 1e8 yToken worth in USD
      const wstETHprice = await wstethPricer.getPrice()
      const expectResult = await underlyingPriceToYTokenPrice(new BigNumber(ethPrice), pricePerShare, weth)
      assert.equal(wstETHprice.toString(), expectResult.toString())
      // hard coded answer
      // 1 yWETH = 9.4 USD
      assert.equal(wstETHprice.toString(), '47435353746')
    })

    it('should return the new price after resetting answer in underlying pricer', async () => {
      const newPrice = createScaledNumber(500)
      // await wethPricer.setPrice(newPrice)
      await oracle.setRealTimePrice(weth.address, newPrice)
      const wstETHprice = await wstethPricer.getPrice()
      const expectedResult = await underlyingPriceToYTokenPrice(new BigNumber(newPrice), pricePerShare, weth)
      assert.equal(wstETHprice.toString(), expectedResult.toString())
    })

    it('should revert if price is lower than 0', async () => {
      // await wethPricer.setPrice('0')
      await oracle.setRealTimePrice(weth.address, '0')
      await expectRevert(wstethPricer.getPrice(), 'W4')
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
      await expectRevert(wstethPricer.setExpiryPriceInOracle(expiry), 'W5')
    })

    it('should set price successfully by arbitrary address', async () => {
      await oracle.setExpiryPrice(weth.address, expiry, ethPrice)
      await wstethPricer.setExpiryPriceInOracle(expiry, { from: random })
      const [price] = await oracle.getExpiryPrice(wstETH.address, expiry)
      const expectedResult = await underlyingPriceToYTokenPrice(ethPrice, pricePerShare, weth)
      assert.equal(price.toString(), expectedResult.toString())
    })
  })
})
