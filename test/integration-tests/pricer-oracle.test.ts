import {
  ChainLinkPricerInstance,
  OracleInstance,
  MockChainlinkAggregatorInstance,
  MockERC20Instance,
} from '../../build/types/truffle-types'
import BigNumber from 'bignumber.js'

const {expectRevert, time} = require('@openzeppelin/test-helpers')

const ChainlinkPricer = artifacts.require('ChainLinkPricer.sol')
const Oracle = artifacts.require('Oracle.sol')
const MockChainlinkAggregator = artifacts.require('MockChainlinkAggregator.sol')
const MockERC20 = artifacts.require('MockERC20.sol')

/**
 * scale number with 1e8
 * @param num
 */
const toChainLinkPrice = (num: number) => new BigNumber(num).times(1e8).integerValue()

contract('ChainlinkPricer + Oracle', ([owner, disputer]) => {
  let wethAggregator: MockChainlinkAggregatorInstance
  let weth: MockERC20Instance
  let pricer: ChainLinkPricerInstance
  let oracle: OracleInstance

  const lockingPeriod = 60 * 10
  const disputePeriod = 60 * 20

  before('Deployment', async () => {
    // deploy mock contracts
    oracle = await Oracle.new({from: owner})
    wethAggregator = await MockChainlinkAggregator.new()
    weth = await MockERC20.new('WETH', 'WETH', 18)

    oracle = await Oracle.new()
    //
    pricer = await ChainlinkPricer.new(weth.address, wethAggregator.address, oracle.address)
  })

  describe('get live Price', () => {
    // aggregator have price in 1e8
    const ethPrice = toChainLinkPrice(300)
    before('mock data in weth aggregator', async () => {
      await wethAggregator.setLatestAnswer(ethPrice)
    })
    before('should set the pricer and locking period, dispute period in oracle without revert.', async () => {
      await oracle.setAssetPricer(weth.address, pricer.address)

      await oracle.setLockingPeriod(pricer.address, lockingPeriod)
      await oracle.setDisputePeriod(pricer.address, disputePeriod)
      await oracle.setAssetPricer(weth.address, pricer.address)
    })
    it('should return the price in 1e18 from oracle', async () => {
      const expectedResult = new BigNumber(300).times(1e18)
      const priceFromOracle = await oracle.getPrice(weth.address)
      assert.equal(priceFromOracle.toString(), expectedResult.toString())
    })
    it('should return the new price after submitting new answer in aggregator', async () => {
      const newPrice = toChainLinkPrice(400)
      const expectedResult = new BigNumber(400).times(1e18)
      await wethAggregator.setLatestAnswer(newPrice)
      const priceFromOracle = await oracle.getPrice(weth.address)
      assert.equal(priceFromOracle.toString(), expectedResult.toString())
    })
    it('should revert if price is lower than 0', async () => {
      await wethAggregator.setLatestAnswer(-1)
      await expectRevert(pricer.getPrice(), 'ChainLinkPricer: price is lower than 0')
      await expectRevert(oracle.getPrice(weth.address), 'ChainLinkPricer: price is lower than 0')
    })
  })

  describe('setExpiryPrice', () => {
    // time order: t0, t1, t2, t3, t4
    let t0: number, t1: number, t2: number
    // p0 = price at t0 ... etc
    const p0 = toChainLinkPrice(100)
    const p1 = toChainLinkPrice(150.333)
    const p2 = toChainLinkPrice(180)

    let submitTimestamp: number

    before('setup history in aggregator', async () => {
      // set t0, t1, t2, expiry, t3, t4
      t0 = (await time.latest()).toNumber()
      // set round answers
      await wethAggregator.setRoundAnswer(0, p0)
      await wethAggregator.setRoundAnswer(1, p1)
      await wethAggregator.setRoundAnswer(2, p2)

      // set round timestamps
      await wethAggregator.setRoundTimestamp(0, t0)
      t1 = t0 + 60 * 1
      await wethAggregator.setRoundTimestamp(1, t1)
      t2 = t0 + 60 * 2
      await wethAggregator.setRoundTimestamp(2, t2)
    })

    it('should revert when setting expiry price before locking period done', async () => {
      const expiryTimestamp = (t0 + t1) / 2 // between t0 and t1
      if ((await time.latest()) < expiryTimestamp) {
        // go to expiry time
        await time.increaseTo(expiryTimestamp + 2)
      }
      const roundId = 1
      await expectRevert(
        pricer.setExpiryPriceToOralce(expiryTimestamp, roundId),
        'Oracle: locking period is not over yet.',
      )
    })

    it('anyone can set an price to oracle', async () => {
      const expiryTimestamp = (t0 + t1) / 2 // between t0 and t1
      if ((await time.latest()) < expiryTimestamp + lockingPeriod) {
        // go to expiry time
        await time.increaseTo(expiryTimestamp + lockingPeriod + 10)
      }
      const roundId = 1
      await pricer.setExpiryPriceToOralce(expiryTimestamp, roundId)
      const [priceFromOracle, isFinalized] = await oracle.getExpiryPrice(weth.address, expiryTimestamp)
      assert.equal(p1.toString(), priceFromOracle.toString())
      assert.equal(isFinalized, false)
      submitTimestamp = (await time.latest()).toNumber()
    })

    it('should revert when trying to submit again', async () => {
      const expiryTimestamp = (t0 + t1) / 2 // between t0 and t1
      const roundId = 1
      await expectRevert(pricer.setExpiryPriceToOralce(expiryTimestamp, roundId), 'Oracle: dispute period started')
      const priceFromOracle = await oracle.getExpiryPrice(weth.address, expiryTimestamp)
      assert.equal(p1.toString(), priceFromOracle[0].toString())
    })

    it('should revert when dispute is called by non-disputer', async () => {
      const expiryTimestamp = (t0 + t1) / 2 // between t0 and t1
      const newPrice = new BigNumber(450).times(1e18)
      await expectRevert(
        oracle.disputeExpiryPrice(weth.address, expiryTimestamp, newPrice),
        'Oracle: caller is not the disputer',
      )
    })

    it('should be able to dispute the price during dispute period', async () => {
      await oracle.setDisputer(disputer)
      const expiryTimestamp = (t0 + t1) / 2 // between t0 and t1
      const newPrice = new BigNumber(450).times(1e18)
      await oracle.disputeExpiryPrice(weth.address, expiryTimestamp, newPrice, {from: disputer})
    })

    it('should revert if dispute period is over', async () => {
      const expiryTimestamp = (t0 + t1) / 2 // between t0 and t1
      if ((await time.latest()).toNumber() < submitTimestamp + disputePeriod) {
        await time.increaseTo(submitTimestamp + disputePeriod + 100)
      }
      const newPrice = new BigNumber(453).times(1e18)
      await expectRevert(
        oracle.disputeExpiryPrice(weth.address, expiryTimestamp, newPrice, {from: disputer}),
        'Oracle: dispute period over',
      )
    })

    it('should get isFinalized = true after dispute period', async () => {
      const expiryTimestamp = (t0 + t1) / 2 // between t0 and t1
      const newPrice = new BigNumber(450).times(1e18)
      const [price, isFinalized] = await oracle.getExpiryPrice(weth.address, expiryTimestamp)
      assert.equal(newPrice.toString(), price.toString())
      assert.equal(isFinalized, true)
    })
  })
})
