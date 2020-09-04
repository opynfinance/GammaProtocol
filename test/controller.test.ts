import {
  MockMarginCalculatorInstance,
  MockOtokenInstance,
  MockERC20Instance,
  MockOracleInstance,
  MockAddressBookInstance,
  MockWhitelistModuleInstance,
  MarginPoolInstance,
  ControllerInstance,
} from '../build/types/truffle-types'
import BigNumber from 'bignumber.js'

const {expectRevert, time} = require('@openzeppelin/test-helpers')

const MockERC20 = artifacts.require('MockERC20.sol')
const MockOtoken = artifacts.require('MockOtoken.sol')
const MockOracle = artifacts.require('MockOracle.sol')
const MockMarginCalculator = artifacts.require('MockMarginCalculator.sol')
const MockWhitelistModule = artifacts.require('MockWhitelistModule.sol')
const MockAddressBook = artifacts.require('MockAddressBook.sol')
const MarginPool = artifacts.require('MarginPool.sol')
const Controller = artifacts.require('Controller.sol')

// address(0)
const ZERO_ADDR = '0x0000000000000000000000000000000000000000'

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

contract('Controller', ([owner, accountOwner1, accountOperator1, random]) => {
  // ERC20 mock
  let usdc: MockERC20Instance
  let weth: MockERC20Instance
  // Otoken mock
  let otoken: MockOtokenInstance
  // Oracle module
  let oracle: MockOracleInstance
  // calculator module
  let calculator: MockMarginCalculatorInstance
  // margin pool module
  let marginPool: MarginPoolInstance
  // whitelist module mock
  let whitelist: MockWhitelistModuleInstance
  // addressbook module mock
  let addressBook: MockAddressBookInstance
  // controller module
  let controller: ControllerInstance

  before('Deployment', async () => {
    // ERC20 deployment
    usdc = await MockERC20.new('USDC', 'USDC', 8)
    weth = await MockERC20.new('WETH', 'WETH', 18)
    // Otoken deployment
    otoken = await MockOtoken.new()
    // addressbook deployment
    addressBook = await MockAddressBook.new()
    // init otoken
    await otoken.init(
      addressBook.address,
      weth.address,
      usdc.address,
      usdc.address,
      new BigNumber(200).times(new BigNumber(10).exponentiatedBy(18)),
      1753776000, // 07/29/2025 @ 8:00am (UTC)
      true,
    )

    // deploy Oracle module
    oracle = await MockOracle.new(addressBook.address, {from: owner})
    // calculator deployment
    calculator = await MockMarginCalculator.new()
    // margin pool deployment
    marginPool = await MarginPool.new(addressBook.address)
    // whitelist module
    whitelist = await MockWhitelistModule.new()
    // set margin pool in addressbook
    await addressBook.setMarginPool(marginPool.address)
    // set calculator in addressbook
    await addressBook.setMarginCalculator(calculator.address)
    // set oracle in AddressBook
    await addressBook.setOracle(oracle.address)
    // set whitelist module address
    await addressBook.setWhitelist(whitelist.address)
    // deploy Controller module
    controller = await Controller.new(addressBook.address)
    // set controller address in AddressBook
    await addressBook.setController(controller.address, {from: owner})

    assert.equal(await controller.systemPaused(), false, 'System is paused')

    // make everyone rich
    await usdc.mint(accountOwner1, new BigNumber('1000'))
    await usdc.mint(accountOperator1, new BigNumber('1000'))
    await usdc.mint(random, new BigNumber('1000'))
  })

  describe('Controller initialization', () => {
    it('should revert if initilized with 0 addressBook address', async () => {
      await expectRevert(Controller.new(ZERO_ADDR), 'Invalid address book')
    })
  })

  describe('Account operator', () => {
    it('should set operator', async () => {
      assert.equal(
        await controller.isOperator(accountOwner1, accountOperator1),
        false,
        'Address is already an operator',
      )

      await controller.setOperator(accountOperator1, true, {from: accountOwner1})

      assert.equal(await controller.isOperator(accountOwner1, accountOperator1), true, 'Operator address mismatch')
    })

    it('should be able to remove operator', async () => {
      await controller.setOperator(accountOperator1, false, {from: accountOwner1})

      assert.equal(await controller.isOperator(accountOwner1, accountOperator1), false, 'Operator address mismatch')
    })
  })

  describe('Vault', () => {
    // will be improved in later PR
    it('should get vault', async () => {
      const vaultId = new BigNumber(0)
      await controller.getVault(accountOwner1, vaultId)
    })

    // will be improved in later PR
    it('should get vault balance', async () => {
      const vaultId = new BigNumber(0)
      await controller.getVaultBalances(accountOwner1, vaultId)
    })
  })

  describe('Open vault', () => {
    it('should revert opening a vault an an account from random address', async () => {
      const actionArgs = [
        {
          actionType: ActionType.OpenVault,
          owner: accountOwner1,
          sender: random,
          asset: ZERO_ADDR,
          vaultId: '1',
          amount: '0',
          index: '0',
          data: ZERO_ADDR,
        },
      ]
      await expectRevert(
        controller.operate(actionArgs, {from: random}),
        'Controller: msg.sender is not authorized to run action',
      )
    })

    it('should revert opening a vault a vault with id equal to zero', async () => {
      const actionArgs = [
        {
          actionType: ActionType.OpenVault,
          owner: accountOwner1,
          sender: accountOwner1,
          asset: ZERO_ADDR,
          vaultId: '0',
          amount: '0',
          index: '0',
          data: ZERO_ADDR,
        },
      ]
      await expectRevert(
        controller.operate(actionArgs, {from: accountOwner1}),
        'Controller: can not run actions on inexistent vault',
      )
    })

    it('should revert opening multiple vaults in the same operate call', async () => {
      const actionArgs = [
        {
          actionType: ActionType.OpenVault,
          owner: accountOwner1,
          sender: accountOwner1,
          asset: ZERO_ADDR,
          vaultId: '1',
          amount: '0',
          index: '0',
          data: ZERO_ADDR,
        },
        {
          actionType: ActionType.OpenVault,
          owner: accountOwner1,
          sender: accountOwner1,
          asset: ZERO_ADDR,
          vaultId: '2',
          amount: '0',
          index: '0',
          data: ZERO_ADDR,
        },
      ]

      await expectRevert(
        controller.operate(actionArgs, {from: accountOwner1}),
        'Controller: can not run actions on different vaults',
      )
    })

    it('should open vault', async () => {
      const vaultCounterBefore = new BigNumber(await controller.getAccountVaultCounter(accountOwner1))
      assert.equal(vaultCounterBefore.toString(), '0', 'vault counter before mismatch')

      const actionArgs = [
        {
          actionType: ActionType.OpenVault,
          owner: accountOwner1,
          sender: accountOwner1,
          asset: ZERO_ADDR,
          vaultId: vaultCounterBefore.toNumber() + 1,
          amount: '0',
          index: '0',
          data: ZERO_ADDR,
        },
      ]
      await controller.operate(actionArgs, {from: accountOwner1})

      const vaultCounterAfter = new BigNumber(await controller.getAccountVaultCounter(accountOwner1))
      assert.equal(vaultCounterAfter.minus(vaultCounterBefore).toString(), '1', 'vault counter after mismatch')
    })

    it('should open vault from account operator', async () => {
      await controller.setOperator(accountOperator1, true, {from: accountOwner1})
      assert.equal(await controller.isOperator(accountOwner1, accountOperator1), true, 'Operator address mismatch')

      const vaultCounterBefore = new BigNumber(await controller.getAccountVaultCounter(accountOwner1))

      const actionArgs = [
        {
          actionType: ActionType.OpenVault,
          owner: accountOwner1,
          sender: accountOperator1,
          asset: ZERO_ADDR,
          vaultId: vaultCounterBefore.toNumber() + 1,
          amount: '0',
          index: '0',
          data: ZERO_ADDR,
        },
      ]
      await controller.operate(actionArgs, {from: accountOperator1})

      const vaultCounterAfter = new BigNumber(await controller.getAccountVaultCounter(accountOwner1))
      assert.equal(vaultCounterAfter.minus(vaultCounterBefore).toString(), '1', 'vault counter after mismatch')
    })
  })

  describe('Long otoken', () => {
    let longOtoken: MockOtokenInstance

    before(async () => {
      const expiryTime = new BigNumber(60 * 60 * 24) // after 1 day

      longOtoken = await MockOtoken.new()
      // init otoken
      await longOtoken.init(
        addressBook.address,
        weth.address,
        usdc.address,
        usdc.address,
        new BigNumber(200).times(new BigNumber(10).exponentiatedBy(18)),
        new BigNumber(await time.latest()).plus(expiryTime),
        true,
      )

      await longOtoken.mintOtoken(accountOwner1, new BigNumber('100'))
      await longOtoken.mintOtoken(accountOperator1, new BigNumber('100'))
    })

    describe('deposit long otoken', () => {
      it('should revert depositing a non-whitelisted long otoken into vault', async () => {
        const vaultCounter = new BigNumber(await controller.getAccountVaultCounter(accountOwner1))
        const collateralToDeposit = new BigNumber('20')
        const actionArgs = [
          {
            actionType: ActionType.DepositLongOption,
            owner: accountOwner1,
            sender: accountOwner1,
            asset: longOtoken.address,
            vaultId: vaultCounter.toNumber(),
            amount: collateralToDeposit.toNumber(),
            index: '0',
            data: ZERO_ADDR,
          },
        ]

        await longOtoken.approve(marginPool.address, collateralToDeposit, {from: accountOwner1})
        await expectRevert(
          controller.operate(actionArgs, {from: accountOwner1}),
          'Controller: otoken is not whitelisted to be used as collateral',
        )
      })

      it('should deposit long otoken into vault from account owner', async () => {
        // whitelist otoken
        await whitelist.whitelistOtoken(longOtoken.address)

        const vaultCounter = new BigNumber(await controller.getAccountVaultCounter(accountOwner1))
        const collateralToDeposit = new BigNumber('20')
        const actionArgs = [
          {
            actionType: ActionType.DepositLongOption,
            owner: accountOwner1,
            sender: accountOwner1,
            asset: longOtoken.address,
            vaultId: vaultCounter.toNumber(),
            amount: collateralToDeposit.toNumber(),
            index: '0',
            data: ZERO_ADDR,
          },
        ]
        const marginPoolBalanceBefore = new BigNumber(await longOtoken.balanceOf(marginPool.address))
        const senderBalanceBefore = new BigNumber(await longOtoken.balanceOf(accountOwner1))

        await longOtoken.approve(marginPool.address, collateralToDeposit, {from: accountOwner1})
        await controller.operate(actionArgs, {from: accountOwner1})

        const marginPoolBalanceAfter = new BigNumber(await longOtoken.balanceOf(marginPool.address))
        const senderBalanceAfter = new BigNumber(await longOtoken.balanceOf(accountOwner1))
        const vaultAfter = await controller.getVault(accountOwner1, vaultCounter)

        assert.equal(
          marginPoolBalanceAfter.minus(marginPoolBalanceBefore).toString(),
          collateralToDeposit.toString(),
          'Margin pool balance long otoken balance mismatch',
        )
        assert.equal(
          senderBalanceBefore.minus(senderBalanceAfter).toString(),
          collateralToDeposit.toString(),
          'Sender balance long otoken balance mismatch',
        )
        assert.equal(vaultAfter.longOtokens.length, 1, 'Vault long otoken array length mismatch')
        assert.equal(vaultAfter.longOtokens[0], longOtoken.address, 'Long otoken address deposited into vault mismatch')
        assert.equal(
          new BigNumber(vaultAfter.longAmounts[0]).toString(),
          collateralToDeposit.toString(),
          'Long otoken amount deposited into vault mismatch',
        )
      })

      it('should deposit long otoken into vault from account operator', async () => {
        assert.equal(await controller.isOperator(accountOwner1, accountOperator1), true, 'Operator address mismatch')

        const vaultCounter = new BigNumber(await controller.getAccountVaultCounter(accountOwner1))
        const collateralToDeposit = new BigNumber('20')
        const actionArgs = [
          {
            actionType: ActionType.DepositLongOption,
            owner: accountOwner1,
            sender: accountOperator1,
            asset: longOtoken.address,
            vaultId: vaultCounter.toNumber(),
            amount: collateralToDeposit.toNumber(),
            index: '0',
            data: ZERO_ADDR,
          },
        ]
        const marginPoolBalanceBefore = new BigNumber(await longOtoken.balanceOf(marginPool.address))
        const senderBalanceBefore = new BigNumber(await longOtoken.balanceOf(accountOperator1))
        const vaultBefore = await controller.getVault(accountOwner1, vaultCounter)

        await longOtoken.approve(marginPool.address, collateralToDeposit, {from: accountOperator1})
        await controller.operate(actionArgs, {from: accountOperator1})

        const marginPoolBalanceAfter = new BigNumber(await longOtoken.balanceOf(marginPool.address))
        const senderBalanceAfter = new BigNumber(await longOtoken.balanceOf(accountOperator1))
        const vaultAfter = await controller.getVault(accountOwner1, vaultCounter)

        assert.equal(
          marginPoolBalanceAfter.minus(marginPoolBalanceBefore).toString(),
          collateralToDeposit.toString(),
          'Margin pool balance long otoken balance mismatch',
        )
        assert.equal(
          senderBalanceBefore.minus(senderBalanceAfter).toString(),
          collateralToDeposit.toString(),
          'Sender balance long otoken balance mismatch',
        )
        assert.equal(vaultAfter.longOtokens.length, 1, 'Vault long otoken array length mismatch')
        assert.equal(vaultAfter.longOtokens[0], longOtoken.address, 'Long otoken address deposited into vault mismatch')
        assert.equal(
          new BigNumber(vaultAfter.longAmounts[0]).minus(new BigNumber(vaultBefore.longAmounts[0])).toString(),
          collateralToDeposit.toString(),
          'Long otoken amount deposited into vault mismatch',
        )
      })

      it('should execute depositing long otoken into vault in multiple actions', async () => {
        const vaultCounter = new BigNumber(await controller.getAccountVaultCounter(accountOwner1))
        const collateralToDeposit = new BigNumber('20')
        const actionArgs = [
          {
            actionType: ActionType.DepositLongOption,
            owner: accountOwner1,
            sender: accountOwner1,
            asset: longOtoken.address,
            vaultId: vaultCounter.toNumber(),
            amount: collateralToDeposit.toNumber(),
            index: '0',
            data: ZERO_ADDR,
          },
          {
            actionType: ActionType.DepositLongOption,
            owner: accountOwner1,
            sender: accountOwner1,
            asset: longOtoken.address,
            vaultId: vaultCounter.toNumber(),
            amount: collateralToDeposit.toNumber(),
            index: '0',
            data: ZERO_ADDR,
          },
        ]
        const marginPoolBalanceBefore = new BigNumber(await longOtoken.balanceOf(marginPool.address))
        const senderBalanceBefore = new BigNumber(await longOtoken.balanceOf(accountOwner1))
        const vaultBefore = await controller.getVault(accountOwner1, vaultCounter)

        await longOtoken.approve(marginPool.address, collateralToDeposit.multipliedBy(2), {from: accountOwner1})
        await controller.operate(actionArgs, {from: accountOwner1})

        const marginPoolBalanceAfter = new BigNumber(await longOtoken.balanceOf(marginPool.address))
        const senderBalanceAfter = new BigNumber(await longOtoken.balanceOf(accountOwner1))
        const vaultAfter = await controller.getVault(accountOwner1, vaultCounter)

        assert.equal(
          marginPoolBalanceAfter.minus(marginPoolBalanceBefore).toString(),
          collateralToDeposit.multipliedBy(2).toString(),
          'Margin pool balance long otoken balance mismatch',
        )
        assert.equal(
          senderBalanceBefore.minus(senderBalanceAfter).toString(),
          collateralToDeposit.multipliedBy(2).toString(),
          'Sender balance long otoken balance mismatch',
        )
        assert.equal(vaultAfter.longOtokens.length, 1, 'Vault long otoken array length mismatch')
        assert.equal(vaultAfter.longOtokens[0], longOtoken.address, 'Long otoken address deposited into vault mismatch')
        assert.equal(
          new BigNumber(vaultAfter.longAmounts[0]).minus(new BigNumber(vaultBefore.longAmounts[0])).toString(),
          collateralToDeposit.multipliedBy(2).toString(),
          'Long otoken amount deposited into vault mismatch',
        )
      })

      it('should revert depositing long otoken from a sender different than arg.from', async () => {
        const vaultCounter = new BigNumber(await controller.getAccountVaultCounter(accountOwner1))
        const collateralToDeposit = new BigNumber('20')
        const actionArgs = [
          {
            actionType: ActionType.DepositLongOption,
            owner: accountOwner1,
            sender: accountOwner1,
            asset: longOtoken.address,
            vaultId: vaultCounter.toNumber(),
            amount: collateralToDeposit.toNumber(),
            index: '0',
            data: ZERO_ADDR,
          },
        ]

        await longOtoken.approve(marginPool.address, collateralToDeposit, {from: accountOperator1})
        await expectRevert(
          controller.operate(actionArgs, {from: accountOperator1}),
          'Controller: depositor address and msg.sender address mismatch',
        )
      })

      it('should revert depositing long otoken with amount equal to zero', async () => {
        const vaultCounter = new BigNumber(await controller.getAccountVaultCounter(accountOwner1))
        const collateralToDeposit = new BigNumber('20')
        const actionArgs = [
          {
            actionType: ActionType.DepositLongOption,
            owner: accountOwner1,
            sender: accountOwner1,
            asset: longOtoken.address,
            vaultId: vaultCounter.toNumber(),
            amount: '0',
            index: '0',
            data: ZERO_ADDR,
          },
        ]

        await longOtoken.approve(marginPool.address, collateralToDeposit, {from: accountOwner1})
        await expectRevert(
          controller.operate(actionArgs, {from: accountOwner1}),
          'MarginAccount: invalid long otoken amount',
        )
      })

      it('should revert depositing an expired long otoken', async () => {
        // deploy expired Otoken
        const expiredLongOtoken: MockOtokenInstance = await MockOtoken.new()
        // init otoken
        await expiredLongOtoken.init(
          addressBook.address,
          weth.address,
          usdc.address,
          usdc.address,
          new BigNumber(200).times(new BigNumber(10).exponentiatedBy(18)),
          '1219926985', // 2008
          true,
        )
        await expiredLongOtoken.mintOtoken(accountOwner1, new BigNumber('100'))

        // whitelist otoken
        await whitelist.whitelistOtoken(expiredLongOtoken.address)

        const vaultCounter = new BigNumber(await controller.getAccountVaultCounter(accountOwner1))
        const collateralToDeposit = new BigNumber('20')
        const actionArgs = [
          {
            actionType: ActionType.DepositLongOption,
            owner: accountOwner1,
            sender: accountOwner1,
            asset: expiredLongOtoken.address,
            vaultId: vaultCounter.toNumber(),
            amount: collateralToDeposit.toNumber(),
            index: '0',
            data: ZERO_ADDR,
          },
        ]

        await expiredLongOtoken.approve(marginPool.address, collateralToDeposit, {from: accountOwner1})
        await expectRevert(
          controller.operate(actionArgs, {from: accountOwner1}),
          'Controller: otoken used as collateral is already expired',
        )
      })

      it('should revert when vault have more than 1 long otoken', async () => {
        const expiryTime = new BigNumber(60 * 60) // after 1 hour
        const collateralToDeposit = new BigNumber('20')
        // deploy second Otoken
        const secondLongOtoken: MockOtokenInstance = await MockOtoken.new()
        // init otoken
        await secondLongOtoken.init(
          addressBook.address,
          weth.address,
          usdc.address,
          usdc.address,
          new BigNumber(200).times(new BigNumber(10).exponentiatedBy(18)),
          new BigNumber(await time.latest()).plus(expiryTime),
          true,
        )
        await secondLongOtoken.mintOtoken(accountOwner1, collateralToDeposit)
        // whitelist otoken
        await whitelist.whitelistOtoken(secondLongOtoken.address)
        const vaultCounter = new BigNumber(await controller.getAccountVaultCounter(accountOwner1))
        const actionArgs = [
          {
            actionType: ActionType.DepositLongOption,
            owner: accountOwner1,
            sender: accountOwner1,
            asset: secondLongOtoken.address,
            vaultId: vaultCounter.toNumber(),
            amount: collateralToDeposit.toNumber(),
            index: '1',
            data: ZERO_ADDR,
          },
        ]

        await secondLongOtoken.approve(marginPool.address, collateralToDeposit, {from: accountOwner1})
        await expectRevert(
          controller.operate(actionArgs, {from: accountOwner1}),
          'MarginCalculator: Too many long otokens in the vault.',
        )
      })
    })

    describe('withdraw long otoken', () => {
      it('should revert withdrawing long otoken with wrong index from a vault', async () => {
        const vaultCounter = new BigNumber(await controller.getAccountVaultCounter(accountOwner1))
        assert.isAbove(vaultCounter.toNumber(), 0, 'Account owner have no vault')

        const collateralToWithdraw = new BigNumber('20')
        const actionArgs = [
          {
            actionType: ActionType.WithdrawLongOption,
            owner: accountOwner1,
            sender: accountOwner1,
            asset: longOtoken.address,
            vaultId: vaultCounter.toNumber(),
            amount: collateralToWithdraw.toNumber(),
            index: '1',
            data: ZERO_ADDR,
          },
        ]

        await expectRevert(
          controller.operate(actionArgs, {from: accountOwner1}),
          'MarginAccount: long otoken address mismatch',
        )
      })

      it('should revert withdrawing long otoken from random address other than account owner or operator', async () => {
        const vaultCounter = new BigNumber(await controller.getAccountVaultCounter(accountOwner1))
        assert.isAbove(vaultCounter.toNumber(), 0, 'Account owner have no vault')

        const collateralToWithdraw = new BigNumber('20')
        const actionArgs = [
          {
            actionType: ActionType.WithdrawLongOption,
            owner: accountOwner1,
            sender: accountOwner1,
            asset: longOtoken.address,
            vaultId: vaultCounter.toNumber(),
            amount: collateralToWithdraw.toNumber(),
            index: '0',
            data: ZERO_ADDR,
          },
        ]

        await expectRevert(
          controller.operate(actionArgs, {from: random}),
          'Controller: msg.sender is not authorized to run action',
        )
      })

      it('should revert withdrawing long otoken amount equal to zero', async () => {
        const vaultCounter = new BigNumber(await controller.getAccountVaultCounter(accountOwner1))
        assert.isAbove(vaultCounter.toNumber(), 0, 'Account owner have no vault')

        const actionArgs = [
          {
            actionType: ActionType.WithdrawLongOption,
            owner: accountOwner1,
            sender: accountOwner1,
            asset: longOtoken.address,
            vaultId: vaultCounter.toNumber(),
            amount: '0',
            index: '0',
            data: ZERO_ADDR,
          },
        ]

        await expectRevert(
          controller.operate(actionArgs, {from: accountOwner1}),
          'MarginPool: transferToUser amount is equal to 0',
        )
      })

      it('should revert withdrawing long otoken amount greater than the vault balance', async () => {
        const vaultCounter = new BigNumber(await controller.getAccountVaultCounter(accountOwner1))
        assert.isAbove(vaultCounter.toNumber(), 0, 'Account owner have no vault')

        const vaultBefore = await controller.getVault(accountOwner1, vaultCounter)
        const collateralToWithdraw = new BigNumber(vaultBefore.longAmounts[0]).plus(1)
        const actionArgs = [
          {
            actionType: ActionType.WithdrawLongOption,
            owner: accountOwner1,
            sender: accountOwner1,
            asset: longOtoken.address,
            vaultId: vaultCounter.toNumber(),
            amount: collateralToWithdraw.toNumber(),
            index: '0',
            data: ZERO_ADDR,
          },
        ]

        await expectRevert(controller.operate(actionArgs, {from: accountOwner1}), 'SafeMath: subtraction overflow')
      })

      it('should withdraw long otoken to any random address where msg.sender is account owner', async () => {
        const vaultCounter = new BigNumber(await controller.getAccountVaultCounter(accountOwner1))
        assert.isAbove(vaultCounter.toNumber(), 0, 'Account owner have no vault')

        const collateralToWithdraw = new BigNumber('10')
        const actionArgs = [
          {
            actionType: ActionType.WithdrawLongOption,
            owner: accountOwner1,
            sender: random,
            asset: longOtoken.address,
            vaultId: vaultCounter.toNumber(),
            amount: collateralToWithdraw.toNumber(),
            index: '0',
            data: ZERO_ADDR,
          },
        ]
        const marginPoolBalanceBefore = new BigNumber(await longOtoken.balanceOf(marginPool.address))
        const receiverBalanceBefore = new BigNumber(await longOtoken.balanceOf(random))
        const vaultBefore = await controller.getVault(accountOwner1, vaultCounter)

        await controller.operate(actionArgs, {from: accountOwner1})

        const marginPoolBalanceAfter = new BigNumber(await longOtoken.balanceOf(marginPool.address))
        const receiverBalanceAfter = new BigNumber(await longOtoken.balanceOf(random))
        const vaultAfter = await controller.getVault(accountOwner1, vaultCounter)

        assert.equal(
          marginPoolBalanceBefore.minus(marginPoolBalanceAfter).toString(),
          collateralToWithdraw.toString(),
          'Margin pool balance long otoken balance mismatch',
        )
        assert.equal(
          receiverBalanceAfter.minus(receiverBalanceBefore).toString(),
          collateralToWithdraw.toString(),
          'Receiver long otoken balance mismatch',
        )
        assert.equal(vaultAfter.longOtokens.length, 1, 'Vault long otoken array length mismatch')
        assert.equal(
          new BigNumber(vaultBefore.longAmounts[0]).minus(new BigNumber(vaultAfter.longAmounts[0])).toString(),
          collateralToWithdraw.toString(),
          'Long otoken amount in vault after withdraw mismatch',
        )
      })

      it('should withdraw long otoken to any random address where msg.sender is account operator', async () => {
        assert.equal(await controller.isOperator(accountOwner1, accountOperator1), true, 'Operator address mismatch')

        const vaultCounter = new BigNumber(await controller.getAccountVaultCounter(accountOwner1))
        assert.isAbove(vaultCounter.toNumber(), 0, 'Account owner have no vault')

        const collateralToWithdraw = new BigNumber('10')
        const actionArgs = [
          {
            actionType: ActionType.WithdrawLongOption,
            owner: accountOwner1,
            sender: random,
            asset: longOtoken.address,
            vaultId: vaultCounter.toNumber(),
            amount: collateralToWithdraw.toNumber(),
            index: '0',
            data: ZERO_ADDR,
          },
        ]
        const marginPoolBalanceBefore = new BigNumber(await longOtoken.balanceOf(marginPool.address))
        const receiverBalanceBefore = new BigNumber(await longOtoken.balanceOf(random))
        const vaultBefore = await controller.getVault(accountOwner1, vaultCounter)

        await controller.operate(actionArgs, {from: accountOperator1})

        const marginPoolBalanceAfter = new BigNumber(await longOtoken.balanceOf(marginPool.address))
        const receiverBalanceAfter = new BigNumber(await longOtoken.balanceOf(random))
        const vaultAfter = await controller.getVault(accountOwner1, vaultCounter)

        assert.equal(
          marginPoolBalanceBefore.minus(marginPoolBalanceAfter).toString(),
          collateralToWithdraw.toString(),
          'Margin pool balance long otoken balance mismatch',
        )
        assert.equal(
          receiverBalanceAfter.minus(receiverBalanceBefore).toString(),
          collateralToWithdraw.toString(),
          'Receiver long otoken balance mismatch',
        )
        assert.equal(vaultAfter.longOtokens.length, 1, 'Vault long otoken array length mismatch')
        assert.equal(
          new BigNumber(vaultBefore.longAmounts[0]).minus(new BigNumber(vaultAfter.longAmounts[0])).toString(),
          collateralToWithdraw.toString(),
          'Long otoken amount in vault after withdraw mismatch',
        )
      })

      it('should execute withdrawing long otoken in mutliple actions', async () => {
        const vaultCounter = new BigNumber(await controller.getAccountVaultCounter(accountOwner1))
        assert.isAbove(vaultCounter.toNumber(), 0, 'Account owner have no vault')

        const collateralToWithdraw = new BigNumber('10')
        const actionArgs = [
          {
            actionType: ActionType.WithdrawLongOption,
            owner: accountOwner1,
            sender: accountOwner1,
            asset: longOtoken.address,
            vaultId: vaultCounter.toNumber(),
            amount: collateralToWithdraw.toNumber(),
            index: '0',
            data: ZERO_ADDR,
          },
          {
            actionType: ActionType.WithdrawLongOption,
            owner: accountOwner1,
            sender: accountOwner1,
            asset: longOtoken.address,
            vaultId: vaultCounter.toNumber(),
            amount: collateralToWithdraw.toNumber(),
            index: '0',
            data: ZERO_ADDR,
          },
        ]
        const marginPoolBalanceBefore = new BigNumber(await longOtoken.balanceOf(marginPool.address))
        const receiverBalanceBefore = new BigNumber(await longOtoken.balanceOf(accountOwner1))
        const vaultBefore = await controller.getVault(accountOwner1, vaultCounter)

        await controller.operate(actionArgs, {from: accountOwner1})

        const marginPoolBalanceAfter = new BigNumber(await longOtoken.balanceOf(marginPool.address))
        const receiverBalanceAfter = new BigNumber(await longOtoken.balanceOf(accountOwner1))
        const vaultAfter = await controller.getVault(accountOwner1, vaultCounter)

        assert.equal(
          marginPoolBalanceBefore.minus(marginPoolBalanceAfter).toString(),
          collateralToWithdraw.multipliedBy(2).toString(),
          'Margin pool balance long otoken balance mismatch',
        )
        assert.equal(
          receiverBalanceAfter.minus(receiverBalanceBefore).toString(),
          collateralToWithdraw.multipliedBy(2).toString(),
          'Receiver long otoken balance mismatch',
        )
        assert.equal(vaultAfter.longOtokens.length, 1, 'Vault long otoken array length mismatch')
        assert.equal(
          new BigNumber(vaultBefore.longAmounts[0]).minus(new BigNumber(vaultAfter.longAmounts[0])).toString(),
          collateralToWithdraw.multipliedBy(2).toString(),
          'Long otoken amount in vault after withdraw mismatch',
        )
      })

      it('should remove otoken address from otoken array if amount is equal to zero after withdrawing', async () => {
        const vaultCounter = new BigNumber(await controller.getAccountVaultCounter(accountOwner1))
        assert.isAbove(vaultCounter.toNumber(), 0, 'Account owner have no vault')

        const vaultBefore = await controller.getVault(accountOwner1, vaultCounter)

        const collateralToWithdraw = new BigNumber(vaultBefore.longAmounts[0])
        const actionArgs = [
          {
            actionType: ActionType.WithdrawLongOption,
            owner: accountOwner1,
            sender: accountOwner1,
            asset: longOtoken.address,
            vaultId: vaultCounter.toNumber(),
            amount: collateralToWithdraw.toNumber(),
            index: '0',
            data: ZERO_ADDR,
          },
        ]
        const marginPoolBalanceBefore = new BigNumber(await longOtoken.balanceOf(marginPool.address))
        const receiverBalanceBefore = new BigNumber(await longOtoken.balanceOf(accountOwner1))

        await controller.operate(actionArgs, {from: accountOwner1})

        const marginPoolBalanceAfter = new BigNumber(await longOtoken.balanceOf(marginPool.address))
        const receiverBalanceAfter = new BigNumber(await longOtoken.balanceOf(accountOwner1))
        const vaultAfter = await controller.getVault(accountOwner1, vaultCounter)

        assert.equal(
          marginPoolBalanceBefore.minus(marginPoolBalanceAfter).toString(),
          collateralToWithdraw.toString(),
          'Margin pool balance long otoken balance mismatch',
        )
        assert.equal(
          receiverBalanceAfter.minus(receiverBalanceBefore).toString(),
          collateralToWithdraw.toString(),
          'Receiver long otoken balance mismatch',
        )
        assert.equal(vaultAfter.longOtokens.length, 1, 'Vault long otoken array length mismatch')
        assert.equal(vaultAfter.longOtokens[0], ZERO_ADDR, 'Vault long otoken address after clearing mismatch')
        assert.equal(
          new BigNumber(vaultBefore.longAmounts[0]).minus(new BigNumber(vaultAfter.longAmounts[0])).toString(),
          collateralToWithdraw.toString(),
          'Long otoken amount in vault after withdraw mismatch',
        )
      })

      describe('withdraw expired long otoken', () => {
        let expiredLongOtoken: MockOtokenInstance

        before(async () => {
          const expiryTime = new BigNumber(60 * 60) // after 1 hour
          expiredLongOtoken = await MockOtoken.new()
          // init otoken
          await expiredLongOtoken.init(
            addressBook.address,
            weth.address,
            usdc.address,
            usdc.address,
            new BigNumber(200).times(new BigNumber(10).exponentiatedBy(18)),
            new BigNumber(await time.latest()).plus(expiryTime),
            true,
          )
          // some free money for the account owner
          const collateralToDeposit = new BigNumber('100')
          await expiredLongOtoken.mintOtoken(accountOwner1, collateralToDeposit)
          // whitelist otoken
          await whitelist.whitelistOtoken(expiredLongOtoken.address, {from: owner})
          // deposit long otoken into vault
          const vaultId = new BigNumber('1')
          const actionArgs = [
            {
              actionType: ActionType.DepositLongOption,
              owner: accountOwner1,
              sender: accountOwner1,
              asset: expiredLongOtoken.address,
              vaultId: vaultId.toNumber(),
              amount: collateralToDeposit.toNumber(),
              index: '0',
              data: ZERO_ADDR,
            },
          ]
          await expiredLongOtoken.approve(marginPool.address, collateralToDeposit, {from: accountOwner1})
          await controller.operate(actionArgs, {from: accountOwner1})
          const vaultAfter = await controller.getVault(accountOwner1, vaultId)
          assert.equal(vaultAfter.longOtokens.length, 1, 'Vault long otoken array length mismatch')
          assert.equal(
            vaultAfter.longOtokens[0],
            expiredLongOtoken.address,
            'Long otoken address deposited into vault mismatch',
          )
          assert.equal(
            new BigNumber(vaultAfter.longAmounts[0]).toString(),
            collateralToDeposit.toString(),
            'Long otoken amount deposited into vault mismatch',
          )
        })

        it('should revert withdrawing an expired long otoken', async () => {
          // increment time after expiredLongOtoken expiry
          await time.increase(3601) // increase time with one hour in seconds

          const vaultId = new BigNumber('1')
          const vault = await controller.getVault(accountOwner1, vaultId)
          const collateralToWithdraw = new BigNumber(vault.longAmounts[0])
          const actionArgs = [
            {
              actionType: ActionType.WithdrawLongOption,
              owner: accountOwner1,
              sender: accountOwner1,
              asset: expiredLongOtoken.address,
              vaultId: vaultId.toNumber(),
              amount: collateralToWithdraw.toNumber(),
              index: '0',
              data: ZERO_ADDR,
            },
          ]

          assert.equal(await controller.isExpired(expiredLongOtoken.address), true, 'Long otoken is not expired yet')

          await expectRevert(
            controller.operate(actionArgs, {from: accountOwner1}),
            'Controller: can not withdraw an expired otoken',
          )
        })
      })
    })
  })

  describe('Collateral asset', () => {
    describe('Deposit collateral asset', () => {
      it('should deposit a whitelisted collateral asset from account owner', async () => {
        // whitelist usdc
        await whitelist.whitelistCollateral(usdc.address)
        const vaultCounter = new BigNumber(await controller.getAccountVaultCounter(accountOwner1))
        assert.isAbove(vaultCounter.toNumber(), 0, 'Account owner have no vault')

        const collateralToDeposit = new BigNumber('10')
        const actionArgs = [
          {
            actionType: ActionType.DepositCollateral,
            owner: accountOwner1,
            sender: accountOwner1,
            asset: usdc.address,
            vaultId: vaultCounter.toNumber(),
            amount: collateralToDeposit.toNumber(),
            index: '0',
            data: ZERO_ADDR,
          },
        ]

        const marginPoolBalanceBefore = new BigNumber(await usdc.balanceOf(marginPool.address))
        const senderBalanceBefore = new BigNumber(await usdc.balanceOf(accountOwner1))

        await usdc.approve(marginPool.address, collateralToDeposit, {from: accountOwner1})
        await controller.operate(actionArgs, {from: accountOwner1})

        const marginPoolBalanceAfter = new BigNumber(await usdc.balanceOf(marginPool.address))
        const senderBalanceAfter = new BigNumber(await usdc.balanceOf(accountOwner1))
        const vaultAfter = await controller.getVault(accountOwner1, vaultCounter)

        assert.equal(
          marginPoolBalanceAfter.minus(marginPoolBalanceBefore).toString(),
          collateralToDeposit.toString(),
          'Margin pool balance collateral asset balance mismatch',
        )
        assert.equal(
          senderBalanceBefore.minus(senderBalanceAfter).toString(),
          collateralToDeposit.toString(),
          'Sender balance collateral asset balance mismatch',
        )
        assert.equal(vaultAfter.collateralAssets.length, 1, 'Vault collateral assets array length mismatch')
        assert.equal(
          vaultAfter.collateralAssets[0],
          usdc.address,
          'Collateral asset address deposited into vault mismatch',
        )
        assert.equal(
          new BigNumber(vaultAfter.collateralAmounts[0]).toString(),
          collateralToDeposit.toString(),
          'Collateral asset amount deposited into vault mismatch',
        )
      })

      it('should deposit a whitelisted collateral asset from account operator', async () => {
        const vaultCounter = new BigNumber(await controller.getAccountVaultCounter(accountOwner1))
        assert.isAbove(vaultCounter.toNumber(), 0, 'Account owner have no vault')

        const collateralToDeposit = new BigNumber('10')
        const actionArgs = [
          {
            actionType: ActionType.DepositCollateral,
            owner: accountOwner1,
            sender: accountOperator1,
            asset: usdc.address,
            vaultId: vaultCounter.toNumber(),
            amount: collateralToDeposit.toNumber(),
            index: '0',
            data: ZERO_ADDR,
          },
        ]

        const marginPoolBalanceBefore = new BigNumber(await usdc.balanceOf(marginPool.address))
        const senderBalanceBefore = new BigNumber(await usdc.balanceOf(accountOperator1))
        const vaultBefore = await controller.getVault(accountOwner1, vaultCounter)

        await usdc.approve(marginPool.address, collateralToDeposit, {from: accountOperator1})
        await controller.operate(actionArgs, {from: accountOperator1})

        const marginPoolBalanceAfter = new BigNumber(await usdc.balanceOf(marginPool.address))
        const senderBalanceAfter = new BigNumber(await usdc.balanceOf(accountOperator1))
        const vaultAfter = await controller.getVault(accountOwner1, vaultCounter)

        assert.equal(
          marginPoolBalanceAfter.minus(marginPoolBalanceBefore).toString(),
          collateralToDeposit.toString(),
          'Margin pool balance collateral asset balance mismatch',
        )
        assert.equal(
          senderBalanceBefore.minus(senderBalanceAfter).toString(),
          collateralToDeposit.toString(),
          'Sender balance collateral asset balance mismatch',
        )
        assert.equal(vaultAfter.collateralAssets.length, 1, 'Vault collateral assets array length mismatch')
        assert.equal(
          vaultAfter.collateralAssets[0],
          usdc.address,
          'Collateral asset address deposited into vault mismatch',
        )
        assert.equal(
          new BigNumber(vaultAfter.collateralAmounts[0])
            .minus(new BigNumber(vaultBefore.collateralAmounts[0]))
            .toString(),
          collateralToDeposit.toString(),
          'Long otoken amount deposited into vault mismatch',
        )
      })

      it('should revert depositing a collateral asset from a msg.sender different than arg.from', async () => {
        const vaultCounter = new BigNumber(await controller.getAccountVaultCounter(accountOwner1))
        assert.isAbove(vaultCounter.toNumber(), 0, 'Account owner have no vault')

        const collateralToDeposit = new BigNumber('10')
        const actionArgs = [
          {
            actionType: ActionType.DepositCollateral,
            owner: accountOwner1,
            sender: random,
            asset: usdc.address,
            vaultId: vaultCounter.toNumber(),
            amount: collateralToDeposit.toNumber(),
            index: '0',
            data: ZERO_ADDR,
          },
        ]

        await usdc.approve(marginPool.address, collateralToDeposit, {from: accountOwner1})
        await expectRevert(
          controller.operate(actionArgs, {from: accountOwner1}),
          'Controller: depositor address and msg.sender address mismatch',
        )
      })

      it('should revert depositing a collateral asset with amount equal to zero', async () => {
        const vaultCounter = new BigNumber(await controller.getAccountVaultCounter(accountOwner1))
        assert.isAbove(vaultCounter.toNumber(), 0, 'Account owner have no vault')

        const collateralToDeposit = new BigNumber('0')
        const actionArgs = [
          {
            actionType: ActionType.DepositCollateral,
            owner: accountOwner1,
            sender: accountOwner1,
            asset: usdc.address,
            vaultId: vaultCounter.toNumber(),
            amount: collateralToDeposit.toNumber(),
            index: '0',
            data: ZERO_ADDR,
          },
        ]

        await usdc.approve(marginPool.address, collateralToDeposit, {from: accountOwner1})
        await expectRevert(
          controller.operate(actionArgs, {from: accountOwner1}),
          'MarginAccount: invalid collateral amount',
        )
      })

      it('should execute depositing collateral into vault in multiple actions', async () => {
        const vaultCounter = new BigNumber(await controller.getAccountVaultCounter(accountOwner1))
        const collateralToDeposit = new BigNumber('20')
        const actionArgs = [
          {
            actionType: ActionType.DepositCollateral,
            owner: accountOwner1,
            sender: accountOwner1,
            asset: usdc.address,
            vaultId: vaultCounter.toNumber(),
            amount: collateralToDeposit.toNumber(),
            index: '0',
            data: ZERO_ADDR,
          },
          {
            actionType: ActionType.DepositCollateral,
            owner: accountOwner1,
            sender: accountOwner1,
            asset: usdc.address,
            vaultId: vaultCounter.toNumber(),
            amount: collateralToDeposit.toNumber(),
            index: '0',
            data: ZERO_ADDR,
          },
        ]
        const marginPoolBalanceBefore = new BigNumber(await usdc.balanceOf(marginPool.address))
        const senderBalanceBefore = new BigNumber(await usdc.balanceOf(accountOwner1))
        const vaultBefore = await controller.getVault(accountOwner1, vaultCounter)

        await usdc.approve(marginPool.address, collateralToDeposit.multipliedBy(2), {from: accountOwner1})
        await controller.operate(actionArgs, {from: accountOwner1})

        const marginPoolBalanceAfter = new BigNumber(await usdc.balanceOf(marginPool.address))
        const senderBalanceAfter = new BigNumber(await usdc.balanceOf(accountOwner1))
        const vaultAfter = await controller.getVault(accountOwner1, vaultCounter)

        assert.equal(
          marginPoolBalanceAfter.minus(marginPoolBalanceBefore).toString(),
          collateralToDeposit.multipliedBy(2).toString(),
          'Margin pool collateral balance mismatch',
        )
        assert.equal(
          senderBalanceBefore.minus(senderBalanceAfter).toString(),
          collateralToDeposit.multipliedBy(2).toString(),
          'Sender collateral asset balance mismatch',
        )
        assert.equal(vaultAfter.collateralAmounts.length, 1, 'Vault collateral asset array length mismatch')
        assert.equal(
          vaultAfter.collateralAssets[0],
          usdc.address,
          'Collateral asset address deposited into vault mismatch',
        )
        assert.equal(
          new BigNumber(vaultAfter.collateralAmounts[0])
            .minus(new BigNumber(vaultBefore.collateralAmounts[0]))
            .toString(),
          collateralToDeposit.multipliedBy(2).toString(),
          'Collateral asset amount deposited into vault mismatch',
        )
      })

      describe('Deposit un-whitelisted collateral asset', () => {
        it('should revert depositing a collateral asset that is not whitelisted', async () => {
          // deploy a shitcoin
          const trx: MockERC20Instance = await MockERC20.new('TRX', 'TRX', 18)
          await trx.mint(accountOwner1, new BigNumber('1000'))

          const vaultCounter = new BigNumber(await controller.getAccountVaultCounter(accountOwner1))
          assert.isAbove(vaultCounter.toNumber(), 0, 'Account owner have no vault')

          const collateralDeposit = new BigNumber('10')
          const actionArgs = [
            {
              actionType: ActionType.DepositCollateral,
              owner: accountOwner1,
              sender: accountOwner1,
              asset: trx.address,
              vaultId: vaultCounter.toNumber(),
              amount: collateralDeposit.toNumber(),
              index: '0',
              data: ZERO_ADDR,
            },
          ]

          await trx.approve(marginPool.address, collateralDeposit, {from: accountOwner1})
          await expectRevert(
            controller.operate(actionArgs, {from: accountOwner1}),
            'Controller: asset is not whitelisted to be used as collateral',
          )
        })
      })

      it('should revert when vault have more than 1 collateral type', async () => {
        const collateralToDeposit = new BigNumber('20')
        //whitelist weth to use in this test
        await whitelist.whitelistCollateral(weth.address)
        await weth.mint(accountOwner1, collateralToDeposit)

        const vaultCounter = new BigNumber(await controller.getAccountVaultCounter(accountOwner1))
        const actionArgs = [
          {
            actionType: ActionType.DepositCollateral,
            owner: accountOwner1,
            sender: accountOwner1,
            asset: weth.address,
            vaultId: vaultCounter.toNumber(),
            amount: collateralToDeposit.toNumber(),
            index: '1',
            data: ZERO_ADDR,
          },
        ]

        await weth.approve(marginPool.address, collateralToDeposit, {from: accountOwner1})
        await expectRevert(
          controller.operate(actionArgs, {from: accountOwner1}),
          'MarginCalculator: Too many collateral assets in the vault.',
        )
      })
    })

    describe('withdraw collateral', () => {
      it('should revert withdrawing collateral asset with wrong index from a vault', async () => {
        const vaultCounter = new BigNumber(await controller.getAccountVaultCounter(accountOwner1))
        assert.isAbove(vaultCounter.toNumber(), 0, 'Account owner have no vault')

        const collateralToWithdraw = new BigNumber('20')
        const actionArgs = [
          {
            actionType: ActionType.WithdrawCollateral,
            owner: accountOwner1,
            sender: accountOwner1,
            asset: usdc.address,
            vaultId: vaultCounter.toNumber(),
            amount: collateralToWithdraw.toNumber(),
            index: '1',
            data: ZERO_ADDR,
          },
        ]

        await expectRevert(
          controller.operate(actionArgs, {from: accountOwner1}),
          'MarginAccount: collateral token address mismatch',
        )
      })

      it('should revert withdrawing collateral asset from an invalid id', async () => {
        const vaultCounter = new BigNumber(await controller.getAccountVaultCounter(accountOwner1))
        assert.isAbove(vaultCounter.toNumber(), 0, 'Account owner have no vault')

        const collateralToWithdraw = new BigNumber('20')
        const actionArgs = [
          {
            actionType: ActionType.WithdrawCollateral,
            owner: accountOwner1,
            sender: accountOwner1,
            asset: usdc.address,
            vaultId: '1350',
            amount: collateralToWithdraw.toNumber(),
            index: '1',
            data: ZERO_ADDR,
          },
        ]

        await expectRevert(controller.operate(actionArgs, {from: accountOwner1}), 'Controller: invalid vault id')
      })

      it('should revert withdrawing collateral asset amount greater than the vault balance', async () => {
        const vaultCounter = new BigNumber(await controller.getAccountVaultCounter(accountOwner1))
        assert.isAbove(vaultCounter.toNumber(), 0, 'Account owner have no vault')

        const vaultBefore = await controller.getVault(accountOwner1, vaultCounter)
        const collateralToWithdraw = new BigNumber(vaultBefore.collateralAmounts[0]).plus(1)
        const actionArgs = [
          {
            actionType: ActionType.WithdrawCollateral,
            owner: accountOwner1,
            sender: accountOwner1,
            asset: usdc.address,
            vaultId: vaultCounter.toNumber(),
            amount: collateralToWithdraw.toNumber(),
            index: '0',
            data: ZERO_ADDR,
          },
        ]

        await expectRevert(controller.operate(actionArgs, {from: accountOwner1}), 'SafeMath: subtraction overflow')
      })

      it('should withdraw collateral to any random address where msg.sender is account owner', async () => {
        const vaultCounter = new BigNumber(await controller.getAccountVaultCounter(accountOwner1))
        assert.isAbove(vaultCounter.toNumber(), 0, 'Account owner have no vault')

        const collateralToWithdraw = new BigNumber('10')
        const actionArgs = [
          {
            actionType: ActionType.WithdrawCollateral,
            owner: accountOwner1,
            sender: random,
            asset: usdc.address,
            vaultId: vaultCounter.toNumber(),
            amount: collateralToWithdraw.toNumber(),
            index: '0',
            data: ZERO_ADDR,
          },
        ]
        const marginPoolBalanceBefore = new BigNumber(await usdc.balanceOf(marginPool.address))
        const receiverBalanceBefore = new BigNumber(await usdc.balanceOf(random))
        const vaultBefore = await controller.getVault(accountOwner1, vaultCounter)

        await controller.operate(actionArgs, {from: accountOwner1})

        const marginPoolBalanceAfter = new BigNumber(await usdc.balanceOf(marginPool.address))
        const receiverBalanceAfter = new BigNumber(await usdc.balanceOf(random))
        const vaultAfter = await controller.getVault(accountOwner1, vaultCounter)

        assert.equal(
          marginPoolBalanceBefore.minus(marginPoolBalanceAfter).toString(),
          collateralToWithdraw.toString(),
          'Margin pool collateral asset balance mismatch',
        )
        assert.equal(
          receiverBalanceAfter.minus(receiverBalanceBefore).toString(),
          collateralToWithdraw.toString(),
          'Receiver collateral asset balance mismatch',
        )
        assert.equal(vaultAfter.collateralAssets.length, 1, 'Vault collateral asset array length mismatch')
        assert.equal(
          new BigNumber(vaultBefore.collateralAmounts[0])
            .minus(new BigNumber(vaultAfter.collateralAmounts[0]))
            .toString(),
          collateralToWithdraw.toString(),
          'Collateral asset amount in vault after withdraw mismatch',
        )
      })

      it('should withdraw collateral asset to any random address where msg.sender is account operator', async () => {
        assert.equal(await controller.isOperator(accountOwner1, accountOperator1), true, 'Operator address mismatch')

        const vaultCounter = new BigNumber(await controller.getAccountVaultCounter(accountOwner1))
        assert.isAbove(vaultCounter.toNumber(), 0, 'Account owner have no vault')

        const collateralToWithdraw = new BigNumber('10')
        const actionArgs = [
          {
            actionType: ActionType.WithdrawCollateral,
            owner: accountOwner1,
            sender: random,
            asset: usdc.address,
            vaultId: vaultCounter.toNumber(),
            amount: collateralToWithdraw.toNumber(),
            index: '0',
            data: ZERO_ADDR,
          },
        ]
        const marginPoolBalanceBefore = new BigNumber(await usdc.balanceOf(marginPool.address))
        const receiverBalanceBefore = new BigNumber(await usdc.balanceOf(random))
        const vaultBefore = await controller.getVault(accountOwner1, vaultCounter)

        await controller.operate(actionArgs, {from: accountOperator1})

        const marginPoolBalanceAfter = new BigNumber(await usdc.balanceOf(marginPool.address))
        const receiverBalanceAfter = new BigNumber(await usdc.balanceOf(random))
        const vaultAfter = await controller.getVault(accountOwner1, vaultCounter)

        assert.equal(
          marginPoolBalanceBefore.minus(marginPoolBalanceAfter).toString(),
          collateralToWithdraw.toString(),
          'Margin pool collateral asset balance mismatch',
        )
        assert.equal(
          receiverBalanceAfter.minus(receiverBalanceBefore).toString(),
          collateralToWithdraw.toString(),
          'Receiver collateral asset balance mismatch',
        )
        assert.equal(vaultAfter.collateralAssets.length, 1, 'Vault collateral asset array length mismatch')
        assert.equal(
          new BigNumber(vaultBefore.collateralAmounts[0])
            .minus(new BigNumber(vaultAfter.collateralAmounts[0]))
            .toString(),
          collateralToWithdraw.toString(),
          'Collateral asset amount in vault after withdraw mismatch',
        )
      })

      it('should execute withdrawing collateral asset in mutliple actions', async () => {
        const vaultCounter = new BigNumber(await controller.getAccountVaultCounter(accountOwner1))
        assert.isAbove(vaultCounter.toNumber(), 0, 'Account owner have no vault')

        const collateralToWithdraw = new BigNumber('10')
        const actionArgs = [
          {
            actionType: ActionType.WithdrawCollateral,
            owner: accountOwner1,
            sender: accountOwner1,
            asset: usdc.address,
            vaultId: vaultCounter.toNumber(),
            amount: collateralToWithdraw.toNumber(),
            index: '0',
            data: ZERO_ADDR,
          },
          {
            actionType: ActionType.WithdrawCollateral,
            owner: accountOwner1,
            sender: accountOwner1,
            asset: usdc.address,
            vaultId: vaultCounter.toNumber(),
            amount: collateralToWithdraw.toNumber(),
            index: '0',
            data: ZERO_ADDR,
          },
        ]
        const marginPoolBalanceBefore = new BigNumber(await usdc.balanceOf(marginPool.address))
        const receiverBalanceBefore = new BigNumber(await usdc.balanceOf(accountOwner1))
        const vaultBefore = await controller.getVault(accountOwner1, vaultCounter)

        await controller.operate(actionArgs, {from: accountOwner1})

        const marginPoolBalanceAfter = new BigNumber(await usdc.balanceOf(marginPool.address))
        const receiverBalanceAfter = new BigNumber(await usdc.balanceOf(accountOwner1))
        const vaultAfter = await controller.getVault(accountOwner1, vaultCounter)

        assert.equal(
          marginPoolBalanceBefore.minus(marginPoolBalanceAfter).toString(),
          collateralToWithdraw.multipliedBy(2).toString(),
          'Margin pool collateral asset balance mismatch',
        )
        assert.equal(
          receiverBalanceAfter.minus(receiverBalanceBefore).toString(),
          collateralToWithdraw.multipliedBy(2).toString(),
          'Receiver collateral asset balance mismatch',
        )
        assert.equal(vaultAfter.collateralAssets.length, 1, 'Vault long otoken array length mismatch')
        assert.equal(
          new BigNumber(vaultBefore.collateralAmounts[0])
            .minus(new BigNumber(vaultAfter.collateralAmounts[0]))
            .toString(),
          collateralToWithdraw.multipliedBy(2).toString(),
          'Collateral asset amount in vault after withdraw mismatch',
        )
      })

      it('should remove collateral asset address from collateral array if amount is equal to zero after withdrawing', async () => {
        const vaultCounter = new BigNumber(await controller.getAccountVaultCounter(accountOwner1))
        assert.isAbove(vaultCounter.toNumber(), 0, 'Account owner have no vault')

        const vaultBefore = await controller.getVault(accountOwner1, vaultCounter)

        const collateralToWithdraw = new BigNumber(vaultBefore.collateralAmounts[0])
        const actionArgs = [
          {
            actionType: ActionType.WithdrawCollateral,
            owner: accountOwner1,
            sender: accountOwner1,
            asset: usdc.address,
            vaultId: vaultCounter.toNumber(),
            amount: collateralToWithdraw.toNumber(),
            index: '0',
            data: ZERO_ADDR,
          },
        ]
        const marginPoolBalanceBefore = new BigNumber(await usdc.balanceOf(marginPool.address))
        const receiverBalanceBefore = new BigNumber(await usdc.balanceOf(accountOwner1))

        await controller.operate(actionArgs, {from: accountOwner1})

        const marginPoolBalanceAfter = new BigNumber(await usdc.balanceOf(marginPool.address))
        const receiverBalanceAfter = new BigNumber(await usdc.balanceOf(accountOwner1))
        const vaultAfter = await controller.getVault(accountOwner1, vaultCounter)

        assert.equal(
          marginPoolBalanceBefore.minus(marginPoolBalanceAfter).toString(),
          collateralToWithdraw.toString(),
          'Margin pool balance long otoken balance mismatch',
        )
        assert.equal(
          receiverBalanceAfter.minus(receiverBalanceBefore).toString(),
          collateralToWithdraw.toString(),
          'Receiver long otoken balance mismatch',
        )
        assert.equal(vaultAfter.collateralAssets.length, 1, 'Vault collateral asset array length mismatch')
        assert.equal(vaultAfter.collateralAssets[0], ZERO_ADDR, 'Vault collater asset address after clearing mismatch')
        assert.equal(
          new BigNumber(vaultBefore.collateralAmounts[0])
            .minus(new BigNumber(vaultAfter.collateralAmounts[0]))
            .toString(),
          collateralToWithdraw.toString(),
          'Collateral asset amount in vault after withdraw mismatch',
        )
      })
    })
  })

  describe('Short otoken', () => {
    let longOtoken: MockOtokenInstance
    let shortOtoken: MockOtokenInstance

    before(async () => {
      const expiryTime = new BigNumber(60 * 60 * 24) // after 1 day

      longOtoken = await MockOtoken.new()
      shortOtoken = await MockOtoken.new()
      // init otoken
      await longOtoken.init(
        addressBook.address,
        weth.address,
        usdc.address,
        usdc.address,
        new BigNumber(250).times(new BigNumber(10).exponentiatedBy(18)),
        new BigNumber(await time.latest()).plus(expiryTime),
        true,
      )
      await shortOtoken.init(
        addressBook.address,
        weth.address,
        usdc.address,
        usdc.address,
        new BigNumber(200).times(new BigNumber(10).exponentiatedBy(18)),
        new BigNumber(await time.latest()).plus(expiryTime),
        true,
      )

      // give free money
      await longOtoken.mintOtoken(accountOwner1, new BigNumber('100'))
      await longOtoken.mintOtoken(accountOperator1, new BigNumber('100'))
      await usdc.mint(accountOwner1, new BigNumber('1000000'))
      await usdc.mint(accountOperator1, new BigNumber('1000000'))
      await usdc.mint(random, new BigNumber('1000000'))
    })

    describe('Mint short otoken', () => {
      it('should revert minting from random address other than owner or operator', async () => {
        const vaultCounter = new BigNumber(await controller.getAccountVaultCounter(accountOwner1))
        assert.isAbove(vaultCounter.toNumber(), 0, 'Account owner have no vault')

        const collateralToDeposit = new BigNumber(await shortOtoken.strikePrice()).dividedBy(1e18)
        const amountToMint = new BigNumber('1')
        const actionArgs = [
          {
            actionType: ActionType.MintShortOption,
            owner: accountOwner1,
            sender: random,
            asset: shortOtoken.address,
            vaultId: vaultCounter.toNumber(),
            amount: amountToMint.toNumber(),
            index: '0',
            data: ZERO_ADDR,
          },
          {
            actionType: ActionType.DepositCollateral,
            owner: accountOwner1,
            sender: random,
            asset: usdc.address,
            vaultId: vaultCounter.toNumber(),
            amount: collateralToDeposit.toNumber(),
            index: '0',
            data: ZERO_ADDR,
          },
        ]

        await usdc.approve(marginPool.address, collateralToDeposit, {from: random})
        await expectRevert(
          controller.operate(actionArgs, {from: random}),
          'Controller: msg.sender is not authorized to run action',
        )
      })

      it('mint naked short otoken from owner', async () => {
        const vaultCounter = new BigNumber(await controller.getAccountVaultCounter(accountOwner1))
        assert.isAbove(vaultCounter.toNumber(), 0, 'Account owner have no vault')

        const collateralToDeposit = new BigNumber(await shortOtoken.strikePrice()).dividedBy(1e18)
        const amountToMint = new BigNumber('1')
        const actionArgs = [
          {
            actionType: ActionType.MintShortOption,
            owner: accountOwner1,
            sender: accountOwner1,
            asset: shortOtoken.address,
            vaultId: vaultCounter.toNumber(),
            amount: amountToMint.toNumber(),
            index: '0',
            data: ZERO_ADDR,
          },
          {
            actionType: ActionType.DepositCollateral,
            owner: accountOwner1,
            sender: accountOwner1,
            asset: usdc.address,
            vaultId: vaultCounter.toNumber(),
            amount: collateralToDeposit.toNumber(),
            index: '0',
            data: ZERO_ADDR,
          },
        ]

        const marginPoolBalanceBefore = new BigNumber(await usdc.balanceOf(marginPool.address))
        const senderBalanceBefore = new BigNumber(await usdc.balanceOf(accountOwner1))
        const senderShortBalanceBefore = new BigNumber(await shortOtoken.balanceOf(accountOwner1))
        const vaultBefore = await controller.getVault(accountOwner1, vaultCounter)

        await usdc.approve(marginPool.address, collateralToDeposit, {from: accountOwner1})
        await controller.operate(actionArgs, {from: accountOwner1})

        const marginPoolBalanceAfter = new BigNumber(await usdc.balanceOf(marginPool.address))
        const senderBalanceAfter = new BigNumber(await usdc.balanceOf(accountOwner1))
        const senderShortBalanceAfter = new BigNumber(await shortOtoken.balanceOf(accountOwner1))
        const vaultAfter = await controller.getVault(accountOwner1, vaultCounter)

        assert.equal(
          marginPoolBalanceAfter.minus(marginPoolBalanceBefore).toString(),
          collateralToDeposit.toString(),
          'Margin pool collateral asset balance mismatch',
        )
        assert.equal(
          senderBalanceBefore.minus(senderBalanceAfter).toString(),
          collateralToDeposit.toString(),
          'Sender collateral asset balance mismatch',
        )
        assert.equal(vaultAfter.collateralAssets.length, 1, 'Vault collateral asset array length mismatch')
        assert.equal(vaultAfter.shortOtokens.length, 1, 'Vault short otoken array length mismatch')
        assert.equal(
          vaultAfter.collateralAssets[0],
          usdc.address,
          'Collateral asset address deposited into vault mismatch',
        )
        assert.equal(
          vaultAfter.shortOtokens[0],
          shortOtoken.address,
          'Short otoken address deposited into vault mismatch',
        )
        assert.equal(
          senderShortBalanceAfter.minus(senderShortBalanceBefore).toString(),
          amountToMint.toString(),
          'Short otoken amount minted mismatch',
        )
        assert.equal(
          new BigNumber(vaultAfter.collateralAmounts[0])
            .minus(new BigNumber(vaultBefore.collateralAmounts[0]))
            .toString(),
          collateralToDeposit.toString(),
          'Collateral asset amount deposited into vault mismatch',
        )
        assert.equal(
          new BigNumber(vaultAfter.shortAmounts[0]).toString(),
          amountToMint.toString(),
          'Short otoken amount minted into vault mismatch',
        )
      })

      it('mint naked short otoken from operator', async () => {
        const vaultCounter = new BigNumber(await controller.getAccountVaultCounter(accountOwner1))
        assert.isAbove(vaultCounter.toNumber(), 0, 'Account owner have no vault')

        const collateralToDeposit = new BigNumber(await shortOtoken.strikePrice()).dividedBy(1e18)
        const amountToMint = new BigNumber('1')
        const actionArgs = [
          {
            actionType: ActionType.MintShortOption,
            owner: accountOwner1,
            sender: accountOperator1,
            asset: shortOtoken.address,
            vaultId: vaultCounter.toNumber(),
            amount: amountToMint.toNumber(),
            index: '0',
            data: ZERO_ADDR,
          },
          {
            actionType: ActionType.DepositCollateral,
            owner: accountOwner1,
            sender: accountOperator1,
            asset: usdc.address,
            vaultId: vaultCounter.toNumber(),
            amount: collateralToDeposit.toNumber(),
            index: '0',
            data: ZERO_ADDR,
          },
        ]

        const marginPoolBalanceBefore = new BigNumber(await usdc.balanceOf(marginPool.address))
        const senderBalanceBefore = new BigNumber(await usdc.balanceOf(accountOperator1))
        const senderShortBalanceBefore = new BigNumber(await shortOtoken.balanceOf(accountOperator1))
        const vaultBefore = await controller.getVault(accountOwner1, vaultCounter)

        await usdc.approve(marginPool.address, collateralToDeposit, {from: accountOperator1})
        await controller.operate(actionArgs, {from: accountOperator1})

        const marginPoolBalanceAfter = new BigNumber(await usdc.balanceOf(marginPool.address))
        const senderBalanceAfter = new BigNumber(await usdc.balanceOf(accountOperator1))
        const senderShortBalanceAfter = new BigNumber(await shortOtoken.balanceOf(accountOperator1))
        const vaultAfter = await controller.getVault(accountOwner1, vaultCounter)

        assert.equal(
          marginPoolBalanceAfter.minus(marginPoolBalanceBefore).toString(),
          collateralToDeposit.toString(),
          'Margin pool collateral asset balance mismatch',
        )
        assert.equal(
          senderBalanceBefore.minus(senderBalanceAfter).toString(),
          collateralToDeposit.toString(),
          'Sender collateral asset balance mismatch',
        )
        assert.equal(vaultAfter.collateralAssets.length, 1, 'Vault collateral asset array length mismatch')
        assert.equal(vaultAfter.shortOtokens.length, 1, 'Vault short otoken array length mismatch')
        assert.equal(
          vaultAfter.collateralAssets[0],
          usdc.address,
          'Collateral asset address deposited into vault mismatch',
        )
        assert.equal(
          vaultAfter.shortOtokens[0],
          shortOtoken.address,
          'Short otoken address deposited into vault mismatch',
        )
        assert.equal(
          senderShortBalanceAfter.minus(senderShortBalanceBefore).toString(),
          amountToMint.toString(),
          'Short otoken amount minted mismatch',
        )
        assert.equal(
          new BigNumber(vaultAfter.collateralAmounts[0])
            .minus(new BigNumber(vaultBefore.collateralAmounts[0]))
            .toString(),
          collateralToDeposit.toString(),
          'Collateral asset amount deposited into vault mismatch',
        )
        assert.equal(
          new BigNumber(vaultAfter.shortAmounts[0]).minus(new BigNumber(vaultBefore.shortAmounts[0])).toString(),
          amountToMint.toString(),
          'Short otoken amount minted into vault mismatch',
        )
      })

      it('should revert withdrawing collateral from naked short position when net value is equal to zero', async () => {
        const vaultCounter = new BigNumber(await controller.getAccountVaultCounter(accountOwner1))
        assert.isAbove(vaultCounter.toNumber(), 0, 'Account owner have no vault')

        const vaultBefore = await controller.getVault(accountOwner1, vaultCounter)

        const netValue = (await calculator.getExcessCollateral(vaultBefore))[0]
        const isExcess = (await calculator.getExcessCollateral(vaultBefore))[1]

        assert.equal(netValue.toString(), '0', 'Position net value mistmatch')
        assert.equal(isExcess, true, 'Position collateral excess mismatch')

        const collateralToWithdraw = new BigNumber(vaultBefore.collateralAmounts[0])
        const actionArgs = [
          {
            actionType: ActionType.WithdrawCollateral,
            owner: accountOwner1,
            sender: accountOwner1,
            asset: usdc.address,
            vaultId: vaultCounter.toNumber(),
            amount: collateralToWithdraw.toNumber(),
            index: '0',
            data: ZERO_ADDR,
          },
        ]

        await expectRevert(
          controller.operate(actionArgs, {from: accountOwner1}),
          'Controller: invalid final vault state',
        )
      })

      it('should withdraw exceeded collateral from naked short position when net value ', async () => {
        const vaultCounter = new BigNumber(await controller.getAccountVaultCounter(accountOwner1))
        assert.isAbove(vaultCounter.toNumber(), 0, 'Account owner have no vault')

        // deposit more collateral
        const excessCollateralToDeposit = new BigNumber('50')
        const firstActionArgs = [
          {
            actionType: ActionType.DepositCollateral,
            owner: accountOwner1,
            sender: accountOwner1,
            asset: usdc.address,
            vaultId: vaultCounter.toNumber(),
            amount: excessCollateralToDeposit.toNumber(),
            index: '0',
            data: ZERO_ADDR,
          },
        ]
        await usdc.approve(marginPool.address, excessCollateralToDeposit, {from: accountOwner1})
        await controller.operate(firstActionArgs, {from: accountOwner1})

        const vaultBefore = await controller.getVault(accountOwner1, vaultCounter)
        const marginPoolBalanceBefore = new BigNumber(await usdc.balanceOf(marginPool.address))
        const withdrawerBalanceBefore = new BigNumber(await usdc.balanceOf(accountOwner1))

        const netValue = (await calculator.getExcessCollateral(vaultBefore))[0]
        const isExcess = (await calculator.getExcessCollateral(vaultBefore))[1]

        assert.equal(netValue.toString(), excessCollateralToDeposit.toString(), 'Position net value mistmatch')
        assert.equal(isExcess, true, 'Position collateral excess mismatch')

        const secondActionArgs = [
          {
            actionType: ActionType.WithdrawCollateral,
            owner: accountOwner1,
            sender: accountOwner1,
            asset: usdc.address,
            vaultId: vaultCounter.toNumber(),
            amount: excessCollateralToDeposit.toNumber(),
            index: '0',
            data: ZERO_ADDR,
          },
        ]

        controller.operate(secondActionArgs, {from: accountOwner1})

        const vaultAfter = await controller.getVault(accountOwner1, vaultCounter)
        const marginPoolBalanceAfter = new BigNumber(await usdc.balanceOf(marginPool.address))
        const withdrawerBalanceAfter = new BigNumber(await usdc.balanceOf(accountOwner1))

        assert.equal(
          marginPoolBalanceBefore.minus(marginPoolBalanceAfter).toString(),
          excessCollateralToDeposit.toString(),
          'Margin pool collateral asset balance mismatch',
        )
        assert.equal(
          withdrawerBalanceAfter.minus(withdrawerBalanceBefore).toString(),
          excessCollateralToDeposit.toString(),
          'Receiver collateral asset balance mismatch',
        )
        assert.equal(vaultAfter.collateralAssets.length, 1, 'Vault collateral asset array length mismatch')
        assert.equal(
          new BigNumber(vaultBefore.collateralAmounts[0])
            .minus(new BigNumber(vaultAfter.collateralAmounts[0]))
            .toString(),
          excessCollateralToDeposit.toString(),
          'Collateral asset amount in vault after withdraw mismatch',
        )
      })

      it('should revert when vault have more than 1 short otoken', async () => {
        const expiryTime = new BigNumber(60 * 60 * 24) // after 1 day
        const invalidShortOtoken: MockOtokenInstance = await MockOtoken.new()
        await invalidShortOtoken.init(
          addressBook.address,
          weth.address,
          usdc.address,
          usdc.address,
          new BigNumber(250).times(new BigNumber(10).exponentiatedBy(18)),
          new BigNumber(await time.latest()).plus(expiryTime),
          true,
        )

        const vaultCounter = new BigNumber(await controller.getAccountVaultCounter(accountOwner1))
        assert.isAbove(vaultCounter.toNumber(), 0, 'Account owner have no vault')

        const collateralToDeposit = new BigNumber(await invalidShortOtoken.strikePrice()).dividedBy(1e18)
        const amountToMint = new BigNumber('1')
        const actionArgs = [
          {
            actionType: ActionType.DepositCollateral,
            owner: accountOwner1,
            sender: accountOwner1,
            asset: usdc.address,
            vaultId: vaultCounter.toNumber(),
            amount: collateralToDeposit.toNumber(),
            index: '0',
            data: ZERO_ADDR,
          },
          {
            actionType: ActionType.MintShortOption,
            owner: accountOwner1,
            sender: accountOwner1,
            asset: invalidShortOtoken.address,
            vaultId: vaultCounter.toNumber(),
            amount: amountToMint.toNumber(),
            index: '1',
            data: ZERO_ADDR,
          },
        ]

        await usdc.approve(marginPool.address, collateralToDeposit, {from: accountOwner1})
        await expectRevert(
          controller.operate(actionArgs, {from: accountOwner1}),
          'MarginCalculator: Too many short otokens in the vault.',
        )
      })
    })

    describe('Burn short otoken', () => {
      /*it('should revert withdrawing collateral asset with wrong index from a vault', async () => {
        const vaultCounter = new BigNumber(await controller.getAccountVaultCounter(accountOwner1))
        assert.isAbove(vaultCounter.toNumber(), 0, 'Account owner have no vault')

        const collateralToWithdraw = new BigNumber('20')
        const actionArgs = [
          {
            actionType: ActionType.WithdrawCollateral,
            owner: accountOwner1,
            sender: accountOwner1,
            asset: usdc.address,
            vaultId: vaultCounter.toNumber(),
            amount: collateralToWithdraw.toNumber(),
            index: '1',
            data: ZERO_ADDR,
          },
        ]

        await expectRevert(
          controller.operate(actionArgs, {from: accountOwner1}),
          'MarginAccount: collateral token address mismatch',
        )
      })

      it('should revert withdrawing collateral asset from an invalid id', async () => {
        const vaultCounter = new BigNumber(await controller.getAccountVaultCounter(accountOwner1))
        assert.isAbove(vaultCounter.toNumber(), 0, 'Account owner have no vault')

        const collateralToWithdraw = new BigNumber('20')
        const actionArgs = [
          {
            actionType: ActionType.WithdrawCollateral,
            owner: accountOwner1,
            sender: accountOwner1,
            asset: usdc.address,
            vaultId: '1350',
            amount: collateralToWithdraw.toNumber(),
            index: '1',
            data: ZERO_ADDR,
          },
        ]

        await expectRevert(controller.operate(actionArgs, {from: accountOwner1}), 'Controller: invalid vault id')
      })

      it('should revert withdrawing collateral asset amount greater than the vault balance', async () => {
        const vaultCounter = new BigNumber(await controller.getAccountVaultCounter(accountOwner1))
        assert.isAbove(vaultCounter.toNumber(), 0, 'Account owner have no vault')

        const vaultBefore = await controller.getVault(accountOwner1, vaultCounter)
        const collateralToWithdraw = new BigNumber(vaultBefore.collateralAmounts[0]).plus(1)
        const actionArgs = [
          {
            actionType: ActionType.WithdrawCollateral,
            owner: accountOwner1,
            sender: accountOwner1,
            asset: usdc.address,
            vaultId: vaultCounter.toNumber(),
            amount: collateralToWithdraw.toNumber(),
            index: '0',
            data: ZERO_ADDR,
          },
        ]

        await expectRevert(controller.operate(actionArgs, {from: accountOwner1}), 'SafeMath: subtraction overflow')
      })

      it('should withdraw collateral to any random address where msg.sender is account owner', async () => {
        const vaultCounter = new BigNumber(await controller.getAccountVaultCounter(accountOwner1))
        assert.isAbove(vaultCounter.toNumber(), 0, 'Account owner have no vault')

        const collateralToWithdraw = new BigNumber('10')
        const actionArgs = [
          {
            actionType: ActionType.WithdrawCollateral,
            owner: accountOwner1,
            sender: random,
            asset: usdc.address,
            vaultId: vaultCounter.toNumber(),
            amount: collateralToWithdraw.toNumber(),
            index: '0',
            data: ZERO_ADDR,
          },
        ]
        const marginPoolBalanceBefore = new BigNumber(await usdc.balanceOf(marginPool.address))
        const receiverBalanceBefore = new BigNumber(await usdc.balanceOf(random))
        const vaultBefore = await controller.getVault(accountOwner1, vaultCounter)

        await controller.operate(actionArgs, {from: accountOwner1})

        const marginPoolBalanceAfter = new BigNumber(await usdc.balanceOf(marginPool.address))
        const receiverBalanceAfter = new BigNumber(await usdc.balanceOf(random))
        const vaultAfter = await controller.getVault(accountOwner1, vaultCounter)

        assert.equal(
          marginPoolBalanceBefore.minus(marginPoolBalanceAfter).toString(),
          collateralToWithdraw.toString(),
          'Margin pool collateral asset balance mismatch',
        )
        assert.equal(
          receiverBalanceAfter.minus(receiverBalanceBefore).toString(),
          collateralToWithdraw.toString(),
          'Receiver collateral asset balance mismatch',
        )
        assert.equal(vaultAfter.collateralAssets.length, 1, 'Vault collateral asset array length mismatch')
        assert.equal(
          new BigNumber(vaultBefore.collateralAmounts[0])
            .minus(new BigNumber(vaultAfter.collateralAmounts[0]))
            .toString(),
          collateralToWithdraw.toString(),
          'Collateral asset amount in vault after withdraw mismatch',
        )
      })

      it('should withdraw collateral asset to any random address where msg.sender is account operator', async () => {
        assert.equal(await controller.isOperator(accountOwner1, accountOperator1), true, 'Operator address mismatch')

        const vaultCounter = new BigNumber(await controller.getAccountVaultCounter(accountOwner1))
        assert.isAbove(vaultCounter.toNumber(), 0, 'Account owner have no vault')

        const collateralToWithdraw = new BigNumber('10')
        const actionArgs = [
          {
            actionType: ActionType.WithdrawCollateral,
            owner: accountOwner1,
            sender: random,
            asset: usdc.address,
            vaultId: vaultCounter.toNumber(),
            amount: collateralToWithdraw.toNumber(),
            index: '0',
            data: ZERO_ADDR,
          },
        ]
        const marginPoolBalanceBefore = new BigNumber(await usdc.balanceOf(marginPool.address))
        const receiverBalanceBefore = new BigNumber(await usdc.balanceOf(random))
        const vaultBefore = await controller.getVault(accountOwner1, vaultCounter)

        await controller.operate(actionArgs, {from: accountOperator1})

        const marginPoolBalanceAfter = new BigNumber(await usdc.balanceOf(marginPool.address))
        const receiverBalanceAfter = new BigNumber(await usdc.balanceOf(random))
        const vaultAfter = await controller.getVault(accountOwner1, vaultCounter)

        assert.equal(
          marginPoolBalanceBefore.minus(marginPoolBalanceAfter).toString(),
          collateralToWithdraw.toString(),
          'Margin pool collateral asset balance mismatch',
        )
        assert.equal(
          receiverBalanceAfter.minus(receiverBalanceBefore).toString(),
          collateralToWithdraw.toString(),
          'Receiver collateral asset balance mismatch',
        )
        assert.equal(vaultAfter.collateralAssets.length, 1, 'Vault collateral asset array length mismatch')
        assert.equal(
          new BigNumber(vaultBefore.collateralAmounts[0])
            .minus(new BigNumber(vaultAfter.collateralAmounts[0]))
            .toString(),
          collateralToWithdraw.toString(),
          'Collateral asset amount in vault after withdraw mismatch',
        )
      })

      it('should execute withdrawing collateral asset in mutliple actions', async () => {
        const vaultCounter = new BigNumber(await controller.getAccountVaultCounter(accountOwner1))
        assert.isAbove(vaultCounter.toNumber(), 0, 'Account owner have no vault')

        const collateralToWithdraw = new BigNumber('10')
        const actionArgs = [
          {
            actionType: ActionType.WithdrawCollateral,
            owner: accountOwner1,
            sender: accountOwner1,
            asset: usdc.address,
            vaultId: vaultCounter.toNumber(),
            amount: collateralToWithdraw.toNumber(),
            index: '0',
            data: ZERO_ADDR,
          },
          {
            actionType: ActionType.WithdrawCollateral,
            owner: accountOwner1,
            sender: accountOwner1,
            asset: usdc.address,
            vaultId: vaultCounter.toNumber(),
            amount: collateralToWithdraw.toNumber(),
            index: '0',
            data: ZERO_ADDR,
          },
        ]
        const marginPoolBalanceBefore = new BigNumber(await usdc.balanceOf(marginPool.address))
        const receiverBalanceBefore = new BigNumber(await usdc.balanceOf(accountOwner1))
        const vaultBefore = await controller.getVault(accountOwner1, vaultCounter)

        await controller.operate(actionArgs, {from: accountOwner1})

        const marginPoolBalanceAfter = new BigNumber(await usdc.balanceOf(marginPool.address))
        const receiverBalanceAfter = new BigNumber(await usdc.balanceOf(accountOwner1))
        const vaultAfter = await controller.getVault(accountOwner1, vaultCounter)

        assert.equal(
          marginPoolBalanceBefore.minus(marginPoolBalanceAfter).toString(),
          collateralToWithdraw.multipliedBy(2).toString(),
          'Margin pool collateral asset balance mismatch',
        )
        assert.equal(
          receiverBalanceAfter.minus(receiverBalanceBefore).toString(),
          collateralToWithdraw.multipliedBy(2).toString(),
          'Receiver collateral asset balance mismatch',
        )
        assert.equal(vaultAfter.collateralAssets.length, 1, 'Vault long otoken array length mismatch')
        assert.equal(
          new BigNumber(vaultBefore.collateralAmounts[0])
            .minus(new BigNumber(vaultAfter.collateralAmounts[0]))
            .toString(),
          collateralToWithdraw.multipliedBy(2).toString(),
          'Collateral asset amount in vault after withdraw mismatch',
        )
      })*/

      it('should remove short otoken address from short otokens array if amount is equal to zero after burnign', async () => {
        // send back all short otoken to owner
        const operatorShortBalance = new BigNumber(await shortOtoken.balanceOf(accountOperator1))
        await shortOtoken.transfer(accountOwner1, operatorShortBalance, {from: accountOperator1})

        const vaultCounter = new BigNumber(await controller.getAccountVaultCounter(accountOwner1))
        assert.isAbove(vaultCounter.toNumber(), 0, 'Account owner have no vault')

        const vaultBefore = await controller.getVault(accountOwner1, vaultCounter)

        const shortOtokenToBurn = new BigNumber(vaultBefore.shortAmounts[0])
        console.log(shortOtokenToBurn.toString())
        console.log(new BigNumber(await shortOtoken.balanceOf(accountOwner1)).toString())
        const actionArgs = [
          {
            actionType: ActionType.BurnShortOption,
            owner: accountOwner1,
            sender: accountOwner1,
            asset: shortOtoken.address,
            vaultId: vaultCounter.toNumber(),
            amount: shortOtokenToBurn.toNumber(),
            index: '0',
            data: ZERO_ADDR,
          },
        ]
        const sellerBalanceBefore = new BigNumber(await shortOtoken.balanceOf(accountOwner1))

        await controller.operate(actionArgs, {from: accountOwner1})

        const sellerBalanceAfter = new BigNumber(await shortOtoken.balanceOf(accountOwner1))
        const vaultAfter = await controller.getVault(accountOwner1, vaultCounter)

        assert.equal(
          sellerBalanceBefore.minus(sellerBalanceAfter).toString(),
          shortOtokenToBurn.toString(),
          'Short otoken burned amount mismatch',
        )
        assert.equal(vaultAfter.shortOtokens.length, 1, 'Vault short otoken array length mismatch')
        assert.equal(vaultAfter.shortOtokens[0], ZERO_ADDR, 'Vault short otoken address after clearing mismatch')
        assert.equal(
          new BigNumber(vaultBefore.shortAmounts[0]).minus(new BigNumber(vaultAfter.shortAmounts[0])).toString(),
          shortOtokenToBurn.toString(),
          'Short otoken amount in vault after burn mismatch',
        )
      })
    })
  })

  describe('Check if price is finalized', () => {
    let expiredOtoken: MockOtokenInstance
    let expiry: BigNumber

    before(async () => {
      expiry = new BigNumber(await time.latest())
      expiredOtoken = await MockOtoken.new()
      // init otoken
      await expiredOtoken.init(
        addressBook.address,
        weth.address,
        usdc.address,
        usdc.address,
        new BigNumber(200).times(new BigNumber(10).exponentiatedBy(18)),
        new BigNumber(await time.latest()),
        true,
      )

      // set not finalized
      await oracle.setIsFinalized(weth.address, expiry, true)
    })

    it('should return false when price is pushed and dispute period not over yet', async () => {
      const priceMock = new BigNumber('200')
      await oracle.setIsFinalized(weth.address, expiry, true)

      // Mock oracle returned data.
      await oracle.setIsLockingPeriodOver(weth.address, expiry, true)
      await oracle.setIsDisputePeriodOver(weth.address, expiry, false)
      await oracle.setIsFinalized(weth.address, expiry, false)
      await oracle.setExpiryPrice(weth.address, expiry, priceMock)

      const expectedResutl = false
      assert.equal(
        await controller.isPriceFinalized(expiredOtoken.address),
        expectedResutl,
        'Price is not finalized because dispute period is not over yet',
      )
    })

    it('should return true when price is finalized', async () => {
      expiredOtoken = await MockOtoken.new()
      const expiry = new BigNumber(await time.latest())
      // init otoken
      await expiredOtoken.init(
        addressBook.address,
        weth.address,
        usdc.address,
        usdc.address,
        new BigNumber(200).times(new BigNumber(10).exponentiatedBy(18)),
        expiry,
        true,
      )

      // Mock oracle: dispute period over, set price to 200.
      const priceMock = new BigNumber('200')
      await oracle.setIsLockingPeriodOver(weth.address, expiry, true)
      await oracle.setIsDisputePeriodOver(weth.address, expiry, true)
      await oracle.setExpiryPrice(weth.address, expiry, priceMock)
      await oracle.setIsFinalized(weth.address, expiry, true)

      const expectedResutl = true
      assert.equal(await controller.isPriceFinalized(expiredOtoken.address), expectedResutl, 'Price is not finalized')
    })
  })

  describe('Expiry', () => {
    it('should return false for non expired otoken', async () => {
      assert.equal(await controller.isExpired(otoken.address), false, 'Otoken expiry check mismatch')
    })

    it('should return true for expired otoken', async () => {
      // Otoken deployment
      const expiredOtoken = await MockOtoken.new()
      // init otoken
      await expiredOtoken.init(
        addressBook.address,
        weth.address,
        usdc.address,
        usdc.address,
        new BigNumber(200).times(new BigNumber(10).exponentiatedBy(18)),
        1219835219,
        true,
      )

      assert.equal(await controller.isExpired(expiredOtoken.address), true, 'Otoken expiry check mismatch')
    })
  })

  describe('Pause system', () => {
    it('should revert when pausing the system from non-owner', async () => {
      await expectRevert(controller.setSystemPaused(true, {from: random}), 'Ownable: caller is not the owner')
    })

    it('should pause system', async () => {
      const stateBefore = await controller.systemPaused()
      assert.equal(stateBefore, false, 'System already paused')

      await controller.setSystemPaused(true)

      const stateAfter = await controller.systemPaused()
      assert.equal(stateAfter, true, 'System not paused')
    })
  })
})
