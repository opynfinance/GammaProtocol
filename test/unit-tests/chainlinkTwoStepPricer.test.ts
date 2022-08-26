import {
  ChainLinkPricerInstance,
  MockOracleInstance,
  MockChainlinkAggregatorInstance,
  MockERC20Instance,
} from '../../build/types/truffle-types'
import BigNumber from 'bignumber.js'

import { createTokenAmount } from '../utils'
const { expectRevert, time } = require('@openzeppelin/test-helpers')

const ChainlinkTwoStepPricer = artifacts.require('ChainLinkTwoStepPricer.sol')
const MockOracle = artifacts.require('MockOracle.sol')
const MockChainlinkAggregator = artifacts.require('MockChainlinkAggregator.sol')
const MockERC20 = artifacts.require('MockERC20.sol')

// address(0)
const ZERO_ADDR = '0x0000000000000000000000000000000000000000'

contract('ChainlinkTwoStepPricer', ([owner, bot, random]) => {
  let celAggregator: MockChainlinkAggregatorInstance
  let oracle: MockOracleInstance
  let weth: MockERC20Instance
  let cel: MockERC20Instance
  // otoken
  let pricer: ChainLinkPricerInstance

  before('Deployment', async () => {
    // deploy mock contracts
    oracle = await MockOracle.new({ from: owner })
    celAggregator = await MockChainlinkAggregator.new()
    weth = await MockERC20.new('WETH', 'WETH', 18)
    cel = await MockERC20.new('Celsius', 'Cel', 18)
    // deploy pricer
    pricer = await ChainlinkTwoStepPricer.new(bot, cel.address, weth.address, celAggregator.address, oracle.address)
  })

  describe('constructor', () => {
    it('should set the config correctly', async () => {
      const asset = await pricer.asset()
      assert.equal(asset, cel.address)
      const bot = await pricer.bot()
      assert.equal(bot, bot)
      const aggregator = await pricer.aggregator()
      assert.equal(aggregator, celAggregator.address)
      const oracleModule = await pricer.oracle()
      assert.equal(oracleModule, oracle.address)
    })
    it('should revert if initializing aggregator with 0 address', async () => {
      await expectRevert(
        ChainlinkTwoStepPricer.new(bot, cel.address, weth.address, ZERO_ADDR, celAggregator.address),
        'ChainLinkPricer: Cannot set 0 address as aggregator',
      )
    })
    it('should revert if initializing oracle with 0 address', async () => {
      await expectRevert(
        ChainlinkTwoStepPricer.new(bot, cel.address, weth.address, oracle.address, ZERO_ADDR),
        'ChainLinkPricer: Cannot set 0 address as oracle',
      )
    })
    it('should revert if initializing bot with 0 address', async () => {
      await expectRevert(
        ChainlinkTwoStepPricer.new(ZERO_ADDR, cel.address, weth.address, oracle.address, celAggregator.address),
        'ChainLinkPricer: Cannot set 0 address as bot',
      )
    })
  })

  describe('getPrice', () => {
    // aggregator have price in 1e8
    // set asset/WETH i.e asset is Cel
    const assetPrice = createTokenAmount(100, 18)
    before('mock data in weth aggregator', async () => {
      await celAggregator.setLatestAnswer(assetPrice)

      //set weth oracle price
      const wethUSDPrice = createTokenAmount(300, 8)
      await oracle.setStablePrice(weth.address, wethUSDPrice)
    })
    it('should return the price in 1e8', async () => {
      const price = await pricer.getPrice()
      const expectedResult = createTokenAmount(30000, 8)
      assert.equal(price.toString(), expectedResult.toString())
    })
    it('should return the new price after resetting answer in aggregator', async () => {
      const newAssetPrice = new BigNumber(createTokenAmount(400, 18))
      await celAggregator.setLatestAnswer(newAssetPrice)

      const wethPrice = await oracle.getPrice(weth.address)

      const price = await pricer.getPrice()
      const expectedResult = newAssetPrice.multipliedBy(wethPrice).div(10 ** 18)
      assert.equal(price.toString(), expectedResult.toString())
    })
    it('should revert if price is lower than 0', async () => {
      await celAggregator.setLatestAnswer(-1)
      await expectRevert(pricer.getPrice(), 'ChainLinkPricer: price is lower than 0')
    })
  })

  describe('setExpiryPrice', () => {
    // time order: t0, t1, t2, t3, t4
    let t0: number, t1: number, t2: number, t3: number, t4: number, celPriceP1: BigNumber, celPriceP2: BigNumber

    // p0 = price at t0 ... etc
    const p0 = createTokenAmount(100, 18)
    const p1 = createTokenAmount(150.333, 18)
    const p2 = createTokenAmount(180, 18)
    const p3 = createTokenAmount(200, 18)
    const p4 = createTokenAmount(140, 18)

    before('setup history in aggregator', async () => {
      // set t0, t1, t2, expiry, t3, t4
      t0 = (await time.latest()).toNumber()
      // set round answers
      await celAggregator.setRoundAnswer(0, p0)
      await celAggregator.setRoundAnswer(1, p1)
      await celAggregator.setRoundAnswer(2, p2)
      await celAggregator.setRoundAnswer(3, p3)
      await celAggregator.setRoundAnswer(4, p4)

      // set round timestamps
      await celAggregator.setRoundTimestamp(0, t0)
      t1 = t0 + 60 * 1
      await celAggregator.setRoundTimestamp(1, t1)
      t2 = t0 + 60 * 2
      await celAggregator.setRoundTimestamp(2, t2)
      t3 = t0 + 60 * 3
      await celAggregator.setRoundTimestamp(3, t3)
      t4 = t0 + 60 * 4
      await celAggregator.setRoundTimestamp(4, t4)

      const wethPrice = await oracle.getPrice(weth.address)
      celPriceP1 = new BigNumber(p1).multipliedBy(wethPrice).div(10 ** 18)
      celPriceP2 = new BigNumber(p2).multipliedBy(wethPrice).div(10 ** 18)
    })

    it('bot should set the correct price to the oracle', async () => {
      const expiryTimestamp = (t0 + t1) / 2 // between t0 and t1
      const roundId = 1

      await pricer.setExpiryPriceInOracle(expiryTimestamp, roundId, { from: bot })

      const priceFromOracle = await oracle.getExpiryPrice(cel.address, expiryTimestamp)
      assert.equal(celPriceP1.toString(), priceFromOracle[0].toString())
    })

    it('should revert if sender is not bot address and roundId is too old', async () => {
      const expiryTimestamp = (t1 + t2) / 2 // between t1 and t2
      const roundId = 1
      await expectRevert(
        pricer.setExpiryPriceInOracle(expiryTimestamp, roundId, { from: random }),
        'ChainLinkPricer: roundId not first after expiry',
      )
    })

    it('should revert if sender is not bot address and roundId is too late', async () => {
      const expiryTimestamp = (t1 + t2) / 2 // between t1 and t2
      const roundId = 3
      await expectRevert(
        pricer.setExpiryPriceInOracle(expiryTimestamp, roundId, { from: random }),
        'ChainLinkPricer: previousRoundId not last before expiry',
      )
    })

    it('anyone should be able to set prices', async () => {
      const expiryTimestamp = (t1 + t2) / 2 // between t1 and t2
      const roundId = 2
      await pricer.setExpiryPriceInOracle(expiryTimestamp, roundId, { from: random })
      const priceFromOracle = await oracle.getExpiryPrice(cel.address, expiryTimestamp)
      assert.equal(celPriceP2.toString(), priceFromOracle[0].toString())
    })

    it('should revert if round ID is too late: price[roundId].timestamp < expiry', async () => {
      const expiryTimestamp = (t1 + t2) / 2 // between t1 and t2
      const roundId = 1
      await expectRevert(
        pricer.setExpiryPriceInOracle(expiryTimestamp, roundId, { from: bot }),
        'ChainLinkPricer: roundId not first after expiry',
      )
    })
  })
})
