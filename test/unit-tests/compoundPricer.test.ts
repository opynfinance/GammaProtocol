import { ethers } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import '@nomiclabs/hardhat-web3'
import { assert } from 'chai'

import { MockPricer, MockOracle, MockERC20, MockCToken, CompoundPricer } from '../../typechain'

import { underlyingPriceToCtokenPrice } from '../utils'
import BigNumber from 'bignumber.js'

import { createScaledNumber } from '../utils'
import { ContractFactory } from 'ethers'
const { expectRevert, time } = require('@openzeppelin/test-helpers')

// address(0)
const ZERO_ADDR = '0x0000000000000000000000000000000000000000'

describe('CompoundPricer', function () {
  let accounts: SignerWithAddress[] = []

  let MockPricer: ContractFactory
  let MockOracle: ContractFactory

  let MockERC20: ContractFactory
  let MockCToken: ContractFactory
  let CompoundPricer: ContractFactory

  let owner: SignerWithAddress
  let random: SignerWithAddress

  let oracle: MockOracle
  let weth: MockERC20
  let usdc: MockERC20
  let cETH: MockCToken
  let cUSDC: MockCToken
  // old pricer
  let wethPricer: MockPricer
  // compound pricer
  let cethPricer: CompoundPricer
  let cusdcPricer: CompoundPricer

  this.beforeAll('Set accounts', async () => {
    accounts = await ethers.getSigners()
    const [_owner, _random] = accounts

    owner = _owner
    random = _random
  })

  this.beforeAll('Initialize Contract Factory', async () => {
    MockPricer = await ethers.getContractFactory('MockPricer')
    MockOracle = await ethers.getContractFactory('MockOracle')

    MockERC20 = await ethers.getContractFactory('MockERC20')
    MockCToken = await ethers.getContractFactory('MockCToken')
    CompoundPricer = await ethers.getContractFactory('CompoundPricer')
  })

  this.beforeAll('Deployment', async () => {
    // deploy mock contracts
    const oracleDeployed = (await MockOracle.deploy()) as MockOracle
    oracle = await oracleDeployed.deployed()

    const wethDeployed = (await MockERC20.deploy('WETH', 'WETH', 18)) as MockERC20
    weth = await wethDeployed.deployed()

    const usdcDeployed = (await MockERC20.deploy('USDC', 'USDC', 6)) as MockERC20
    usdc = await usdcDeployed.deployed()

    const cETHDeployed = (await MockCToken.deploy('CETH', 'CETH')) as MockCToken
    cETH = await cETHDeployed.deployed()

    const cUSDCDeployed = (await MockCToken.deploy('cUSDC', 'cUSDC')) as MockCToken
    cUSDC = await cUSDCDeployed.deployed()
    // mock underlying pricers
    const wethPricerDeployed = (await MockPricer.deploy(weth.address, oracle.address)) as MockPricer
    wethPricer = await wethPricerDeployed.deployed()

    await oracle.setAssetPricer(weth.address, wethPricer.address)
  })

  describe('constructor', () => {
    it('should deploy the contract successfully', async () => {
      cethPricer = (await CompoundPricer.deploy(cETH.address, weth.address, oracle.address)) as CompoundPricer
      cusdcPricer = (await CompoundPricer.deploy(cUSDC.address, usdc.address, oracle.address)) as CompoundPricer
    })
    it('should revert if initializing with cToken = 0', async () => {
      await expectRevert(
        CompoundPricer.deploy(ZERO_ADDR, weth.address, oracle.address),
        'CompoundPricer: cToken address can not be 0',
      )
    })
    it('should revert if initializing with underlying = 0 address', async () => {
      await expectRevert(
        CompoundPricer.deploy(cETH.address, ZERO_ADDR, oracle.address),
        'CompoundPricer: underlying address can not be 0',
      )
    })
    it('should revert if initializing with oracle = 0 address', async () => {
      await expectRevert(
        CompoundPricer.deploy(cETH.address, weth.address, ZERO_ADDR),
        'CompoundPricer: oracle address can not be 0',
      )
    })
  })

  describe('getPrice for cETH', () => {
    const ethPrice = createScaledNumber(470)
    const exchangeRate = new BigNumber('200192735438752381581313918')
    before('mock data in chainlink pricer and cToken', async () => {
      await oracle.setRealTimePrice(usdc.address, '100000000')
      await oracle.setRealTimePrice(weth.address, ethPrice)
      // await wethPricer.setPrice(ethPrice)
      await cETH.setExchangeRate(exchangeRate.toString())
    })
    it('should return the price in 1e8', async () => {
      // how much 1e8 cToken worth in USD
      const cTokenprice = await cethPricer.getPrice()
      const expectResult = await underlyingPriceToCtokenPrice(new BigNumber(ethPrice), exchangeRate, weth)
      assert.equal(cTokenprice.toString(), expectResult.toString())
      // hard coded answer
      // 1 cETH = 9.4 USD
      assert.equal(cTokenprice.toString(), '940905856')
    })
    it('should return the new price after resetting answer in underlying pricer', async () => {
      const newPrice = createScaledNumber(500)
      // await wethPricer.setPrice(newPrice)
      await oracle.setRealTimePrice(weth.address, newPrice)
      const cTokenPrice = await cethPricer.getPrice()
      const expectedResult = await underlyingPriceToCtokenPrice(new BigNumber(newPrice), exchangeRate, weth)
      assert.equal(cTokenPrice.toString(), expectedResult.toString())
    })
    it('should revert if price is lower than 0', async () => {
      // await wethPricer.setPrice('0')
      await oracle.setRealTimePrice(weth.address, '0')
      await expectRevert(cethPricer.getPrice(), 'CompoundPricer: underlying price is 0')
    })
  })

  describe('getPrice for cUSDC', () => {
    const usdPrice = createScaledNumber(1)
    const exchangeRate = new BigNumber('211619877757422')

    before('mock data in chainlink pricer and cToken', async () => {
      await oracle.setStablePrice(usdc.address, '100000000')
      await cUSDC.setExchangeRate(exchangeRate.toString())
    })

    it('should return the price in 1e8', async () => {
      // how much 1e8 cToken worth in USD
      const cTokenprice = await cusdcPricer.getPrice()
      const expectResult = await underlyingPriceToCtokenPrice(new BigNumber(usdPrice), exchangeRate, usdc)
      assert.equal(cTokenprice.toString(), expectResult.toString())
      // hard coded answer
      // 1 cUSDC = 0.02 USD
      assert.equal(cTokenprice.toString(), '2116198') // 0.0211 usd
    })
    it('should return the new price after resetting answer in underlying pricer', async () => {
      const newPrice = createScaledNumber(1.1)
      await oracle.setStablePrice(usdc.address, newPrice)
      const cTokenPrice = await cusdcPricer.getPrice()
      const expectedResult = await underlyingPriceToCtokenPrice(new BigNumber(newPrice), exchangeRate, usdc)
      assert.equal(cTokenPrice.toString(), expectedResult.toString())
    })
  })

  describe('setExpiryPrice', () => {
    let expiry: number
    const ethPrice = new BigNumber(createScaledNumber(300))
    const exchangeRate = new BigNumber('200192735438752381581313918')

    before('setup oracle record for weth price', async () => {
      expiry = (await time.latest()) + time.duration.days(30).toNumber()
    })

    it("should revert if oracle don't have price of underlying yet", async () => {
      await expectRevert(cethPricer.setExpiryPriceInOracle(expiry), 'CompoundPricer: underlying price not set yet')
    })

    it('should set price successfully by arbitrary address', async () => {
      await oracle.setExpiryPrice(weth.address, expiry, ethPrice.toString())
      await cethPricer.connect(random).setExpiryPriceInOracle(expiry)
      const [price] = await oracle.getExpiryPrice(cETH.address, expiry)
      const expectedResult = await underlyingPriceToCtokenPrice(ethPrice, exchangeRate, weth)
      assert.equal(price.toString(), expectedResult.toString())
    })
  })
})
