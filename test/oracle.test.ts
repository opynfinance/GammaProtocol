import {OracleInstance} from '../build/types/truffle-types'

const BigNumber = require('bignumber.js')
const {expectRevert, time} = require('@openzeppelin/test-helpers')

const Oracle = artifacts.require('Oracle.sol')

contract('Oracle', ([owner, batchOracle, random]) => {
  const batch = web3.utils.asciiToHex('ETHUSDCUSDC1596218762')
  // Oracle module
  let oracle: OracleInstance

  before('Deployment', async () => {
    // deploy Whitelist module
    oracle = await Oracle.new({from: owner})
  })

  describe('Batch oracle', () => {
    it('should revert setting batch oracle from non-owner address', async () => {
      await expectRevert(oracle.setBatchOracle(batch, batchOracle, {from: random}), 'Ownable: caller is not the owner')
    })

    it('should set batch oracle', async () => {
      await oracle.setBatchOracle(batch, batchOracle, {from: owner})

      assert.equal(await oracle.getBatchOracle(batch), batchOracle, 'batch oracle address mismatch')
    })
  })

  describe('Oracle locking period', () => {
    const lockingPeriod = new BigNumber(60 * 15) // 15min

    it('should revert setting oracle locking period from non-owner address', async () => {
      await expectRevert(
        oracle.setLockingPeriod(batchOracle, lockingPeriod, {from: random}),
        'Ownable: caller is not the owner',
      )
    })

    it('should set oracle locking period', async () => {
      await oracle.setLockingPeriod(batchOracle, lockingPeriod, {from: owner})

      assert.equal(
        (await oracle.getOracleLockingPeriod(batchOracle)).toString(),
        lockingPeriod.toString(),
        'oracle locking period mismatch',
      )
    })

    it('should check if locking period is over', async () => {
      const isOver = await oracle.isLockingPeriodOver(batchOracle, await time.latest(), {from: owner})
      const expectedResult = false
      assert.equal(isOver, expectedResult, 'locking period check mismatch')
    })
  })

  describe('Oracle dispute period', () => {
    const disputePeriod = new BigNumber(60 * 45) // 45min

    it('should revert setting oracle locking period from non-owner address', async () => {
      await expectRevert(
        oracle.setDisputePeriod(batchOracle, disputePeriod, {from: random}),
        'Ownable: caller is not the owner',
      )
    })

    it('should set oracle locking period', async () => {
      await oracle.setDisputePeriod(batchOracle, disputePeriod, {from: owner})

      assert.equal(
        (await oracle.getOracleDisputePeriod(batchOracle)).toString(),
        disputePeriod.toString(),
        'oracle dispute period mismatch',
      )
    })

    it('should check if locking period is over when price timestmap equal to zero', async () => {
      const isOver = await oracle.isDisputePeriodOver(batchOracle, await time.latest(), {from: owner})
      const expectedResult = false
      assert.equal(isOver, expectedResult, 'dispute period check mismatch')
    })
  })
})
