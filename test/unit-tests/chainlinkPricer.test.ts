import { ethers } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import '@nomiclabs/hardhat-web3'
import { assert } from 'chai'

import { ChainLinkPricer, MockOracle, MockChainlinkAggregator, MockERC20 } from '../../typechain'

import { createTokenAmount } from '../utils'
import { ContractFactory } from 'ethers'
const { expectRevert, time } = require('@openzeppelin/test-helpers')

// // address(0)
const ZERO_ADDR = '0x0000000000000000000000000000000000000000'

describe('ChainlinkPricer', function () {
  let accounts: SignerWithAddress[] = []
  let owner: SignerWithAddress
  let bot: SignerWithAddress
  let random: SignerWithAddress

  let wethAggregator: MockChainlinkAggregator
  let oracle: MockOracle
  let weth: MockERC20
  //otoken
  let pricer: ChainLinkPricer

  //Contract Factory
  let ChainlinkPricer: ContractFactory
  let MockOracle: ContractFactory
  let MockChainlinkAggregator: ContractFactory
  let MockERC20: ContractFactory

  this.beforeAll('Set accounts', async () => {
    accounts = await ethers.getSigners()
    const [_owner, _bot, _random] = accounts

    owner = _owner
    random = _random
    bot = _bot
  })

  this.beforeAll('Deploy contract ', async () => {
    ChainlinkPricer = await ethers.getContractFactory('ChainLinkPricer')
    MockOracle = await ethers.getContractFactory('MockOracle')
    MockChainlinkAggregator = await ethers.getContractFactory('MockChainlinkAggregator')
    MockERC20 = await ethers.getContractFactory('MockERC20')
  })

  this.beforeAll('Deployment of pricer', async () => {
    // deploy mock contracts
    const oracleDeployed = (await MockOracle.deploy()) as MockOracle
    oracle = await oracleDeployed.deployed()

    const wethAggregatorDeployed = (await MockChainlinkAggregator.deploy()) as MockChainlinkAggregator
    wethAggregator = await wethAggregatorDeployed.deployed()

    const wethDeployed = (await MockERC20.deploy('WETH', 'WETH', 18)) as MockERC20
    weth = await wethDeployed.deployed()
    // deploy pricer
    const pricerDeployed = (await ChainlinkPricer.deploy(
      bot.address,
      weth.address,
      wethAggregator.address,
      oracle.address,
    )) as ChainLinkPricer
    pricer = await pricerDeployed.deployed()
  })

  describe('constructor', () => {
    it('should set the config correctly', async () => {
      const asset = await pricer.asset()
      assert.equal(asset, weth.address)
      const bot = await pricer.bot()
      assert.equal(bot, bot)
      const aggregator = await pricer.aggregator()
      assert.equal(aggregator, wethAggregator.address)
      const oracleModule = await pricer.oracle()
      assert.equal(oracleModule, oracle.address)
    })
    it('should revert if initializing aggregator with 0 address', async () => {
      await expectRevert(
        ChainlinkPricer.deploy(bot.address, weth.address, ZERO_ADDR, wethAggregator.address),
        'ChainLinkPricer: Cannot set 0 address as aggregator',
      )
    })
    it('should revert if initializing oracle with 0 address', async () => {
      await expectRevert(
        ChainlinkPricer.deploy(bot.address, weth.address, oracle.address, ZERO_ADDR),
        'ChainLinkPricer: Cannot set 0 address as oracle',
      )
    })
    it('should revert if initializing bot with 0 address', async () => {
      await expectRevert(
        ChainlinkPricer.deploy(ZERO_ADDR, weth.address, oracle.address, wethAggregator.address),
        'ChainLinkPricer: Cannot set 0 address as bot',
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

      await pricer.connect(bot).setExpiryPriceInOracle(expiryTimestamp, roundId)
      const priceFromOracle = await oracle.connect(owner).getExpiryPrice(weth.address, expiryTimestamp)
      assert.equal(p1.toString(), priceFromOracle[0].toString())
    })

    it('should revert if sender is not bot address', async () => {
      const expiryTimestamp = (t1 + t2) / 2 // between t0 and t1
      const roundId = 1
      await expectRevert(
        pricer.connect(random).setExpiryPriceInOracle(expiryTimestamp, roundId),
        'ChainLinkPricer: unauthorized sender',
      )
    })

    it('should revert if round ID is incorrect: price[roundId].timestamp < expiry', async () => {
      const expiryTimestamp = (t1 + t2) / 2 // between t0 and t1
      const roundId = 1
      await expectRevert(
        pricer.connect(bot).setExpiryPriceInOracle(expiryTimestamp, roundId),
        'ChainLinkPricer: invalid roundId',
      )
    })
  })

  describe('get historical price', async () => {
    let t0: number
    // p0 = price at t0 ... etc
    const p0 = createTokenAmount(100, 8)

    before('setup history in aggregator', async () => {
      t0 = (await time.latest()).toNumber()
      // set round answers
      await wethAggregator.setRoundAnswer(0, p0)

      // set round timestamps
      await wethAggregator.setRoundTimestamp(0, t0)
    })

    it('should return historical price with timestamp', async () => {
      const roundData = await pricer.getHistoricalPrice(0)

      assert.equal(roundData[0].toString(), p0, 'Historical round price mismatch')

      assert.equal(roundData[1].toNumber(), t0, 'Historical round timestamp mismatch')
    })

    it('should revert when no data round available', async () => {
      const invalidRoundId = 1050

      await expectRevert(pricer.getHistoricalPrice(invalidRoundId), 'No data present');
    })
  })
})
