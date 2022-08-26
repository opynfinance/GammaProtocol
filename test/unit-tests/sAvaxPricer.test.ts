import {
  MockPricerInstance,
  MockOracleInstance,
  MockERC20Instance,
  MockSAVAXTokenInstance,
  SAvaxPricerInstance,
} from '../../build/types/truffle-types'

import { underlyingPriceToYTokenPrice } from '../utils'

import BigNumber from 'bignumber.js'
import { createScaledNumber } from '../utils'
const { expectRevert, time } = require('@openzeppelin/test-helpers')

const MockPricer = artifacts.require('MockPricer.sol')
const MockOracle = artifacts.require('MockOracle.sol')

const MockERC20 = artifacts.require('MockERC20.sol')
const MockSAVAXToken = artifacts.require('MockSAVAXToken.sol')
const SAvaxPricer = artifacts.require('SAvaxPricer.sol')

// address(0)
const ZERO_ADDR = '0x0000000000000000000000000000000000000000'

contract('SAvaxPricer', ([owner, random]) => {
  let oracle: MockOracleInstance
  let wAvax: MockERC20Instance
  let wAvaxPricer: MockPricerInstance
  let sAvax: MockSAVAXTokenInstance
  let sAvaxPricer: SAvaxPricerInstance

  before('Deployment', async () => {
    oracle = await MockOracle.new({ from: owner })
    wAvax = await MockERC20.new('WAVAX', 'WAVAX', 18)
    sAvax = await MockSAVAXToken.new('sAVAX', 'sAVAX')

    wAvaxPricer = await MockPricer.new(wAvax.address, oracle.address)
    sAvaxPricer = await SAvaxPricer.new(sAvax.address, wAvax.address, oracle.address)

    await oracle.setAssetPricer(wAvax.address, wAvaxPricer.address)
  })

  describe('constructor', () => {
    it('should deploy the contract successfully with correct values', async () => {
      assert.equal(await sAvaxPricer.sAVAX(), sAvax.address)
      assert.equal(await sAvaxPricer.underlying(), wAvax.address)
      assert.equal(await sAvaxPricer.oracle(), oracle.address)
    })

    it('should revert if initializing with sAvax = 0', async () => {
      await expectRevert(SAvaxPricer.new(ZERO_ADDR, sAvax.address, oracle.address), 'W1')
    })

    it('should revert if initializing with underlying = 0 address', async () => {
      await expectRevert(SAvaxPricer.new(sAvax.address, ZERO_ADDR, oracle.address), 'W2')
    })

    it('should revert if initializing with oracle = 0 address', async () => {
      await expectRevert(SAvaxPricer.new(sAvax.address, wAvax.address, ZERO_ADDR), 'W3')
    })
  })

  describe('getPrice for sAvax', () => {
    const avaxPrice = createScaledNumber(89.78)
    const pricePerShare = new BigNumber('1002001490131578947')
    before('mock data in chainlink pricer and sAvax', async () => {
      await oracle.setRealTimePrice(wAvax.address, avaxPrice)
      await sAvax.setPooledAvaxByShares(pricePerShare)
    })
    it('should return the price in 1e8', async () => {
      const sAvaxprice = await sAvaxPricer.getPrice()
      const expectResult = await underlyingPriceToYTokenPrice(new BigNumber(avaxPrice), pricePerShare, wAvax)
      assert.equal(sAvaxprice.toString(), expectResult.toString())
      // hardcoded answer, 1 sAVAX = 1.00200149 AVAX
      assert.equal(sAvaxprice.toString(), '8995969378')
    })

    it('should return the new price after resetting answer in underlying pricer', async () => {
      const newPrice = createScaledNumber(500)
      await oracle.setRealTimePrice(wAvax.address, newPrice)
      const sAvaxprice = await sAvaxPricer.getPrice()
      const expectedResult = await underlyingPriceToYTokenPrice(new BigNumber(newPrice), pricePerShare, wAvax)
      assert.equal(sAvaxprice.toString(), expectedResult.toString())
    })

    it('should revert if price is lower than 0', async () => {
      await oracle.setRealTimePrice(wAvax.address, '0')
      await expectRevert(sAvaxPricer.getPrice(), 'W4')
    })
  })

  describe('setExpiryPrice', () => {
    let expiry: number
    const avaxPrice = new BigNumber(createScaledNumber(300))
    const pricePerShare = new BigNumber('1002001490131578947')

    before('setup oracle record for wAvax price', async () => {
      expiry = (await time.latest()) + time.duration.days(30).toNumber()
    })

    it("should revert if oracle don't have price of underlying yet", async () => {
      await expectRevert(sAvaxPricer.setExpiryPriceInOracle(expiry), 'W5')
    })

    it('should set price successfully by arbitrary address', async () => {
      await oracle.setExpiryPrice(wAvax.address, expiry, avaxPrice)
      await sAvaxPricer.setExpiryPriceInOracle(expiry, { from: random })
      const [price] = await oracle.getExpiryPrice(sAvax.address, expiry)
      const expectedResult = await underlyingPriceToYTokenPrice(avaxPrice, pricePerShare, wAvax)
      assert.equal(price.toString(), expectedResult.toString())
    })
  })
})
