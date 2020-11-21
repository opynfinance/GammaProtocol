import {ActionTesterInstance} from '../../build/types/truffle-types'

const {BN, expectRevert} = require('@openzeppelin/test-helpers')

const ActionTester = artifacts.require('ActionTester.sol')

contract('Actions', ([owner, random, random2, random3]) => {
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
    Redeem,
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
        secondAddress: owner,
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
        secondAddress: owner,
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
        secondAddress: random,
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
        secondAddress: owner,
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
        secondAddress: owner,
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
        secondAddress: owner,
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
        secondAddress: random,
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

  describe('Parse Redeem Arguments', () => {
    it('should not be able to parse a non Redeem action', async () => {
      const data = {
        actionType: ActionType.OpenVault,
        owner: owner,
        secondAddress: owner,
        asset: ZERO_ADDR,
        vaultId: '0',
        amount: '10',
        index: '0',
        data: ZERO_ADDR,
      }

      await expectRevert(
        actionTester.testParseRedeemAction(data),
        'Actions: can only parse arguments for redeem actions',
      )
    })

    it('should be able to parse arguments for an redeem action', async () => {
      const actionType = ActionType.Redeem
      const asset = ZERO_ADDR
      const vaultId = '1'
      const amount = '10'
      const index = '0'
      const bytesArgs = ZERO_ADDR

      const data = {
        actionType: actionType,
        owner: owner,
        secondAddress: random,
        asset: asset,
        vaultId: vaultId,
        amount: amount,
        index: index,
        data: bytesArgs,
      }

      await actionTester.testParseRedeemAction(data)

      const depositArgs = await actionTester.getRedeemArgs()
      assert.equal(depositArgs.receiver, random)
      assert.equal(depositArgs.otoken, asset)
      assert.equal(depositArgs.amount, new BN(amount))
    })
  })

  describe('Parse Settle Vault Arguments', () => {
    it('should not be able to parse a non Settle Vault action', async () => {
      const actionType = ActionType.OpenVault
      const asset = ZERO_ADDR
      const vaultId = '0'
      const amount = '10'
      const index = '0'
      const bytesArgs = ZERO_ADDR

      const data = {
        actionType: actionType,
        owner: owner,
        secondAddress: owner,
        asset: asset,
        vaultId: vaultId,
        amount: amount,
        index: index,
        data: bytesArgs,
      }

      await expectRevert(
        actionTester.testParseSettleVaultAction(data),
        'Actions: can only parse arguments for settle vault actions',
      )
    })
    it('should not be able to parse an invalid owner address', async () => {
      const actionType = ActionType.SettleVault
      const asset = ZERO_ADDR
      const vaultId = '0'
      const amount = '10'
      const index = '0'
      const bytesArgs = ZERO_ADDR

      const data = {
        actionType: actionType,
        owner: ZERO_ADDR,
        secondAddress: owner,
        asset: asset,
        vaultId: vaultId,
        amount: amount,
        index: index,
        data: bytesArgs,
      }

      await expectRevert(
        actionTester.testParseSettleVaultAction(data),
        'Actions: cannot settle vault for an invalid account',
      )
    })
    it('should be able to parse arguments for a settle vault action', async () => {
      const actionType = ActionType.SettleVault
      const asset = ZERO_ADDR
      const vaultId = '1'
      const amount = '10'
      const index = '0'
      const bytesArgs = ZERO_ADDR

      const data = {
        actionType: actionType,
        owner: owner,
        secondAddress: random,
        asset: asset,
        vaultId: vaultId,
        amount: amount,
        index: index,
        data: bytesArgs,
      }

      await actionTester.testParseSettleVaultAction(data)

      const depositArgs = await actionTester.getSettleVaultArgs()
      assert.equal(depositArgs.owner, owner)
      assert.equal(depositArgs.to, random)
      assert.equal(depositArgs.vaultId, new BN(vaultId))
    })
    it('should not be able to parse an invalid sender address', async () => {
      const actionType = ActionType.SettleVault
      const asset = ZERO_ADDR
      const vaultId = '0'
      const amount = '10'
      const index = '0'
      const bytesArgs = ZERO_ADDR

      const data = {
        actionType: actionType,
        owner: owner,
        secondAddress: ZERO_ADDR,
        asset: asset,
        vaultId: vaultId,
        amount: amount,
        index: index,
        data: bytesArgs,
      }

      await expectRevert(
        actionTester.testParseSettleVaultAction(data),
        'Actions: cannot withdraw payout to an invalid account',
      )
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
        secondAddress: owner,
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
        secondAddress: ZERO_ADDR,
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
        secondAddress: owner,
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
        secondAddress: random,
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
    it('should be able to parse arguments for a withdraw collateral action', async () => {
      const actionType = ActionType.WithdrawCollateral
      const asset = ZERO_ADDR
      const vaultId = '3'
      const amount = '10'
      const index = '0'
      const bytesArgs = ZERO_ADDR

      const data = {
        actionType: actionType,
        owner: random,
        secondAddress: owner,
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

  describe('Parse Mint Arguments', () => {
    it('should not be able to parse a non Mint action', async () => {
      const data = {
        actionType: ActionType.OpenVault,
        owner: ZERO_ADDR,
        secondAddress: owner,
        asset: ZERO_ADDR,
        vaultId: '0',
        amount: '10',
        index: '0',
        data: ZERO_ADDR,
      }

      await expectRevert(actionTester.testParseMintAction(data), 'Actions: can only parse arguments for mint actions')
    })
    it('should not be able to parse an invalid sender address', async () => {
      const actionType = ActionType.MintShortOption
      const asset = ZERO_ADDR
      const vaultId = '0'
      const amount = '10'
      const index = '0'
      const bytesArgs = ZERO_ADDR

      const data = {
        actionType: actionType,
        owner: ZERO_ADDR,
        secondAddress: owner,
        asset: asset,
        vaultId: vaultId,
        amount: amount,
        index: index,
        data: bytesArgs,
      }

      await expectRevert(actionTester.testParseMintAction(data), 'Actions: cannot mint from an invalid account')
    })
    it('should be able to parse arguments for a mint short action', async () => {
      const actionType = ActionType.MintShortOption
      const asset = ZERO_ADDR
      const vaultId = '1'
      const amount = '10'
      const index = '0'
      const bytesArgs = ZERO_ADDR

      const data = {
        actionType: actionType,
        owner: owner,
        secondAddress: random,
        asset: asset,
        vaultId: vaultId,
        amount: amount,
        index: index,
        data: bytesArgs,
      }

      await actionTester.testParseMintAction(data)

      const mintArgs = await actionTester.getMintArgs()
      assert.equal(mintArgs.owner, owner)
      assert.equal(mintArgs.amount, new BN(amount))
      assert.equal(mintArgs.otoken, asset)
      assert.equal(mintArgs.to, random)
      assert.equal(mintArgs.vaultId, new BN(vaultId))
      assert.equal(mintArgs.index, new BN(index))
    })
    it('should be able to parse arguments for a mint short action', async () => {
      const actionType = ActionType.MintShortOption
      const asset = ZERO_ADDR
      const vaultId = '3'
      const amount = '10'
      const index = '0'
      const bytesArgs = ZERO_ADDR

      const data = {
        actionType: actionType,
        owner: random,
        secondAddress: owner,
        asset: asset,
        vaultId: vaultId,
        amount: amount,
        index: index,
        data: bytesArgs,
      }

      await actionTester.testParseMintAction(data)

      const mintArgs = await actionTester.getMintArgs()
      assert.equal(mintArgs.owner, random)
      assert.equal(mintArgs.amount, new BN(amount))
      assert.equal(mintArgs.otoken, asset)
      assert.equal(mintArgs.to, owner)
      assert.equal(mintArgs.vaultId, new BN(vaultId))
      assert.equal(mintArgs.index, new BN(index))
    })
  })

  describe('Parse Burn Arguments', () => {
    it('should not be able to parse a non Burn action', async () => {
      const actionType = ActionType.OpenVault
      const asset = ZERO_ADDR
      const vaultId = '0'
      const amount = '10'
      const index = '0'
      const bytesArgs = ZERO_ADDR

      const data = {
        actionType: actionType,
        owner: owner,
        secondAddress: owner,
        asset: asset,
        vaultId: vaultId,
        amount: amount,
        index: index,
        data: bytesArgs,
      }

      await expectRevert(actionTester.testParseBurnAction(data), 'Actions: can only parse arguments for burn actions')
    })
    it('should not be able to parse an invalid sender address', async () => {
      const actionType = ActionType.BurnShortOption
      const asset = ZERO_ADDR
      const vaultId = '0'
      const amount = '10'
      const index = '0'
      const bytesArgs = ZERO_ADDR

      const data = {
        actionType: actionType,
        owner: ZERO_ADDR,
        secondAddress: owner,
        asset: asset,
        vaultId: vaultId,
        amount: amount,
        index: index,
        data: bytesArgs,
      }

      await expectRevert(actionTester.testParseBurnAction(data), 'Actions: cannot burn from an invalid account')
    })
    it('should be able to parse arguments for a burn short action', async () => {
      const actionType = ActionType.BurnShortOption
      const asset = ZERO_ADDR
      const vaultId = '1'
      const amount = '10'
      const index = '0'
      const bytesArgs = ZERO_ADDR

      const data = {
        actionType: actionType,
        owner: owner,
        secondAddress: random,
        asset: asset,
        vaultId: vaultId,
        amount: amount,
        index: index,
        data: bytesArgs,
      }

      await actionTester.testParseBurnAction(data)

      const burnArgs = await actionTester.getBurnArgs()
      assert.equal(burnArgs.owner, owner)
      assert.equal(burnArgs.amount, new BN(amount))
      assert.equal(burnArgs.otoken, asset)
      assert.equal(burnArgs.from, random)
      assert.equal(burnArgs.vaultId, new BN(vaultId))
      assert.equal(burnArgs.index, new BN(index))
    })
    it('should be able to parse arguments for a burn short action', async () => {
      const actionType = ActionType.BurnShortOption
      const asset = ZERO_ADDR
      const vaultId = '3'
      const amount = '10'
      const index = '0'
      const bytesArgs = ZERO_ADDR

      const data = {
        actionType: actionType,
        owner: random,
        secondAddress: owner,
        asset: asset,
        vaultId: vaultId,
        amount: amount,
        index: index,
        data: bytesArgs,
      }

      await actionTester.testParseBurnAction(data)

      const burnArgs = await actionTester.getBurnArgs()
      assert.equal(burnArgs.owner, random)
      assert.equal(burnArgs.amount, new BN(amount))
      assert.equal(burnArgs.otoken, asset)
      assert.equal(burnArgs.from, owner)
      assert.equal(burnArgs.vaultId, new BN(vaultId))
      assert.equal(burnArgs.index, new BN(index))
    })
  })

  describe('Parse Call Arguments', () => {
    it('should not be able to parse a non Call action', async () => {
      const data = {
        actionType: ActionType.OpenVault,
        owner: owner,
        secondAddress: owner,
        data: random,
        asset: ZERO_ADDR,
        vaultId: 0,
        amount: 0,
        index: 0,
      }

      await expectRevert(actionTester.testParseCallAction(data), 'Actions: can only parse arguments for call actions')
    })
    it('should not be able to parse an invalid sender address (call target address)', async () => {
      const data = {
        actionType: ActionType.Call,
        owner: ZERO_ADDR,
        secondAddress: ZERO_ADDR,
        data: ZERO_ADDR,
        asset: ZERO_ADDR,
        vaultId: 0,
        amount: 0,
        index: 0,
      }

      await expectRevert(actionTester.testParseCallAction(data), 'Actions: target address cannot be address(0)')
    })
    it('should be able to parse arguments for a call action', async () => {
      const data = {
        actionType: ActionType.Call,
        owner: random,
        secondAddress: random2,
        data: random3,
        asset: ZERO_ADDR,
        vaultId: 0,
        amount: 0,
        index: 0,
      }

      await actionTester.testParseCallAction(data)

      const callArgs = await actionTester.getCallArgs()
      assert.equal(callArgs.callee, random2)
      assert.equal(callArgs.data.toLowerCase(), random3.toLowerCase())
    })
  })
})
