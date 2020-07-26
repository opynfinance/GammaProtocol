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
        actionTester.testParseDepositAction(data),
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

      await expectRevert(actionTester.testParseDepositAction(data), 'Actions: cannot deposit to an invalid account')
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

      await actionTester.testParseDepositAction(data)

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

      await actionTester.testParseDepositAction(data)

      const depositArgs = await actionTester.getDepositArgs()
      assert.equal(depositArgs.owner, random)
      assert.equal(depositArgs.amount, new BN(amount))
      assert.equal(depositArgs.asset, asset)
      assert.equal(depositArgs.from, owner)
      assert.equal(depositArgs.vaultId, new BN(vaultId))
      assert.equal(depositArgs.index, new BN(index))
    })
  })

  describe('Parse Mint Arguments', () => {
    it('should not be able to parse a non Mint action', async () => {
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
        sender: owner,
        asset: asset,
        vaultId: vaultId,
        amount: amount,
        index: index,
        data: bytesArgs,
      }

      await expectRevert(actionTester.testParseMintAction(data), 'Actions: cannot mint from an invalid account')
    })
    it('should be able to parse arguments for a mint long action', async () => {
      const actionType = ActionType.MintShortOption
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

      await actionTester.testParseMintAction(data)

      const mintArgs = await actionTester.getMintArgs()
      assert.equal(mintArgs.owner, owner)
      assert.equal(mintArgs.amount, new BN(amount))
      assert.equal(mintArgs.otoken, asset)
      assert.equal(mintArgs.to, random)
      assert.equal(mintArgs.vaultId, new BN(vaultId))
      assert.equal(mintArgs.index, new BN(index))
    })
    it('should be able to parse arguments for a mint collateral action', async () => {
      const actionType = ActionType.MintShortOption
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
        sender: owner,
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
        sender: owner,
        asset: asset,
        vaultId: vaultId,
        amount: amount,
        index: index,
        data: bytesArgs,
      }

      await expectRevert(actionTester.testParseBurnAction(data), 'Actions: cannot burn from an invalid account')
    })
    it('should be able to parse arguments for a burn long action', async () => {
      const actionType = ActionType.BurnShortOption
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

      await actionTester.testParseBurnAction(data)

      const burnArgs = await actionTester.getBurnArgs()
      assert.equal(burnArgs.owner, owner)
      assert.equal(burnArgs.amount, new BN(amount))
      assert.equal(burnArgs.otoken, asset)
      assert.equal(burnArgs.from, random)
      assert.equal(burnArgs.vaultId, new BN(vaultId))
      assert.equal(burnArgs.index, new BN(index))
    })
    it('should be able to parse arguments for a burn collateral action', async () => {
      const actionType = ActionType.BurnShortOption
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
})
