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
        ManualPricer.new(bot, weth.address, oracle.address),
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
      await pricer.setExpiryPriceInOracle(1, newPrice, { from: bot })
      const price = await pricer.getPrice()
      const expectedResult = createTokenAmount(400, 8)
      assert.equal(price.toString(), expectedResult.toString())
    })
  })

  describe('setExpiryPrice', () => {
    const p1 = createTokenAmount(150.333, 8)

    it('should set the correct price to the oracle', async () => {
      const expiryTimestamp = 5

      await pricer.setExpiryPriceInOracle(expiryTimestamp, p1, { from: bot })
      const priceFromOracle = await oracle.getExpiryPrice(weth.address, expiryTimestamp)
      const lastExpiryTimestamp = await pricer.lastExpiryTimestamp()
      assert.equal(p1.toString(), priceFromOracle[0].toString())
      assert.equal(lastExpiryTimestamp.toString(), expiryTimestamp.toString())
      assert.equal((await pricer.historicalPrice(lastExpiryTimestamp)).toString(), p1.toString())
    })

    it('should revert if sender is not bot address', async () => {
      const expiryTimestamp = 5
      await expectRevert(
        pricer.setExpiryPriceInOracle(expiryTimestamp, p1, { from: random }),
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

      assert.equal(roundData.toString(), p0, 'Historical round price mismatch')
    })

    it('should revert when no data round available', async () => {
      const invalidRoundId = 2
      assert.equal((await pricer.historicalPrice(2)).toString(), '0', 'Historical round timestamp mismatch')
    })
  })
})
