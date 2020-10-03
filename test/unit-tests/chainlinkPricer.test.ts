import {
  ChainLinkPricerInstance,
  MockOracleInstance,
  MockChainlinkAggregatorInstance,
  MockERC20Instance,
} from '../../build/types/truffle-types'

import {createTokenAmount} from '../utils'
const {expectRevert, time} = require('@openzeppelin/test-helpers')

const ChainlinkPricer = artifacts.require('ChainLinkPricer.sol')
const MockOracle = artifacts.require('MockOracle.sol')
const MockChainlinkAggregator = artifacts.require('MockChainlinkAggregator.sol')
const MockERC20 = artifacts.require('MockERC20.sol')

// address(0)
const ZERO_ADDR = '0x0000000000000000000000000000000000000000'

contract('ChainlinkPricer', ([owner, random]) => {
  let wethAggregator: MockChainlinkAggregatorInstance
  let oracle: MockOracleInstance
  let weth: MockERC20Instance
  // otoken
  let pricer: ChainLinkPricerInstance

  before('Deployment', async () => {
    // deploy mock contracts
    oracle = await MockOracle.new({from: owner})
    wethAggregator = await MockChainlinkAggregator.new()
    weth = await MockERC20.new('WETH', 'WETH', 18)
    //
    pricer = await ChainlinkPricer.new(weth.address, wethAggregator.address, oracle.address)
  })

  describe('constructor', () => {
    it('should set the asset correctly', async () => {
      const asset = await pricer.asset()
      assert.equal(asset, weth.address)
    })
    it('should revert if initializing aggregator with 0 address', async () => {
      await expectRevert(
        ChainlinkPricer.new(weth.address, ZERO_ADDR, wethAggregator.address),
        'ChainLinkPricer: Cannot set 0 address as aggregator',
      )
    })
    it('should revert if initializing oracle with 0 address', async () => {
      await expectRevert(
        ChainlinkPricer.new(weth.address, oracle.address, ZERO_ADDR),
        'ChainLinkPricer: Cannot set 0 address as oracle',
      )
    })
  })

  describe('getPrice', () => {
    // aggregator have price in 1e8
    const ethPrice = createTokenAmount(300, 8)
    before('mock data in weth aggregator', async () => {
      await wethAggregator.setLatestAnswer(ethPrice)
    })
    it('should return the price in 1e8', async () => {
      const price = await pricer.getPrice()
      const expectedResult = createTokenAmount(300, 8)
      assert.equal(price.toString(), expectedResult.toString())
    })
    it('should return the new price after resetting answer in aggregator', async () => {
      const newPrice = createTokenAmount(400, 8)
      await wethAggregator.setLatestAnswer(newPrice)
      const price = await pricer.getPrice()
      const expectedResult = createTokenAmount(400, 8)
      assert.equal(price.toString(), expectedResult.toString())
    })
    it('should revert if price is lower than 0', async () => {
      await wethAggregator.setLatestAnswer(-1)
      await expectRevert(pricer.getPrice(), 'ChainLinkPricer: price is lower than 0')
    })
  })

  describe('setExpiryPrice', () => {
    // time order: t0, t1, t2, t3, t4
    let t0: number, t1: number, t2: number, t3: number, t4: number
    // p0 = price at t0 ... etc
    const p0 = createTokenAmount(100, 8)
    const p1 = createTokenAmount(150.333, 8)
    const p2 = createTokenAmount(180, 8)
    const p3 = createTokenAmount(200, 8)
    const p4 = createTokenAmount(140, 8)

    before('setup history in aggregator', async () => {
      // set t0, t1, t2, expiry, t3, t4
      t0 = (await time.latest()).toNumber()
      // set round answers
      await wethAggregator.setRoundAnswer(0, p0)
      await wethAggregator.setRoundAnswer(1, p1)
      await wethAggregator.setRoundAnswer(2, p2)
      await wethAggregator.setRoundAnswer(3, p3)
      await wethAggregator.setRoundAnswer(4, p4)

      // set round timestamps
      await wethAggregator.setRoundTimestamp(0, t0)
      t1 = t0 + 60 * 1
      await wethAggregator.setRoundTimestamp(1, t1)
      t2 = t0 + 60 * 2
      await wethAggregator.setRoundTimestamp(2, t2)
      t3 = t0 + 60 * 3
      await wethAggregator.setRoundTimestamp(3, t3)
      t4 = t0 + 60 * 4
      await wethAggregator.setRoundTimestamp(4, t4)
    })

    it('should set the correct price to the oracle', async () => {
      const expiryTimestamp = (t0 + t1) / 2 // between t0 and t1
      const roundId = 1

      await pricer.setExpiryPriceInOracle(expiryTimestamp, roundId)
      const priceFromOracle = await oracle.getExpiryPrice(weth.address, expiryTimestamp)
      assert.equal(p1.toString(), priceFromOracle[0].toString())
    })

    it('everyone can set an price oracle', async () => {
      const expiryTimestamp = (t1 + t2) / 2 // between t1 and t2
      const roundId = 2
      await pricer.setExpiryPriceInOracle(expiryTimestamp, roundId, {from: random})
      const priceFromOracle = await oracle.getExpiryPrice(weth.address, expiryTimestamp)
      assert.equal(p2.toString(), priceFromOracle[0].toString())
    })

    it('should revert if round ID is incorrect: price[roundId].timestamp < expiry', async () => {
      const expiryTimestamp = (t1 + t2) / 2 // between t0 and t1
      const roundId = 1
      await expectRevert(pricer.setExpiryPriceInOracle(expiryTimestamp, roundId), 'ChainLinkPricer: invalid roundId')
    })

    it('should revert if round ID is incorrect: price[roundId-1].timestamp > expiry', async () => {
      const expiryTimestamp = (t1 + t2) / 2 // between t2 and t3
      const roundId = 3
      await expectRevert(pricer.setExpiryPriceInOracle(expiryTimestamp, roundId), 'ChainLinkPricer: invalid roundId')
    })
  })
})
