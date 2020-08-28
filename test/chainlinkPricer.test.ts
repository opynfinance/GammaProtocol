import {
  ChainLinkPricerInstance,
  MockOracleInstance,
  MockChainlinkAggregatorInstance,
  MockERC20Instance,
} from '../build/types/truffle-types'
import BigNumber from 'bignumber.js'

const {expectRevert, time} = require('@openzeppelin/test-helpers')

const ChainlinkPricer = artifacts.require('ChainLinkPricer.sol')
const MockOracle = artifacts.require('MockOracle.sol')
const MockChainlinkAggregator = artifacts.require('MockChainlinkAggregator.sol')
const MockERC20 = artifacts.require('MockERC20.sol')

// address(0)
const ZERO_ADDR = '0x0000000000000000000000000000000000000000'

/**
 * scale number with 1e8
 * @param num
 */
const toChainLinkPrice = (num: number) => new BigNumber(num).times(1e8).integerValue()

contract('ChainlinkPricer', ([owner, nonOwner, random]) => {
  let wethAggregator: MockChainlinkAggregatorInstance
  let oracle: MockOracleInstance
  let weth: MockERC20Instance
  // otoken
  let pricer: ChainLinkPricerInstance

  before('Deployment', async () => {
    // deploy mock contracts
    oracle = await MockOracle.new()
    wethAggregator = await MockChainlinkAggregator.new()
    weth = await MockERC20.new('WETH', 'WETH')
    //
    pricer = await ChainlinkPricer.new(oracle.address)
  })

  describe('constructor', () => {
    it('should revert if initializing oracle with 0 address', async () => {
      await expectRevert(ChainlinkPricer.new(ZERO_ADDR), 'ChainLinkPricer: Cannot set 0 address as oracle')
    })
  })

  describe('Set aggregator', () => {
    it('should revert if setter is not the owner', async () => {
      await expectRevert(
        pricer.setAggregator(weth.address, wethAggregator.address, {from: nonOwner}),
        'Ownable: caller is not the owner',
      )
    })

    it('should revert if set aggregator to address(0)', async () => {
      await expectRevert(
        pricer.setAggregator(weth.address, ZERO_ADDR),
        'ChainLinkPricer: Cannot set 0 address as aggregator',
      )
    })

    it('should set aggregator for weth', async () => {
      await pricer.setAggregator(weth.address, wethAggregator.address, {from: owner})
      const aggregator = await pricer.assetAggregator(weth.address)
      assert.equal(aggregator, wethAggregator.address)
    })
  })

  describe('getPrice', () => {
    // aggregator have price in 1e8
    const ethPrice = toChainLinkPrice(300)
    before('mock data in weth aggregator', async () => {
      await wethAggregator.setLatestAnswer(ethPrice)
    })
    it('should return the price in 1e18', async () => {
      const price = await pricer.getPrice(weth.address)
      const expectedResult = new BigNumber(300).times(1e18)
      assert.equal(price.toString(), expectedResult.toString())
    })
    it('should revert if price is lower than 0', async () => {
      await wethAggregator.setLatestAnswer(-1)
      await expectRevert(pricer.getPrice(weth.address), 'ChainLinkPricer: price is lower than 0')
    })
    it('should revert if aggregator is not set', async () => {
      await expectRevert(pricer.getPrice(random), 'ChainLinkPricer: aggregator for the asset not set.')
    })
  })

  describe('setExpiryPrice', () => {
    // time order: t0, t1, t2, t3, t4
    let t0: number, t1: number, t2: number, t3: number, t4: number
    // p0 = price at t0 ... etc
    const p0 = toChainLinkPrice(100)
    const p1 = toChainLinkPrice(150.333)
    const p2 = toChainLinkPrice(180)
    const p3 = toChainLinkPrice(200)
    const p4 = toChainLinkPrice(140)

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

    it("should revert when setting pirce for a asset thats doens't have an aggregator", async () => {
      const now = await time.latest()
      await expectRevert(
        pricer.setExpiryPriceToOralce(random, now, 3),
        'ChainLinkPricer: aggregator for the asset not set.',
      )
    })

    it('should set the correct price to the oracle', async () => {
      const expiryTimestamp = (t0 + t1) / 2 // between t0 and t1
      const roundId = 0
      await pricer.setExpiryPriceToOralce(weth.address, expiryTimestamp, roundId)
      const priceFromOracle = await oracle.getExpiryPrice(weth.address, expiryTimestamp)
      assert.equal(p0.toString(), priceFromOracle.toString())
    })

    it('everyone can set an price oracle', async () => {
      const expiryTimestamp = (t1 + t2) / 2 // between t1 and t2
      const roundId = 1
      await pricer.setExpiryPriceToOralce(weth.address, expiryTimestamp, roundId)
      const priceFromOracle = await oracle.getExpiryPrice(weth.address, expiryTimestamp)
      assert.equal(p1.toString(), priceFromOracle.toString())
    })

    it('should revert if round ID is incorrect: price[roundId].timestamp > expiry', async () => {
      const expiryTimestamp = (t0 + t1) / 2 // between t0 and t1
      const roundId = 1
      await expectRevert(
        pricer.setExpiryPriceToOralce(weth.address, expiryTimestamp, roundId),
        'ChainLinkPricer: invalid roundId',
      )
    })

    it('should revert if round ID is incorrect: price[roundId + 1].timestamp < expiry', async () => {
      const expiryTimestamp = (t3 + t4) / 2 // between t2 and t3
      const roundId = 2
      await expectRevert(
        pricer.setExpiryPriceToOralce(weth.address, expiryTimestamp, roundId),
        'ChainLinkPricer: invalid roundId',
      )
    })
  })
})
