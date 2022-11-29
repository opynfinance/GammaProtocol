import { ManualPricerInstance, MockOracleInstance, MockERC20Instance } from '../../build/types/truffle-types'

import { createTokenAmount } from '../utils'
const { expectRevert, time } = require('@openzeppelin/test-helpers')

const ManualPricer = artifacts.require('ManualPricer.sol')
const MockOracle = artifacts.require('MockOracle.sol')
const MockERC20 = artifacts.require('MockERC20.sol')

// address(0)
const ZERO_ADDR = '0x0000000000000000000000000000000000000000'

contract('ManualPricer', ([owner, bot, random]) => {
  let oracle: MockOracleInstance
  let weth: MockERC20Instance
  // otoken
  let pricer: ManualPricerInstance

  before('Deployment', async () => {
    // deploy mock contracts
    oracle = await MockOracle.new({ from: owner })
    weth = await MockERC20.new('WETH', 'WETH', 18)
    // deploy pricer
    pricer = await ManualPricer.new(bot, weth.address, oracle.address)
  })

  describe('constructor', () => {
    it('should set the config correctly', async () => {
      const asset = await pricer.asset()
      assert.equal(asset, weth.address)
      const bot = await pricer.bot()
      assert.equal(bot, bot)
      const oracleModule = await pricer.oracle()
      assert.equal(oracleModule, oracle.address)
    })
    it('should revert if initializing oracle with 0 address', async () => {
      await expectRevert(
        ManualPricer.new(bot, weth.address, oracle.address, ZERO_ADDR),
        'ManualPricer: Cannot set 0 address as oracle',
      )
    })
    it('should revert if initializing bot with 0 address', async () => {
      await expectRevert(
        ManualPricer.new(ZERO_ADDR, weth.address, oracle.address),
        'ManualPricer: Cannot set 0 address as bot',
      )
    })
  })

  describe('getPrice', () => {
    it('should return the new price after resetting answer', async () => {
      const newPrice = createTokenAmount(400, 8)
      await pricer.setExpiryPriceInOracle(1, newPrice)
      const price = await pricer.getPrice()
      const expectedResult = createTokenAmount(400, 8)
      assert.equal(price.toString(), expectedResult.toString())
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

    it('should set the correct price to the oracle', async () => {
      const expiryTimestamp = (t0 + t1) / 2 // between t0 and t1

      await pricer.setExpiryPriceInOracle(expiryTimestamp, p1, { from: bot })
      const priceFromOracle = await oracle.getExpiryPrice(weth.address, expiryTimestamp)
      const lastExpiryTimestamp = await oracle.lastExpiryTimestamp()
      assert.equal(p1.toString(), priceFromOracle[0].toString())
      assert.equal(lastExpiryTimestamp, expiryTimestamp)
      assert.equal(await oracle.historicalPrice(lastExpiryTimestamp), p1)
    })

    it('should revert if sender is not bot address', async () => {
      const expiryTimestamp = (t1 + t2) / 2 // between t0 and t1
      const roundId = 1
      await expectRevert(
        pricer.setExpiryPriceInOracle(expiryTimestamp, roundId, { from: random }),
        'ManualPricer: unauthorized sender',
      )
    })
  })

  describe('get historical price', async () => {
    let t0: number
    // p0 = price at t0 ... etc
    const p0 = createTokenAmount(100, 8)

    it('should return historical price with timestamp', async () => {
      await pricer.setExpiryPriceInOracle(0, p0, { from: bot })
      const roundData = await pricer.historicalPrice(0)

      assert.equal(roundData[0].toString(), p0, 'Historical round price mismatch')

      assert.equal(roundData[1].toNumber(), t0, 'Historical round timestamp mismatch')
    })

    it('should revert when no data round available', async () => {
      const invalidRoundId = 2
      assert.equal(pricer.historicalPrice(2), '0', 'Historical round timestamp mismatch')
    })
  })
})
