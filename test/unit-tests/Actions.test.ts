import { ethers, web3 } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import '@nomiclabs/hardhat-web3'
import { assert } from 'chai'

const { expectRevert } = require('@openzeppelin/test-helpers')

import { ActionTester } from '../../typechain'

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
  Liquidate,
}

describe('Deployment', function () {
  const ZERO_ADDR = '0x0000000000000000000000000000000000000000'
  let accounts: SignerWithAddress[] = []
  let owner: SignerWithAddress
  let random: SignerWithAddress
  let random2: SignerWithAddress
  let random3: SignerWithAddress
  let liquidator: SignerWithAddress

  // actionTester mock instance
  let actionTester: ActionTester

  this.beforeAll('Set accounts', async () => {
    accounts = await ethers.getSigners()

    const [_owner, _random, _random2, _random3, _liquidator] = accounts

    owner = _owner
    random = _random
    random2 = _random2
    random3 = _random3
    liquidator = _liquidator
  })

  this.beforeAll('Deployment', async () => {
    const actionTesterContract = await ethers.getContractFactory('ActionTester')
    const actionTesterDeployed = (await actionTesterContract.deploy()) as ActionTester
    actionTester = await actionTesterDeployed.deployed()
  })

  describe('Parse Deposit Arguments', () => {
    it('should not be able to parse a non Deposit action', async () => {
      const data = {
        actionType: ActionType.OpenVault,
        owner: owner.address,
        secondAddress: owner.address,
        asset: ZERO_ADDR,
        vaultId: '0',
        amount: '10',
        index: '0',
        data: ZERO_ADDR,
      }

      await expectRevert(actionTester.testParseDespositAction(data), 'A8')
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
        owner: owner.address,
        secondAddress: random.address,
        asset: asset,
        vaultId: vaultId,
        amount: amount,
        index: index,
        data: bytesArgs,
      }

      await actionTester.testParseDespositAction(data)
      const depositArgs = await actionTester.getDepositArgs()
      assert.equal(depositArgs.owner, owner.address)
      assert.equal(depositArgs.amount.toString(), ethers.BigNumber.from(amount).toString())
      assert.equal(depositArgs.asset, asset)
      assert.equal(depositArgs.from, random.address)
      assert.equal(depositArgs.vaultId.toString(), ethers.BigNumber.from(vaultId).toString())
      assert.equal(depositArgs.index.toString(), ethers.BigNumber.from(index).toString())
    })
  })

  describe('Parse Open Vault Arguments', () => {
    it('should not be able to parse a non Open Vault action', async () => {
      const data = {
        actionType: ActionType.DepositCollateral,
        owner: owner.address,
        secondAddress: owner.address,
        asset: ZERO_ADDR,
        vaultId: '0',
        amount: '10',
        index: '0',
        data: ZERO_ADDR,
      }

      await expectRevert(actionTester.testParseOpenVaultAction(data), 'A1')
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
        secondAddress: owner.address,
        asset: asset,
        vaultId: vaultId,
        amount: amount,
        index: index,
        data: bytesArgs,
      }

      await expectRevert(actionTester.testParseOpenVaultAction(data), 'A2')
    })
    it('should be able to parse arguments for an open vault action', async () => {
      const actionType = ActionType.OpenVault
      const asset = ZERO_ADDR
      const vaultId = '1'
      const amount = '10'
      const index = '0'
      const bytesArgs = web3.eth.abi.encodeParameter('uint256', 0)

      const data = {
        actionType: actionType,
        owner: owner.address,
        secondAddress: random.address,
        asset: asset,
        vaultId: vaultId,
        amount: amount,
        index: index,
        data: bytesArgs,
      }

      await actionTester.testParseOpenVaultAction(data)

      const depositArgs = await actionTester.getOpenVaultArgs()
      assert.equal(depositArgs.owner, owner.address)
      assert.equal(depositArgs.vaultType.toString(), ethers.BigNumber.from(0).toString())
    })
  })

  describe('Parse Redeem Arguments', () => {
    it('should not be able to parse a non Redeem action', async () => {
      const data = {
        actionType: ActionType.OpenVault,
        owner: owner.address,
        secondAddress: owner.address,
        asset: ZERO_ADDR,
        vaultId: '0',
        amount: '10',
        index: '0',
        data: ZERO_ADDR,
      }

      await expectRevert(actionTester.testParseRedeemAction(data), 'A13')
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
        owner: owner.address,
        secondAddress: random.address,
        asset: asset,
        vaultId: vaultId,
        amount: amount,
        index: index,
        data: bytesArgs,
      }

      await actionTester.testParseRedeemAction(data)

      const depositArgs = await actionTester.getRedeemArgs()
      assert.equal(depositArgs.receiver, random.address)
      assert.equal(depositArgs.otoken, asset)
      assert.equal(depositArgs.amount.toString(), ethers.BigNumber.from(amount).toString())
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
        owner: owner.address,
        secondAddress: owner.address,
        asset: asset,
        vaultId: vaultId,
        amount: amount,
        index: index,
        data: bytesArgs,
      }

      await expectRevert(actionTester.testParseSettleVaultAction(data), 'A15')
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
        secondAddress: owner.address,
        asset: asset,
        vaultId: vaultId,
        amount: amount,
        index: index,
        data: bytesArgs,
      }

      await expectRevert(actionTester.testParseSettleVaultAction(data), 'A16')
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
        owner: owner.address,
        secondAddress: random.address,
        asset: asset,
        vaultId: vaultId,
        amount: amount,
        index: index,
        data: bytesArgs,
      }

      await actionTester.testParseSettleVaultAction(data)

      const depositArgs = await actionTester.getSettleVaultArgs()
      assert.equal(depositArgs.owner, owner.address)
      assert.equal(depositArgs.to, random.address)
      assert.equal(depositArgs.vaultId.toString(), ethers.BigNumber.from(vaultId).toString())
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
        owner: owner.address,
        secondAddress: ZERO_ADDR,
        asset: asset,
        vaultId: vaultId,
        amount: amount,
        index: index,
        data: bytesArgs,
      }

      await expectRevert(actionTester.testParseSettleVaultAction(data), 'A17')
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
        owner: owner.address,
        secondAddress: owner.address,
        asset: asset,
        vaultId: vaultId,
        amount: amount,
        index: index,
        data: bytesArgs,
      }

      await expectRevert(actionTester.testParseWithdrawAction(data), 'A10')
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
        owner: owner.address,
        secondAddress: ZERO_ADDR,
        asset: asset,
        vaultId: vaultId,
        amount: amount,
        index: index,
        data: bytesArgs,
      }

      await expectRevert(actionTester.testParseWithdrawAction(data), 'A12')
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
        secondAddress: owner.address,
        asset: asset,
        vaultId: vaultId,
        amount: amount,
        index: index,
        data: bytesArgs,
      }

      await expectRevert(actionTester.testParseWithdrawAction(data), 'A11')
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
        owner: owner.address,
        secondAddress: random.address,
        asset: asset,
        vaultId: vaultId,
        amount: amount,
        index: index,
        data: bytesArgs,
      }

      await actionTester.testParseWithdrawAction(data)

      const depositArgs = await actionTester.getWithdrawArgs()
      assert.equal(depositArgs.owner, owner.address)
      assert.equal(depositArgs.amount.toString(), ethers.BigNumber.from(amount).toString())
      assert.equal(depositArgs.asset, asset)
      assert.equal(depositArgs.to, random.address)
      assert.equal(depositArgs.vaultId.toString(), ethers.BigNumber.from(vaultId).toString())
      assert.equal(depositArgs.index.toString(), ethers.BigNumber.from(index).toString())
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
        owner: random.address,
        secondAddress: owner.address,
        asset: asset,
        vaultId: vaultId,
        amount: amount,
        index: index,
        data: bytesArgs,
      }

      await actionTester.testParseWithdrawAction(data)

      const depositArgs = await actionTester.getWithdrawArgs()
      assert.equal(depositArgs.owner, random.address)
      assert.equal(depositArgs.amount.toString(), ethers.BigNumber.from(amount).toString())
      assert.equal(depositArgs.asset, asset)
      assert.equal(depositArgs.to, owner.address)
      assert.equal(depositArgs.vaultId.toString(), ethers.BigNumber.from(vaultId).toString())
      assert.equal(depositArgs.index.toString(), ethers.BigNumber.from(index).toString())
    })
  })

  describe('Parse Mint Arguments', () => {
    it('should not be able to parse a non Mint action', async () => {
      const data = {
        actionType: ActionType.OpenVault,
        owner: ZERO_ADDR,
        secondAddress: owner.address,
        asset: ZERO_ADDR,
        vaultId: '0',
        amount: '10',
        index: '0',
        data: ZERO_ADDR,
      }

      await expectRevert(actionTester.testParseMintAction(data), 'A4')
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
        secondAddress: owner.address,
        asset: asset,
        vaultId: vaultId,
        amount: amount,
        index: index,
        data: bytesArgs,
      }

      await expectRevert(actionTester.testParseMintAction(data), 'A5')
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
        owner: owner.address,
        secondAddress: random.address,
        asset: asset,
        vaultId: vaultId,
        amount: amount,
        index: index,
        data: bytesArgs,
      }

      await actionTester.testParseMintAction(data)

      const mintArgs = await actionTester.getMintArgs()
      assert.equal(mintArgs.owner, owner.address)
      assert.equal(mintArgs.amount.toString(), ethers.BigNumber.from(amount).toString())
      assert.equal(mintArgs.otoken, asset)
      assert.equal(mintArgs.to, random.address)
      assert.equal(mintArgs.vaultId.toString(), ethers.BigNumber.from(vaultId).toString())
      assert.equal(mintArgs.index.toString(), ethers.BigNumber.from(index).toString())
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
        owner: random.address,
        secondAddress: owner.address,
        asset: asset,
        vaultId: vaultId,
        amount: amount,
        index: index,
        data: bytesArgs,
      }

      await actionTester.testParseMintAction(data)

      const mintArgs = await actionTester.getMintArgs()
      assert.equal(mintArgs.owner, random.address)
      assert.equal(mintArgs.amount.toString(), ethers.BigNumber.from(amount).toString())
      assert.equal(mintArgs.otoken, asset)
      assert.equal(mintArgs.to, owner.address)
      assert.equal(mintArgs.vaultId.toString(), ethers.BigNumber.from(vaultId).toString())
      assert.equal(mintArgs.index.toString(), ethers.BigNumber.from(index).toString())
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
        owner: owner.address,
        secondAddress: owner.address,
        asset: asset,
        vaultId: vaultId,
        amount: amount,
        index: index,
        data: bytesArgs,
      }

      await expectRevert(actionTester.testParseBurnAction(data), 'A6')
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
        secondAddress: owner.address,
        asset: asset,
        vaultId: vaultId,
        amount: amount,
        index: index,
        data: bytesArgs,
      }

      await expectRevert(actionTester.testParseBurnAction(data), 'A7')
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
        owner: owner.address,
        secondAddress: random.address,
        asset: asset,
        vaultId: vaultId,
        amount: amount,
        index: index,
        data: bytesArgs,
      }

      await actionTester.testParseBurnAction(data)

      const burnArgs = await actionTester.getBurnArgs();
      assert.equal(burnArgs.owner, owner.address)
      assert.equal(burnArgs.amount.toString(), ethers.BigNumber.from(amount).toString())
      assert.equal(burnArgs.otoken, asset)
      assert.equal(burnArgs.from, random.address)
      assert.equal(burnArgs.vaultId.toString(), ethers.BigNumber.from(vaultId).toString())
      assert.equal(burnArgs.index.toString(), ethers.BigNumber.from(index).toString())
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
        owner: random.address,
        secondAddress: owner.address,
        asset: asset,
        vaultId: vaultId,
        amount: amount,
        index: index,
        data: bytesArgs,
      }

      await actionTester.testParseBurnAction(data)

      const burnArgs = await actionTester.getBurnArgs()
      assert.equal(burnArgs.owner, random.address)
      assert.equal(burnArgs.amount.toString(), ethers.BigNumber.from(amount).toString())
      assert.equal(burnArgs.otoken, asset)
      assert.equal(burnArgs.from, owner.address)
      assert.equal(burnArgs.vaultId.toString(), ethers.BigNumber.from(vaultId).toString())
      assert.equal(burnArgs.index.toString(), ethers.BigNumber.from(index).toString())
    })
  })

  describe('Parse Call Arguments', () => {
    it('should not be able to parse a non Call action', async () => {
      const data = {
        actionType: ActionType.OpenVault,
        owner: owner.address,
        secondAddress: owner.address,
        data: random.address,
        asset: ZERO_ADDR,
        vaultId: 0,
        amount: 0,
        index: 0,
      }

      await expectRevert(actionTester.testParseCallAction(data), 'A22')
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

      await expectRevert(actionTester.testParseCallAction(data), 'A23')
    })
    it('should be able to parse arguments for a call action', async () => {
      const data = {
        actionType: ActionType.Call,
        owner: random.address,
        secondAddress: random2.address,
        data: random3.address,
        asset: ZERO_ADDR,
        vaultId: 0,
        amount: 0,
        index: 0,
      }

      await actionTester.testParseCallAction(data)

      const callArgs = await actionTester.getCallArgs()
      assert.equal(callArgs.callee, random2.address)
      assert.equal(callArgs.data.toLowerCase(), random3.address.toLowerCase())
    })
  })
})
