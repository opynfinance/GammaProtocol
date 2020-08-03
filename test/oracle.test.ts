import {MockChainlinkOracleInstance, MockAddressBookInstance, OracleInstance} from '../build/types/truffle-types'
import BigNumber from 'bignumber.js'

const {expectEvent, expectRevert, time, BN} = require('@openzeppelin/test-helpers')

const MockChainlinkOracle = artifacts.require('MockChainlinkOracle.sol')
const MockAddressBook = artifacts.require('MockAddressBook.sol')
const Oracle = artifacts.require('Oracle.sol')

// address(0)
const ZERO_ADDR = '0x0000000000000000000000000000000000000000'

contract('Oracle', ([owner, controllerAddress, random]) => {
  const batch = web3.utils.asciiToHex('ETHUSDCUSDC1596218762')
  // Chainlink mock instance
  let batchOracle: MockChainlinkOracleInstance
  // AddressBook module
  let addressBook: MockAddressBookInstance
  // Oracle module
  let oracle: OracleInstance

  before('Deployment', async () => {
    // deploy price feed mock
    batchOracle = await MockChainlinkOracle.new({from: owner})
    // addressbook module
    addressBook = await MockAddressBook.new({from: owner})
    // set controller address in AddressBook
    await addressBook.setController(controllerAddress, {from: owner})
    // deploy Whitelist module
    oracle = await Oracle.new(addressBook.address, {from: owner})
  })

  describe('Oracle deployment', () => {
    it('shout revert if deployed with 0 addressBook address', async () => {
      await expectRevert(Oracle.new(ZERO_ADDR), 'Invalid address book')
    })
  })

  describe('Batch oracle', () => {
    it('should revert setting batch oracle from non-owner address', async () => {
      await expectRevert(
        oracle.setBatchOracle(batch, batchOracle.address, {from: random}),
        'Ownable: caller is not the owner',
      )
    })

    it('should set batch oracle', async () => {
      await oracle.setBatchOracle(batch, batchOracle.address, {from: owner})

      assert.equal(await oracle.getBatchOracle(batch), batchOracle.address, 'batch oracle address mismatch')
    })
  })

  describe('Oracle locking period', () => {
    const lockingPeriod = new BigNumber(60 * 15) // 15min

    it('should revert setting oracle locking period from non-owner address', async () => {
      await expectRevert(
        oracle.setLockingPeriod(batchOracle.address, lockingPeriod, {from: random}),
        'Ownable: caller is not the owner',
      )
    })

    it('should set oracle locking period', async () => {
      await oracle.setLockingPeriod(batchOracle.address, lockingPeriod, {from: owner})

      assert.equal(
        (await oracle.getOracleLockingPeriod(batchOracle.address)).toString(),
        lockingPeriod.toString(),
        'oracle locking period mismatch',
      )
    })

    it('should check if locking period is over', async () => {
      const isOver = await oracle.isLockingPeriodOver(batchOracle.address, await time.latest(), {from: owner})
      const expectedResult = false
      assert.equal(isOver, expectedResult, 'locking period check mismatch')
    })
  })

  describe('Oracle dispute period', () => {
    const disputePeriod = new BigNumber(60 * 45) // 45min

    it('should revert setting oracle locking period from non-owner address', async () => {
      await expectRevert(
        oracle.setDisputePeriod(batchOracle.address, disputePeriod, {from: random}),
        'Ownable: caller is not the owner',
      )
    })

    it('should set oracle locking period', async () => {
      await oracle.setDisputePeriod(batchOracle.address, disputePeriod, {from: owner})

      assert.equal(
        (await oracle.getOracleDisputePeriod(batchOracle.address)).toString(),
        disputePeriod.toString(),
        'oracle dispute period mismatch',
      )
    })

    it('should check if locking period is over when price timestmap equal to zero', async () => {
      const isOver = await oracle.isDisputePeriodOver(batchOracle.address, await time.latest(), {from: owner})
      const expectedResult = false
      assert.equal(isOver, expectedResult, 'dispute period check mismatch')
    })
  })

  describe('Set batch underlying asset price', () => {
    let batchExpiry: BigNumber
    let roundBack: BigNumber
    let priorRoundTimestamp: BigNumber
    // expected underlying price at that timestamp
    let batchUnderlyingPrice: BigNumber

    before(async () => {
      batchExpiry = new BigNumber(await time.latest())
      roundBack = new BigNumber(1)
      priorRoundTimestamp = roundBack.plus(1)
      // expected underlying price at that timestamp
      batchUnderlyingPrice = new BigNumber(200)
    })

    it('should revert setting price if locking period is not over', async () => {
      // set round back timestamp, in this scenario price got pushed to feed 10 min after batch expiry
      await batchOracle.setRoundTimestamp(roundBack, batchExpiry.plus(60 * 10))
      // set prior round timestamp
      await batchOracle.setRoundTimestamp(priorRoundTimestamp, batchExpiry.minus(60 * 10))
      // set price feed
      await batchOracle.setRoundAnswer(roundBack, batchUnderlyingPrice)

      await expectRevert(
        oracle.setBatchUnderlyingPrice(batch, batchExpiry, roundBack, {from: controllerAddress}),
        'Oracle: locking period is not over yet',
      )
    })

    it('should set price at round back equal to 1', async () => {
      // advance time to pass batch locking period (15 min)
      await time.increase(new BN(60 * 15.5))

      // set round back timestamp, in this scenario price got pushed to feed 10 min after batch expiry
      await batchOracle.setRoundTimestamp(roundBack, batchExpiry.plus(60 * 10))
      // set prior round timestamp
      await batchOracle.setRoundTimestamp(priorRoundTimestamp, batchExpiry.minus(60 * 10))
      // set price feed
      await batchOracle.setRoundAnswer(roundBack, batchUnderlyingPrice)

      // current timestamp at which price will be submitted to our Oracle module
      const onchainPriceTimestamp = new BigNumber(await time.latest())
      // set batch underlying price
      await oracle.setBatchUnderlyingPrice(batch, batchExpiry, roundBack, {from: controllerAddress})

      // get batch price
      const price = await oracle.getBatchPrice(batch, batchExpiry)

      assert.equal(price[0].toString(), batchUnderlyingPrice.toString(), 'batch underlying price mismatch')
      // checking difference between timestamp is less than 2, used this because of lack timestamp precision
      assert.isAtMost(
        new BigNumber(price[1]).minus(onchainPriceTimestamp).toNumber(),
        2,
        'batch underlying price on-chain timestamp mismatch',
      )
    })

    it('should revert setting price from controller module if dispute period already started', async () => {
      await expectRevert(
        oracle.setBatchUnderlyingPrice(batch, batchExpiry, roundBack, {from: controllerAddress}),
        'Oracle: dispute period started',
      )

      // re-set oracle to zero address
      await oracle.setBatchOracle(batch, batchOracle.address, {from: owner})
    })

    it('should revert setting price if batch oracle is equal to address zero', async () => {
      // set oracle to zero address
      await oracle.setBatchOracle(batch, ZERO_ADDR, {from: owner})

      await expectRevert(
        oracle.setBatchUnderlyingPrice(batch, batchExpiry, roundBack, {from: controllerAddress}),
        'Oracle: no oracle for this specific batch',
      )

      // re-set oracle to zero address
      await oracle.setBatchOracle(batch, batchOracle.address, {from: owner})
    })

    it('should set price at round back=1, and chainlink roundback price=3', async () => {
      batchUnderlyingPrice = new BigNumber(500)
      batchExpiry = new BigNumber(await time.latest())

      // advance time to pass batch locking period (15 min)
      await time.increase(new BN(60 * 15.5))

      // set round back timestamp, in this scenario price got pushed to feed 10 min after batch expiry
      await batchOracle.setRoundTimestamp(roundBack, batchExpiry.plus(60 * 15))
      // set roundback+1 timestamp
      await batchOracle.setRoundTimestamp(roundBack.plus(1), batchExpiry.plus(60 * 10))
      // set roundback+2 timestamp
      await batchOracle.setRoundTimestamp(roundBack.plus(2), batchExpiry.plus(60 * 5))
      // set roundback+2 timestamp
      await batchOracle.setRoundTimestamp(roundBack.plus(3), batchExpiry.plus(60))
      // set roundback+3 timestamp
      await batchOracle.setRoundTimestamp(roundBack.plus(4), batchExpiry.minus(60 * 2))

      // set price feed
      await batchOracle.setRoundAnswer(roundBack.plus(3), batchUnderlyingPrice)

      // current timestamp at which price will be submitted to our Oracle module
      const onchainPriceTimestmap = new BigNumber(await time.latest())
      // set batch underlying price
      await oracle.setBatchUnderlyingPrice(batch, batchExpiry, roundBack, {from: controllerAddress})

      // get batch price
      const price = await oracle.getBatchPrice(batch, batchExpiry)

      assert.equal(price[0].toString(), batchUnderlyingPrice.toString(), 'batch underlying price mismatch')
      // checking difference between timestamp is less than 2, used this because of lack timestamp precision
      assert.isAtMost(
        new BigNumber(price[1]).minus(onchainPriceTimestamp).toNumber(),
        2,
        'batch underlying price on-chain timestamp mismatch',
      )
    })
  })
})
