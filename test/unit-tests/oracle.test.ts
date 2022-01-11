import {
  MockPricerInstance,
  MockAddressBookInstance,
  OracleInstance,
  MockOtokenInstance,
  MockERC20Instance,
} from '../../build/types/truffle-types'
import BigNumber from 'bignumber.js'
import { assert } from 'chai'
import { createTokenAmount } from '../utils'

const { expectRevert, expectEvent, time } = require('@openzeppelin/test-helpers')

const MockPricer = artifacts.require('MockPricer.sol')
const MockAddressBook = artifacts.require('MockAddressBook.sol')
const MockERC20 = artifacts.require('MockERC20.sol')
const Otoken = artifacts.require('MockOtoken.sol')
const Oracle = artifacts.require('Oracle.sol')

// address(0)
const ZERO_ADDR = '0x0000000000000000000000000000000000000000'

contract('Oracle', ([owner, disputer, random, collateral, strike]) => {
  // const batch = web3.utils.asciiToHex('ETHUSDC/USDC1596218762')
  // mock a pricer
  let wethPricer: MockPricerInstance
  // AddressBook module
  let addressBook: MockAddressBookInstance
  // Oracle module
  let oracle: OracleInstance
  // otoken
  let otoken: MockOtokenInstance
  let usdc: MockERC20Instance
  let weth: MockERC20Instance
  let otokenExpiry: BigNumber

  before('Deployment', async () => {
    // addressbook module
    addressBook = await MockAddressBook.new({ from: owner })
    // deploy Oracle module
    oracle = await Oracle.new({ from: owner })

    // mock tokens
    usdc = await MockERC20.new('USDC', 'USDC', 6)
    weth = await MockERC20.new('WETH', 'WETH', 18)
    otoken = await Otoken.new()
    otokenExpiry = new BigNumber((await time.latest()).toNumber() + time.duration.days(30).toNumber())
    await otoken.init(addressBook.address, weth.address, strike, collateral, '200', otokenExpiry, true)

    // deply mock pricer (to get live price and set expiry price)
    wethPricer = await MockPricer.new(weth.address, oracle.address)
  })

  describe('Set asset pricer', () => {
    it('should revert setting pricer from non-owner address', async () => {
      await expectRevert(
        oracle.setAssetPricer(weth.address, wethPricer.address, { from: random }),
        'Ownable: caller is not the owner',
      )
    })

    it('should revert setting pricer to address(0)', async () => {
      await expectRevert(
        oracle.setAssetPricer(weth.address, ZERO_ADDR, { from: owner }),
        'Oracle: cannot set pricer to address(0)',
      )
    })

    it('should set asset pricer', async () => {
      await oracle.setAssetPricer(weth.address, wethPricer.address, { from: owner })

      assert.equal(await oracle.getPricer(weth.address), wethPricer.address, 'batch oracle address mismatch')
    })

    it('should revert setting a stable price for an asset that have a pricer', async () => {
      const stablePrice = createTokenAmount(1000, 8)

      await expectRevert(
        oracle.setStablePrice(weth.address, stablePrice, { from: owner }),
        'Oracle: could not set stable price for an asset with pricer',
      )
    })
  })

  describe('Get live price.', () => {
    it("should when querying assets that doesn't have pricer yet.", async () => {
      await expectRevert(oracle.getPrice(random), 'Oracle: Pricer for this asset not set')
    })

    it('should get the same price as Pricer', async () => {
      const pricerPrice = await wethPricer.getPrice()
      const oraclePrice = await oracle.getPrice(weth.address)
      assert.equal(pricerPrice.toString(), oraclePrice.toString())
    })

    it('should update after Pricer update', async () => {
      const price1 = createTokenAmount(235)
      await wethPricer.setPrice(price1)
      const oraclePrice = await oracle.getPrice(weth.address)
      assert.equal(oraclePrice.toString(), price1)
    })
  })

  describe('Get chainlink round data', async () => {
    it('should revert getting historical price if asset is not stable asset and have no pricer', async () => {
      const trx = await MockERC20.new('TRX', 'TRX', 18)
      const randomRoundId = 1

      await expectRevert(
        oracle.getChainlinkRoundData(trx.address, randomRoundId),
        'Oracle: Pricer for this asset not set',
      )
    })

    it('should return historical price', async () => {
      const randomMockRoundId = 1
      const price1 = createTokenAmount(235)
      await wethPricer.setPrice(price1)
      const oracleHistoricalData = await oracle.getChainlinkRoundData(weth.address, randomMockRoundId)
      assert.equal(oracleHistoricalData[0].toString(), price1)
    })
  })

  describe('Oracle locking period', () => {
    const lockingPeriod = new BigNumber(60 * 15) // 15min

    it('should revert setting pricer locking period from non-owner address', async () => {
      await expectRevert(
        oracle.setLockingPeriod(wethPricer.address, lockingPeriod, { from: random }),
        'Ownable: caller is not the owner',
      )
    })

    it('should set pricer locking period', async () => {
      await oracle.setLockingPeriod(wethPricer.address, lockingPeriod, { from: owner })

      assert.equal(
        (await oracle.getPricerLockingPeriod(wethPricer.address)).toString(),
        lockingPeriod.toString(),
        'oracle locking period mismatch',
      )
    })

    it('should check if locking period is over', async () => {
      const isOver = await oracle.isLockingPeriodOver(wethPricer.address, await time.latest(), { from: owner })
      const expectedResult = false
      assert.equal(isOver, expectedResult, 'locking period check mismatch')
    })
  })

  describe('Pricer dispute period', () => {
    const disputePeriod = new BigNumber(60 * 45) // 45min

    it('should revert setting pricer locking period from non-owner address', async () => {
      await expectRevert(
        oracle.setDisputePeriod(wethPricer.address, disputePeriod, { from: random }),
        'Ownable: caller is not the owner',
      )
    })

    it('should set oracle dispute period', async () => {
      await oracle.setDisputePeriod(wethPricer.address, disputePeriod, { from: owner })

      assert.equal(
        (await oracle.getPricerDisputePeriod(wethPricer.address)).toString(),
        disputePeriod.toString(),
        'oracle dispute period mismatch',
      )
    })

    it('should check if dispute period is over when no price submitted for that timestamp', async () => {
      const isOver = await oracle.isDisputePeriodOver(weth.address, await time.latest(), { from: owner })
      const expectedResult = false
      assert.equal(isOver, expectedResult, 'dispute period check mismatch')
    })
  })

  describe('Set Expiry Price', () => {
    let assetPrice: BigNumber

    before(async () => {
      await time.increaseTo(otokenExpiry.toNumber())
      assetPrice = new BigNumber(278)
    })

    it('should revert setting price if caller is not the pricer or disputer', async () => {
      // increase til locking period over
      await expectRevert(
        oracle.setExpiryPrice(weth.address, otokenExpiry, assetPrice, { from: random }),
        'Oracle: caller is not authorized to set expiry price',
      )
    })

    it('should revert setting price if locking period is not over', async () => {
      // the setExpiryPrice is set through pricer
      await expectRevert(
        wethPricer.setExpiryPriceInOracle(otokenExpiry, assetPrice),
        'Oracle: locking period is not over yet',
      )
    })

    it('should end locking period', async () => {
      const lockingPeriod = (await oracle.getPricerLockingPeriod(wethPricer.address)).toNumber()
      await time.increase(lockingPeriod + 100)
      const isLockingPeriodOver = await oracle.isLockingPeriodOver(weth.address, otokenExpiry)
      assert.equal(isLockingPeriodOver, true)
    })

    it('should set price correctly', async () => {
      // setExpiryPrice is called through pricer
      await wethPricer.setExpiryPriceInOracle(otokenExpiry, assetPrice)

      const [price, isFinalized] = await oracle.getExpiryPrice(weth.address, otokenExpiry)
      assert.equal(price.toString(), assetPrice.toString())
      assert.equal(isFinalized, false)
    })

    it('should revert if the same asset - expiry is set twice', async () => {
      await expectRevert(wethPricer.setExpiryPriceInOracle(otokenExpiry, assetPrice), 'Oracle: dispute period started')
    })
  })

  describe('Set disputer', () => {
    it('should return address(0) for disputer', async () => {
      const disputer = await oracle.getDisputer()
      assert.equal(disputer, ZERO_ADDR)
    })

    it('should revert setting disputer from a non-owner address', async () => {
      await expectRevert(oracle.setDisputer(disputer, { from: random }), 'Ownable: caller is not the owner')
    })

    it('should set the disputer from the owner', async () => {
      expectEvent(await oracle.setDisputer(disputer, { from: owner }), 'DisputerUpdated', { newDisputer: disputer })
      assert.equal(await oracle.getDisputer(), disputer)
    })
  })

  describe('Dispute price', () => {
    const disputePrice = new BigNumber(700)

    it('should revert before setting any disputer', async () => {
      await expectRevert(
        oracle.disputeExpiryPrice(weth.address, otokenExpiry, disputePrice, { from: random }),
        'Oracle: caller is not the disputer',
      )
    })

    it('should revert disputing price during dispute period from non-disputer', async () => {
      await expectRevert(
        oracle.disputeExpiryPrice(weth.address, otokenExpiry, disputePrice, { from: random }),
        'Oracle: caller is not the disputer',
      )
    })

    it('should revert disputing price before it get pushed by pricer', async () => {
      await expectRevert(
        oracle.disputeExpiryPrice(weth.address, otokenExpiry.plus(10), disputePrice, { from: disputer }),
        'Oracle: price to dispute does not exist',
      )
    })

    it('should dispute price during dispute period', async () => {
      await oracle.disputeExpiryPrice(weth.address, otokenExpiry, disputePrice, { from: disputer })

      const price = await oracle.getExpiryPrice(weth.address, otokenExpiry)
      assert.equal(price[0].toString(), disputePrice.toString(), 'asset price mismatch')
    })

    it('should revert disputing price after dispute period over', async () => {
      const disputePeriod = (await oracle.getPricerDisputePeriod(wethPricer.address)).toNumber()
      await time.increase(disputePeriod + 100)

      await expectRevert(
        oracle.disputeExpiryPrice(weth.address, otokenExpiry, disputePrice, { from: disputer }),
        'Oracle: dispute period over',
      )
    })
  })

  describe('Set Expiry Price From Disputer', async () => {
    const lockingPeriod = new BigNumber(60 * 15) // 15min
    const disputePeriod = new BigNumber(60 * 45) // 45min
    const assetPrice = new BigNumber(278)

    let otoken: MockOtokenInstance
    let otokenExpiry: BigNumber

    before(async () => {
      otoken = await Otoken.new()
      otokenExpiry = new BigNumber((await time.latest()).toNumber() + time.duration.days(30).toNumber())
      await otoken.init(addressBook.address, weth.address, strike, collateral, '200', otokenExpiry, true)
      await oracle.setAssetPricer(weth.address, wethPricer.address, { from: owner })
      await oracle.setLockingPeriod(wethPricer.address, lockingPeriod, { from: owner })
      await oracle.setDisputePeriod(wethPricer.address, disputePeriod, { from: owner })

      await time.increaseTo(otokenExpiry.toNumber())
      await time.increase(lockingPeriod.toNumber() + 100)

      // set disputer address
      await oracle.setDisputer(disputer, { from: owner })
    })

    it('should revert setting price from disputer address', async () => {
      await expectRevert(
        oracle.setExpiryPrice(weth.address, otokenExpiry, assetPrice, { from: disputer }),
        'Oracle: caller is not authorized to set expiry price',
      )
    })
  })

  describe('Stable prices', () => {
    const stablePrice = '1000000'

    it('should set stable price for asset', async () => {
      await expectRevert(oracle.getPrice(usdc.address), 'Oracle: Pricer for this asset not set')

      await oracle.setStablePrice(usdc.address, stablePrice, { from: owner })

      assert.equal((await oracle.getPrice(usdc.address)).toString(), stablePrice, 'Stable price mismatch')
    })

    it('should get expiry price', async () => {
      assert.equal(
        (await oracle.getExpiryPrice(usdc.address, otokenExpiry))[0].toString(),
        stablePrice,
        'Stable price mismatch',
      )
    })

    it('should return hitorical price for stable asset', async () => {
      const randomRoundId = 10

      assert.equal(
        (await oracle.getChainlinkRoundData(usdc.address, randomRoundId))[0].toString(),
        stablePrice,
        'Historical stable price mismatch',
      )
    })

    it('should return true for checking if lockign period is over', async () => {
      const isOver = await oracle.isLockingPeriodOver(usdc.address, await time.latest())
      const expectedResult = true
      assert.equal(isOver, expectedResult, 'locking period check mismatch')
    })

    it('should return true for checking if lockign period is over', async () => {
      const isOver = await oracle.isDisputePeriodOver(usdc.address, await time.latest())
      const expectedResult = true
      assert.equal(isOver, expectedResult, 'dispute period check mismatch')
    })

    it('should revert setting a pricer for an asset that have a stable price', async () => {
      const usdcPricer = await MockPricer.new(usdc.address, oracle.address)

      await expectRevert(
        oracle.setAssetPricer(usdc.address, usdcPricer.address, { from: owner }),
        'Oracle: could not set a pricer for stable asset',
      )
    })
  })

  describe('Oracle migration', () => {
    it('should revert migrating when prices and expiries array have different lengths', async () => {
      const expiries = ['111', '222', '333']
      const prices = ['150', '200']

      await expectRevert(
        oracle.migrateOracle(weth.address, expiries, prices, { from: owner }),
        'Oracle: invalid migration data',
      )
    })

    it('migrate prices', async () => {
      const expiries = ['111', '222', '333']
      const prices = ['150', '200', '110']

      await oracle.migrateOracle(weth.address, expiries, prices, { from: owner })

      assert.equal(
        new BigNumber((await oracle.getExpiryPrice(weth.address, expiries[0]))[0]).toString(),
        new BigNumber(prices[0]).toString(),
        'Migrate price mismatch',
      )
    })

    it('should revert migrating when migration ended', async () => {
      await oracle.endMigration({ from: owner })

      const expiries = ['111', '222', '333']
      const prices = ['150', '200', '100']

      await expectRevert(
        oracle.migrateOracle(weth.address, expiries, prices, { from: owner }),
        'Oracle: migration already done',
      )
    })
  })
})
