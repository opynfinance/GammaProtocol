import {
  MockPricerInstance,
  MockAddressBookInstance,
  OracleInstance,
  MockOtokenInstance,
  MockERC20Instance,
} from '../build/types/truffle-types'
import BigNumber from 'bignumber.js'
import {assert} from 'chai'

const {expectRevert, time} = require('@openzeppelin/test-helpers')

const MockPricer = artifacts.require('MockPricer.sol')
const MockAddressBook = artifacts.require('MockAddressBook.sol')
const MockERC20 = artifacts.require('MockERC20.sol')
const Otoken = artifacts.require('MockOtoken.sol')
const Oracle = artifacts.require('Oracle.sol')

// address(0)
const ZERO_ADDR = '0x0000000000000000000000000000000000000000'

contract('Oracle', ([owner, controllerAddress, random, collateral, strike]) => {
  // const batch = web3.utils.asciiToHex('ETHUSDCUSDC1596218762')
  // mock a pricer
  let pricer: MockPricerInstance
  // AddressBook module
  let addressBook: MockAddressBookInstance
  // Oracle module
  let oracle: OracleInstance
  // otoken
  let otoken: MockOtokenInstance
  let weth: MockERC20Instance
  let otokenExpiry: BigNumber

  before('Deployment', async () => {
    // addressbook module
    addressBook = await MockAddressBook.new({from: owner})
    // set controller address in AddressBook
    await addressBook.setController(controllerAddress, {from: owner})
    // deploy Oracle module
    oracle = await Oracle.new(addressBook.address, {from: owner})

    // mock tokens
    weth = await MockERC20.new('WETH', 'WETH')
    otoken = await Otoken.new()
    otokenExpiry = new BigNumber((await time.latest()).toNumber() + time.duration.days(30).toNumber())
    await otoken.init(weth.address, strike, collateral, '200', otokenExpiry, true)

    // deply mock pricer (to get live price and set expiry price)
    pricer = await MockPricer.new(weth.address, oracle.address)
  })

  describe('Oracle deployment', () => {
    it('shout revert if deployed with 0 addressBook address', async () => {
      await expectRevert(Oracle.new(ZERO_ADDR), 'Invalid address book')
    })
  })

  describe('setAssetPricer', () => {
    it('should revert setting pricer from non-owner address', async () => {
      await expectRevert(
        oracle.setAssetPricer(weth.address, pricer.address, {from: random}),
        'Ownable: caller is not the owner',
      )
    })

    it('should revert setting pricer to address(0)', async () => {
      await expectRevert(
        oracle.setAssetPricer(weth.address, ZERO_ADDR, {from: owner}),
        'Oracle: cannot set pricer to address(0)',
      )
    })

    it('should set batch oracle', async () => {
      await oracle.setAssetPricer(weth.address, pricer.address, {from: owner})

      assert.equal(await oracle.getPricer(weth.address), pricer.address, 'batch oracle address mismatch')
    })
  })

  describe('Oracle locking period', () => {
    const lockingPeriod = new BigNumber(60 * 15) // 15min

    it('should revert setting pricer locking period from non-owner address', async () => {
      await expectRevert(
        oracle.setLockingPeriod(pricer.address, lockingPeriod, {from: random}),
        'Ownable: caller is not the owner',
      )
    })

    it('should set pricer locking period', async () => {
      await oracle.setLockingPeriod(pricer.address, lockingPeriod, {from: owner})

      assert.equal(
        (await oracle.getPricerLockingPeriod(pricer.address)).toString(),
        lockingPeriod.toString(),
        'oracle locking period mismatch',
      )
    })

    it('should check if locking period is over', async () => {
      const isOver = await oracle.isLockingPeriodOver(pricer.address, await time.latest(), {from: owner})
      const expectedResult = false
      assert.equal(isOver, expectedResult, 'locking period check mismatch')
    })
  })

  describe('Pricer dispute period', () => {
    const disputePeriod = new BigNumber(60 * 45) // 45min

    it('should revert setting pricer locking period from non-owner address', async () => {
      await expectRevert(
        oracle.setDisputePeriod(pricer.address, disputePeriod, {from: random}),
        'Ownable: caller is not the owner',
      )
    })

    it('should set oracle dispute period', async () => {
      await oracle.setDisputePeriod(pricer.address, disputePeriod, {from: owner})

      assert.equal(
        (await oracle.getPricerDisputePeriod(pricer.address)).toString(),
        disputePeriod.toString(),
        'oracle dispute period mismatch',
      )
    })

    it('should check if dispute period is over when price timestamp equal to zero', async () => {
      const isOver = await oracle.isDisputePeriodOver(weth.address, await time.latest(), {from: owner})
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

    it('should revert setting price if caller is not the pricer', async () => {
      // increase til locking period over
      await expectRevert(
        oracle.setExpiryPrice(weth.address, otokenExpiry, assetPrice),
        'Oracle: caller is not the pricer',
      )
    })

    it('should revert setting price if locking period is not over', async () => {
      // the setExpiryPrice is set through pricer
      await expectRevert(
        pricer.setExpiryPriceToOralce(otokenExpiry, assetPrice),
        'Oracle: locking period is not over yet',
      )
    })

    it('should end locking period', async () => {
      const lockingPeriod = (await oracle.getPricerLockingPeriod(pricer.address)).toNumber()
      await time.increase(lockingPeriod + 100)
      const isLockingPeriodOver = await oracle.isLockingPeriodOver(weth.address, otokenExpiry)
      assert.equal(isLockingPeriodOver, true)
    })

    it('should set price correctly', async () => {
      // setExpiryPrice is called through pricer
      await pricer.setExpiryPriceToOralce(otokenExpiry, assetPrice)

      const [price, isFinalized] = await oracle.getExpiryPrice(weth.address, otokenExpiry)
      assert.equal(price.toString(), assetPrice.toString())
      assert.equal(isFinalized, false)
    })

    it('should revert if the same asset - expiry is set twice', async () => {
      await expectRevert(pricer.setExpiryPriceToOralce(otokenExpiry, assetPrice), 'Oracle: dispute period started')
    })
  })

  describe('Dispute price', () => {
    const disputePrice = new BigNumber(700)
    it('should revert disputing price during dispute period from non-owner', async () => {
      await expectRevert(
        oracle.disputeExpiryPrice(weth.address, otokenExpiry, disputePrice, {from: random}),
        'Ownable: caller is not the owner',
      )
    })

    it('should dispute price during dispute period', async () => {
      await oracle.disputeExpiryPrice(weth.address, otokenExpiry, disputePrice, {from: owner})

      const price = await oracle.getExpiryPrice(weth.address, otokenExpiry)
      assert.equal(price[0].toString(), disputePrice.toString(), 'asset price mismatch')
    })

    it('should revert disputing price after dispute period over', async () => {
      const disputePeriod = (await oracle.getPricerDisputePeriod(pricer.address)).toNumber()
      await time.increase(disputePeriod + 100)

      await expectRevert(
        oracle.disputeExpiryPrice(weth.address, otokenExpiry, disputePrice, {from: owner}),
        'Oracle: dispute period over',
      )
    })
  })
})
