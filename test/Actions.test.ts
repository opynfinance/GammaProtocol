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
      const data = {
        actionType: ActionType.OpenVault,
        owner: owner,
        sender: owner,
        asset: ZERO_ADDR,
        vaultId: '0',
        amount: '10',
        index: '0',
        data: ZERO_ADDR,
      }

      await expectRevert(
        actionTester.testParseDespositAction(data),
        'Actions: can only parse arguments for deposit actions',
      )
    })
    it('should not be able to parse an invalid sender address', async () => {
      const data = {
        actionType: ActionType.DepositCollateral,
        owner: ZERO_ADDR,
        sender: owner,
        asset: ZERO_ADDR,
        vaultId: '0',
        amount: '10',
        index: '0',
        data: ZERO_ADDR,
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

  describe('Parse Open Vault Arguments', () => {
    it('should not be able to parse a non Open Vault action', async () => {
      const data = {
        actionType: ActionType.DepositCollateral,
        owner: owner,
        sender: owner,
        asset: ZERO_ADDR,
        vaultId: '0',
        amount: '10',
        index: '0',
        data: ZERO_ADDR,
      }

      await expectRevert(
        actionTester.testParseOpenVaultAction(data),
        'Actions: can only parse arguments for open vault actions',
      )
    })
    it('should not be able to parse an invalid owner address', async () => {
      const actionType = ActionType.OpenVault
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

      await expectRevert(
        actionTester.testParseOpenVaultAction(data),
        'Actions: cannot open vault for an invalid account',
      )
    })
    it('should be able to parse arguments for an open vault action', async () => {
      const actionType = ActionType.OpenVault
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

      await actionTester.testParseOpenVaultAction(data)

      const depositArgs = await actionTester.getOpenVaultArgs()
      assert.equal(depositArgs.owner, owner)
    })
  })

  describe('Parse Exercise Arguments', () => {
    it('should not be able to parse a non Exercise action', async () => {
      const data = {
        actionType: ActionType.OpenVault,
        owner: owner,
        sender: owner,
        asset: ZERO_ADDR,
        vaultId: '0',
        amount: '10',
        index: '0',
        data: ZERO_ADDR,
      }

      await expectRevert(
        actionTester.testParseExerciseAction(data),
        'Actions: can only parse arguments for exercise actions',
      )
    })

    it('should be able to parse arguments for an exercise action', async () => {
      const actionType = ActionType.Exercise
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

      await actionTester.testParseExerciseAction(data)

      const depositArgs = await actionTester.getExerciseArgs()
      assert.equal(depositArgs.exerciser, random)
      assert.equal(depositArgs.otoken, asset)
      assert.equal(depositArgs.amount, new BN(amount))
    })
  })
})
