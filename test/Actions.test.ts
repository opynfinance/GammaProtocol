import {ActionTesterInstance} from '../build/types/truffle-types'

const {BN, expectRevert} = require('@openzeppelin/test-helpers')

const ActionTester = artifacts.require('ActionTester.sol')

contract('Actions', ([owner, random]) => {
  // actionTester mock instance
  let actionTester: ActionTesterInstance
  enum ActionType {
    OpenVault,
    MintShortOption,
    BurnShortOption,
    DepositLongOption,
    WithdrawLongOption,
    DepositCollateral,
    WithdrawCollateral,
    SettleVault,
    Exercise,
    Call,
  }
  const ZERO_ADDR = '0x0000000000000000000000000000000000000000'

  before('Deployment', async () => {
    actionTester = await ActionTester.new({from: owner})
  })

  describe('Parse Deposit Arguments', () => {
    it('should not be able to parse a non Deposit action', async () => {
      const actionType = ActionType.OpenVault
      const asset = ZERO_ADDR
      const vaultId = '0'
      const amount = '10'
      const index = '0'
      const bytesArgs = ZERO_ADDR

      const data = {
        actionType: actionType,
        owner: owner,
        sender: owner,
        asset: asset,
        vaultId: vaultId,
        amount: amount,
        index: index,
        data: bytesArgs,
      }

      await expectRevert(
        actionTester.testParseDespositAction(data),
        'Actions: can only parse arguments for deposit actions',
      )
    })
    it('should not be able to parse an invalid sender address', async () => {
      const actionType = ActionType.DepositCollateral
      const asset = ZERO_ADDR
      const vaultId = '0'
      const amount = '10'
      const index = '0'
      const bytesArgs = ZERO_ADDR

      const data = {
        actionType: actionType,
        owner: ZERO_ADDR,
        sender: owner,
        asset: asset,
        vaultId: vaultId,
        amount: amount,
        index: index,
        data: bytesArgs,
      }

      await expectRevert(actionTester.testParseDespositAction(data), 'Actions: cannot deposit to an invalid account')
    })
    it('should be able to parse arguments for a deposit long action', async () => {
      const actionType = ActionType.DepositLongOption
      const asset = ZERO_ADDR
      const vaultId = '1'
      const amount = '10'
      const index = '0'
      const bytesArgs = ZERO_ADDR

      const data = {
        actionType: actionType,
        owner: owner,
        sender: random,
        asset: asset,
        vaultId: vaultId,
        amount: amount,
        index: index,
        data: bytesArgs,
      }

      await actionTester.testParseDespositAction(data)

      const depositArgs = await actionTester.getDepositArgs()
      assert.equal(depositArgs.owner, owner)
      assert.equal(depositArgs.amount, new BN(amount))
      assert.equal(depositArgs.asset, asset)
      assert.equal(depositArgs.from, random)
      assert.equal(depositArgs.vaultId, new BN(vaultId))
      assert.equal(depositArgs.index, new BN(index))
    })
    it('should be able to parse arguments for a deposit collateral action', async () => {
      const actionType = ActionType.DepositCollateral
      const asset = ZERO_ADDR
      const vaultId = '3'
      const amount = '10'
      const index = '0'
      const bytesArgs = ZERO_ADDR

      const data = {
        actionType: actionType,
        owner: random,
        sender: owner,
        asset: asset,
        vaultId: vaultId,
        amount: amount,
        index: index,
        data: bytesArgs,
      }

      await actionTester.testParseDespositAction(data)

      const depositArgs = await actionTester.getDepositArgs()
      assert.equal(depositArgs.owner, random)
      assert.equal(depositArgs.amount, new BN(amount))
      assert.equal(depositArgs.asset, asset)
      assert.equal(depositArgs.from, owner)
      assert.equal(depositArgs.vaultId, new BN(vaultId))
      assert.equal(depositArgs.index, new BN(index))
    })
  })
  describe('Parse Withdraw Arguments', () => {
    it('should not be able to parse a non withdraw action', async () => {
      const actionType = ActionType.OpenVault
      const asset = ZERO_ADDR
      const vaultId = '0'
      const amount = '10'
      const index = '0'
      const bytesArgs = ZERO_ADDR

      const data = {
        actionType: actionType,
        owner: owner,
        sender: owner,
        asset: asset,
        vaultId: vaultId,
        amount: amount,
        index: index,
        data: bytesArgs,
      }

      await expectRevert(
        actionTester.testParseWithdrawAction(data),
        'Actions: can only parse arguments for withdraw actions',
      )
    })
    it('should not be able to parse an invalid sender address', async () => {
      const actionType = ActionType.WithdrawCollateral
      const asset = ZERO_ADDR
      const vaultId = '0'
      const amount = '10'
      const index = '0'
      const bytesArgs = ZERO_ADDR

      const data = {
        actionType: actionType,
        owner: owner,
        sender: ZERO_ADDR,
        asset: asset,
        vaultId: vaultId,
        amount: amount,
        index: index,
        data: bytesArgs,
      }

      await expectRevert(actionTester.testParseWithdrawAction(data), 'Actions: cannot withdraw to an invalid account')
    })
    it('should not be able to parse an invalid owner address', async () => {
      const actionType = ActionType.WithdrawCollateral
      const asset = ZERO_ADDR
      const vaultId = '0'
      const amount = '10'
      const index = '0'
      const bytesArgs = ZERO_ADDR

      const data = {
        actionType: actionType,
        owner: ZERO_ADDR,
        sender: owner,
        asset: asset,
        vaultId: vaultId,
        amount: amount,
        index: index,
        data: bytesArgs,
      }

      await expectRevert(actionTester.testParseWithdrawAction(data), 'Actions: cannot withdraw from an invalid account')
    })
    it('should be able to parse arguments for a withdraw long action', async () => {
      const actionType = ActionType.WithdrawLongOption
      const asset = ZERO_ADDR
      const vaultId = '1'
      const amount = '10'
      const index = '0'
      const bytesArgs = ZERO_ADDR

      const data = {
        actionType: actionType,
        owner: owner,
        sender: random,
        asset: asset,
        vaultId: vaultId,
        amount: amount,
        index: index,
        data: bytesArgs,
      }

      await actionTester.testParseWithdrawAction(data)

      const depositArgs = await actionTester.getWithdrawArgs()
      assert.equal(depositArgs.owner, owner)
      assert.equal(depositArgs.amount, new BN(amount))
      assert.equal(depositArgs.asset, asset)
      assert.equal(depositArgs.to, random)
      assert.equal(depositArgs.vaultId, new BN(vaultId))
      assert.equal(depositArgs.index, new BN(index))
    })
    it('should be able to parse arguments for a deposit collateral action', async () => {
      const actionType = ActionType.WithdrawCollateral
      const asset = ZERO_ADDR
      const vaultId = '3'
      const amount = '10'
      const index = '0'
      const bytesArgs = ZERO_ADDR

      const data = {
        actionType: actionType,
        owner: random,
        sender: owner,
        asset: asset,
        vaultId: vaultId,
        amount: amount,
        index: index,
        data: bytesArgs,
      }

      await actionTester.testParseWithdrawAction(data)

      const depositArgs = await actionTester.getWithdrawArgs()
      assert.equal(depositArgs.owner, random)
      assert.equal(depositArgs.amount, new BN(amount))
      assert.equal(depositArgs.asset, asset)
      assert.equal(depositArgs.to, owner)
      assert.equal(depositArgs.vaultId, new BN(vaultId))
      assert.equal(depositArgs.index, new BN(index))
    })
  })
})
