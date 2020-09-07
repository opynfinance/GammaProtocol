import {
  MockMarginCalculatorInstance,
  MockOtokenInstance,
  MockERC20Instance,
  MockOracleInstance,
  MockWhitelistModuleInstance,
  MarginPoolInstance,
  ControllerInstance,
  AddressBookInstance,
  OwnedUpgradeabilityProxyInstance,
} from '../build/types/truffle-types'
import BigNumber from 'bignumber.js'

const {expectRevert, time} = require('@openzeppelin/test-helpers')

const MockERC20 = artifacts.require('MockERC20.sol')
const MockOtoken = artifacts.require('MockOtoken.sol')
const MockOracle = artifacts.require('MockOracle.sol')
const OwnedUpgradeabilityProxy = artifacts.require('OwnedUpgradeabilityProxy.sol')
const MockMarginCalculator = artifacts.require('MockMarginCalculator.sol')
const MockWhitelistModule = artifacts.require('MockWhitelistModule.sol')
const AddressBook = artifacts.require('AddressBook.sol')
const MarginPool = artifacts.require('MarginPool.sol')
const Controller = artifacts.require('Controller.sol')
const MarginAccount = artifacts.require('MarginAccount.sol')

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

contract('Controller', ([owner, accountOwner1, accountOperator1, holder1, random]) => {
  // ERC20 mock
  let usdc: MockERC20Instance
  let weth: MockERC20Instance
  // Oracle module
  let oracle: MockOracleInstance
  // calculator module
  let calculator: MockMarginCalculatorInstance
  // margin pool module
  let marginPool: MarginPoolInstance
  // whitelist module mock
  let whitelist: MockWhitelistModuleInstance
  // addressbook module mock
  let addressBook: AddressBookInstance
  // controller module
  let controllerImplementation: ControllerInstance
  let controllerProxy: ControllerInstance

  before('Deployment', async () => {
    // addressbook deployment
    addressBook = await AddressBook.new()
    // ERC20 deployment
    usdc = await MockERC20.new('USDC', 'USDC', 8)
    weth = await MockERC20.new('WETH', 'WETH', 18)
    // deploy Oracle module
    oracle = await MockOracle.new(addressBook.address, {from: owner})
    // calculator deployment
    calculator = await MockMarginCalculator.new(addressBook.address)
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
    const lib = await MarginAccount.new()
    await Controller.link('MarginAccount', lib.address)
    controllerImplementation = await Controller.new()

    // set controller address in AddressBook
    await addressBook.setController(controllerImplementation.address, {from: owner})

    // check controller deployment
    const controllerProxyAddress = await addressBook.getController()
    controllerProxy = await Controller.at(controllerProxyAddress)
    const proxy: OwnedUpgradeabilityProxyInstance = await OwnedUpgradeabilityProxy.at(controllerProxyAddress)

    assert.equal(await proxy.proxyOwner(), addressBook.address, 'Proxy owner address mismatch')
    assert.equal(await controllerProxy.owner(), owner, 'Controller owner address mismatch')
    assert.equal(await controllerProxy.systemPaused(), false, 'System is paused')

    // make everyone rich
    await usdc.mint(accountOwner1, new BigNumber('1000'))
    await usdc.mint(accountOperator1, new BigNumber('1000'))
    await usdc.mint(random, new BigNumber('1000'))
  })

  describe('Controller initialization', () => {
    it('should revert when calling initialize if it is already initalized', async () => {
      await expectRevert(
        controllerProxy.initialize(addressBook.address, owner),
        'Contract instance has already been initialized',
      )
    })
  })

  describe('Account operator', () => {
    it('should set operator', async () => {
      assert.equal(
        await controllerProxy.isOperator(accountOwner1, accountOperator1),
        false,
        'Address is already an operator',
      )

      await controllerProxy.setOperator(accountOperator1, true, {from: accountOwner1})

      assert.equal(await controllerProxy.isOperator(accountOwner1, accountOperator1), true, 'Operator address mismatch')
    })

    it('should be able to remove operator', async () => {
      await controllerProxy.setOperator(accountOperator1, false, {from: accountOwner1})

      assert.equal(
        await controllerProxy.isOperator(accountOwner1, accountOperator1),
        false,
        'Operator address mismatch',
      )
    })
  })

  describe('Vault', () => {
    // will be improved in later PR
    it('should get vault', async () => {
      const vaultId = new BigNumber(0)
      await controllerProxy.getVault(accountOwner1, vaultId)
    })

    // will be improved in later PR
    it('should get vault balance', async () => {
      const vaultId = new BigNumber(0)
      await controllerProxy.getVaultBalances(accountOwner1, vaultId)
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
        controllerProxy.operate(actionArgs, {from: random}),
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
        controllerProxy.operate(actionArgs, {from: accountOwner1}),
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
        controllerProxy.operate(actionArgs, {from: accountOwner1}),
        'Controller: can not run actions on different vaults',
      )
    })

    it('should open vault', async () => {
      const vaultCounterBefore = new BigNumber(await controllerProxy.getAccountVaultCounter(accountOwner1))
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
      await controllerProxy.operate(actionArgs, {from: accountOwner1})

      const vaultCounterAfter = new BigNumber(await controllerProxy.getAccountVaultCounter(accountOwner1))
      assert.equal(vaultCounterAfter.minus(vaultCounterBefore).toString(), '1', 'vault counter after mismatch')
    })

    it('should open vault from account operator', async () => {
      await controllerProxy.setOperator(accountOperator1, true, {from: accountOwner1})
      assert.equal(await controllerProxy.isOperator(accountOwner1, accountOperator1), true, 'Operator address mismatch')

      const vaultCounterBefore = new BigNumber(await controllerProxy.getAccountVaultCounter(accountOwner1))

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
      await controllerProxy.operate(actionArgs, {from: accountOperator1})

      const vaultCounterAfter = new BigNumber(await controllerProxy.getAccountVaultCounter(accountOwner1))
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
        const vaultCounter = new BigNumber(await controllerProxy.getAccountVaultCounter(accountOwner1))
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
          controllerProxy.operate(actionArgs, {from: accountOwner1}),
          'Controller: otoken is not whitelisted to be used as collateral',
        )
      })

      it('should deposit long otoken into vault from account owner', async () => {
        // whitelist otoken
        await whitelist.whitelistOtoken(longOtoken.address)

        const vaultCounter = new BigNumber(await controllerProxy.getAccountVaultCounter(accountOwner1))
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
        await controllerProxy.operate(actionArgs, {from: accountOwner1})

        const marginPoolBalanceAfter = new BigNumber(await longOtoken.balanceOf(marginPool.address))
        const senderBalanceAfter = new BigNumber(await longOtoken.balanceOf(accountOwner1))
        const vaultAfter = await controllerProxy.getVault(accountOwner1, vaultCounter)

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
        assert.equal(
          await controllerProxy.isOperator(accountOwner1, accountOperator1),
          true,
          'Operator address mismatch',
        )

        const vaultCounter = new BigNumber(await controllerProxy.getAccountVaultCounter(accountOwner1))
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
        const vaultBefore = await controllerProxy.getVault(accountOwner1, vaultCounter)

        await longOtoken.approve(marginPool.address, collateralToDeposit, {from: accountOperator1})
        await controllerProxy.operate(actionArgs, {from: accountOperator1})

        const marginPoolBalanceAfter = new BigNumber(await longOtoken.balanceOf(marginPool.address))
        const senderBalanceAfter = new BigNumber(await longOtoken.balanceOf(accountOperator1))
        const vaultAfter = await controllerProxy.getVault(accountOwner1, vaultCounter)

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
        const vaultCounter = new BigNumber(await controllerProxy.getAccountVaultCounter(accountOwner1))
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
        const vaultBefore = await controllerProxy.getVault(accountOwner1, vaultCounter)

        await longOtoken.approve(marginPool.address, collateralToDeposit.multipliedBy(2), {from: accountOwner1})
        await controllerProxy.operate(actionArgs, {from: accountOwner1})

        const marginPoolBalanceAfter = new BigNumber(await longOtoken.balanceOf(marginPool.address))
        const senderBalanceAfter = new BigNumber(await longOtoken.balanceOf(accountOwner1))
        const vaultAfter = await controllerProxy.getVault(accountOwner1, vaultCounter)

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
        const vaultCounter = new BigNumber(await controllerProxy.getAccountVaultCounter(accountOwner1))
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
          controllerProxy.operate(actionArgs, {from: accountOperator1}),
          'Controller: depositor address and msg.sender address mismatch',
        )
      })

      it('should revert depositing long otoken with amount equal to zero', async () => {
        const vaultCounter = new BigNumber(await controllerProxy.getAccountVaultCounter(accountOwner1))
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
          controllerProxy.operate(actionArgs, {from: accountOwner1}),
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

        const vaultCounter = new BigNumber(await controllerProxy.getAccountVaultCounter(accountOwner1))
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
          controllerProxy.operate(actionArgs, {from: accountOwner1}),
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
        const vaultCounter = new BigNumber(await controllerProxy.getAccountVaultCounter(accountOwner1))
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
          controllerProxy.operate(actionArgs, {from: accountOwner1}),
          'MarginCalculator: Too many long otokens in the vault.',
        )
      })
    })

    describe('withdraw long otoken', () => {
      it('should revert withdrawing long otoken with wrong index from a vault', async () => {
        const vaultCounter = new BigNumber(await controllerProxy.getAccountVaultCounter(accountOwner1))
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
          controllerProxy.operate(actionArgs, {from: accountOwner1}),
          'MarginAccount: long otoken address mismatch',
        )
      })

      it('should revert withdrawing long otoken from random address other than account owner or operator', async () => {
        const vaultCounter = new BigNumber(await controllerProxy.getAccountVaultCounter(accountOwner1))
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
          controllerProxy.operate(actionArgs, {from: random}),
          'Controller: msg.sender is not authorized to run action',
        )
      })

      it('should revert withdrawing long otoken amount equal to zero', async () => {
        const vaultCounter = new BigNumber(await controllerProxy.getAccountVaultCounter(accountOwner1))
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
          controllerProxy.operate(actionArgs, {from: accountOwner1}),
          'MarginPool: transferToUser amount is equal to 0',
        )
      })

      it('should revert withdrawing long otoken amount greater than the vault balance', async () => {
        const vaultCounter = new BigNumber(await controllerProxy.getAccountVaultCounter(accountOwner1))
        assert.isAbove(vaultCounter.toNumber(), 0, 'Account owner have no vault')

        const vaultBefore = await controllerProxy.getVault(accountOwner1, vaultCounter)
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

        await expectRevert(controllerProxy.operate(actionArgs, {from: accountOwner1}), 'SafeMath: subtraction overflow')
      })

      it('should withdraw long otoken to any random address where msg.sender is account owner', async () => {
        const vaultCounter = new BigNumber(await controllerProxy.getAccountVaultCounter(accountOwner1))
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
        const vaultBefore = await controllerProxy.getVault(accountOwner1, vaultCounter)

        await controllerProxy.operate(actionArgs, {from: accountOwner1})

        const marginPoolBalanceAfter = new BigNumber(await longOtoken.balanceOf(marginPool.address))
        const receiverBalanceAfter = new BigNumber(await longOtoken.balanceOf(random))
        const vaultAfter = await controllerProxy.getVault(accountOwner1, vaultCounter)

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
        assert.equal(
          await controllerProxy.isOperator(accountOwner1, accountOperator1),
          true,
          'Operator address mismatch',
        )

        const vaultCounter = new BigNumber(await controllerProxy.getAccountVaultCounter(accountOwner1))
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
        const vaultBefore = await controllerProxy.getVault(accountOwner1, vaultCounter)

        await controllerProxy.operate(actionArgs, {from: accountOperator1})

        const marginPoolBalanceAfter = new BigNumber(await longOtoken.balanceOf(marginPool.address))
        const receiverBalanceAfter = new BigNumber(await longOtoken.balanceOf(random))
        const vaultAfter = await controllerProxy.getVault(accountOwner1, vaultCounter)

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
        const vaultCounter = new BigNumber(await controllerProxy.getAccountVaultCounter(accountOwner1))
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
        const vaultBefore = await controllerProxy.getVault(accountOwner1, vaultCounter)

        await controllerProxy.operate(actionArgs, {from: accountOwner1})

        const marginPoolBalanceAfter = new BigNumber(await longOtoken.balanceOf(marginPool.address))
        const receiverBalanceAfter = new BigNumber(await longOtoken.balanceOf(accountOwner1))
        const vaultAfter = await controllerProxy.getVault(accountOwner1, vaultCounter)

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
        const vaultCounter = new BigNumber(await controllerProxy.getAccountVaultCounter(accountOwner1))
        assert.isAbove(vaultCounter.toNumber(), 0, 'Account owner have no vault')

        const vaultBefore = await controllerProxy.getVault(accountOwner1, vaultCounter)

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

        await controllerProxy.operate(actionArgs, {from: accountOwner1})

        const marginPoolBalanceAfter = new BigNumber(await longOtoken.balanceOf(marginPool.address))
        const receiverBalanceAfter = new BigNumber(await longOtoken.balanceOf(accountOwner1))
        const vaultAfter = await controllerProxy.getVault(accountOwner1, vaultCounter)

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
          await controllerProxy.operate(actionArgs, {from: accountOwner1})
          const vaultAfter = await controllerProxy.getVault(accountOwner1, vaultId)
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
          const vault = await controllerProxy.getVault(accountOwner1, vaultId)
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

          assert.equal(
            await controllerProxy.isExpired(expiredLongOtoken.address),
            true,
            'Long otoken is not expired yet',
          )

          await expectRevert(
            controllerProxy.operate(actionArgs, {from: accountOwner1}),
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
        const vaultCounter = new BigNumber(await controllerProxy.getAccountVaultCounter(accountOwner1))
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
        await controllerProxy.operate(actionArgs, {from: accountOwner1})

        const marginPoolBalanceAfter = new BigNumber(await usdc.balanceOf(marginPool.address))
        const senderBalanceAfter = new BigNumber(await usdc.balanceOf(accountOwner1))
        const vaultAfter = await controllerProxy.getVault(accountOwner1, vaultCounter)

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
        const vaultCounter = new BigNumber(await controllerProxy.getAccountVaultCounter(accountOwner1))
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
        const vaultBefore = await controllerProxy.getVault(accountOwner1, vaultCounter)

        await usdc.approve(marginPool.address, collateralToDeposit, {from: accountOperator1})
        await controllerProxy.operate(actionArgs, {from: accountOperator1})

        const marginPoolBalanceAfter = new BigNumber(await usdc.balanceOf(marginPool.address))
        const senderBalanceAfter = new BigNumber(await usdc.balanceOf(accountOperator1))
        const vaultAfter = await controllerProxy.getVault(accountOwner1, vaultCounter)

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
        const vaultCounter = new BigNumber(await controllerProxy.getAccountVaultCounter(accountOwner1))
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
          controllerProxy.operate(actionArgs, {from: accountOwner1}),
          'Controller: depositor address and msg.sender address mismatch',
        )
      })

      it('should revert depositing a collateral asset with amount equal to zero', async () => {
        const vaultCounter = new BigNumber(await controllerProxy.getAccountVaultCounter(accountOwner1))
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
          controllerProxy.operate(actionArgs, {from: accountOwner1}),
          'MarginAccount: invalid collateral amount',
        )
      })

      it('should execute depositing collateral into vault in multiple actions', async () => {
        const vaultCounter = new BigNumber(await controllerProxy.getAccountVaultCounter(accountOwner1))
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
        const vaultBefore = await controllerProxy.getVault(accountOwner1, vaultCounter)

        await usdc.approve(marginPool.address, collateralToDeposit.multipliedBy(2), {from: accountOwner1})
        await controllerProxy.operate(actionArgs, {from: accountOwner1})

        const marginPoolBalanceAfter = new BigNumber(await usdc.balanceOf(marginPool.address))
        const senderBalanceAfter = new BigNumber(await usdc.balanceOf(accountOwner1))
        const vaultAfter = await controllerProxy.getVault(accountOwner1, vaultCounter)

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

          const vaultCounter = new BigNumber(await controllerProxy.getAccountVaultCounter(accountOwner1))
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
            controllerProxy.operate(actionArgs, {from: accountOwner1}),
            'Controller: asset is not whitelisted to be used as collateral',
          )
        })
      })

      it('should revert when vault have more than 1 collateral type', async () => {
        const collateralToDeposit = new BigNumber('20')
        //whitelist weth to use in this test
        await whitelist.whitelistCollateral(weth.address)
        await weth.mint(accountOwner1, collateralToDeposit)

        const vaultCounter = new BigNumber(await controllerProxy.getAccountVaultCounter(accountOwner1))
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
          controllerProxy.operate(actionArgs, {from: accountOwner1}),
          'MarginCalculator: Too many collateral assets in the vault.',
        )
      })
    })

    describe('withdraw collateral', () => {
      it('should revert withdrawing collateral asset with wrong index from a vault', async () => {
        const vaultCounter = new BigNumber(await controllerProxy.getAccountVaultCounter(accountOwner1))
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
          controllerProxy.operate(actionArgs, {from: accountOwner1}),
          'MarginAccount: collateral token address mismatch',
        )
      })

      it('should revert withdrawing collateral asset from an invalid id', async () => {
        const vaultCounter = new BigNumber(await controllerProxy.getAccountVaultCounter(accountOwner1))
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

        await expectRevert(controllerProxy.operate(actionArgs, {from: accountOwner1}), 'Controller: invalid vault id')
      })

      it('should revert withdrawing collateral asset amount greater than the vault balance', async () => {
        const vaultCounter = new BigNumber(await controllerProxy.getAccountVaultCounter(accountOwner1))
        assert.isAbove(vaultCounter.toNumber(), 0, 'Account owner have no vault')

        const vaultBefore = await controllerProxy.getVault(accountOwner1, vaultCounter)
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

        await expectRevert(controllerProxy.operate(actionArgs, {from: accountOwner1}), 'SafeMath: subtraction overflow')
      })

      it('should withdraw collateral to any random address where msg.sender is account owner', async () => {
        const vaultCounter = new BigNumber(await controllerProxy.getAccountVaultCounter(accountOwner1))
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
        const vaultBefore = await controllerProxy.getVault(accountOwner1, vaultCounter)

        await controllerProxy.operate(actionArgs, {from: accountOwner1})

        const marginPoolBalanceAfter = new BigNumber(await usdc.balanceOf(marginPool.address))
        const receiverBalanceAfter = new BigNumber(await usdc.balanceOf(random))
        const vaultAfter = await controllerProxy.getVault(accountOwner1, vaultCounter)

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
        assert.equal(
          await controllerProxy.isOperator(accountOwner1, accountOperator1),
          true,
          'Operator address mismatch',
        )

        const vaultCounter = new BigNumber(await controllerProxy.getAccountVaultCounter(accountOwner1))
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
        const vaultBefore = await controllerProxy.getVault(accountOwner1, vaultCounter)

        await controllerProxy.operate(actionArgs, {from: accountOperator1})

        const marginPoolBalanceAfter = new BigNumber(await usdc.balanceOf(marginPool.address))
        const receiverBalanceAfter = new BigNumber(await usdc.balanceOf(random))
        const vaultAfter = await controllerProxy.getVault(accountOwner1, vaultCounter)

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
        const vaultCounter = new BigNumber(await controllerProxy.getAccountVaultCounter(accountOwner1))
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
        const vaultBefore = await controllerProxy.getVault(accountOwner1, vaultCounter)

        await controllerProxy.operate(actionArgs, {from: accountOwner1})

        const marginPoolBalanceAfter = new BigNumber(await usdc.balanceOf(marginPool.address))
        const receiverBalanceAfter = new BigNumber(await usdc.balanceOf(accountOwner1))
        const vaultAfter = await controllerProxy.getVault(accountOwner1, vaultCounter)

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
        const vaultCounter = new BigNumber(await controllerProxy.getAccountVaultCounter(accountOwner1))
        assert.isAbove(vaultCounter.toNumber(), 0, 'Account owner have no vault')

        const vaultBefore = await controllerProxy.getVault(accountOwner1, vaultCounter)

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

        await controllerProxy.operate(actionArgs, {from: accountOwner1})

        const marginPoolBalanceAfter = new BigNumber(await usdc.balanceOf(marginPool.address))
        const receiverBalanceAfter = new BigNumber(await usdc.balanceOf(accountOwner1))
        const vaultAfter = await controllerProxy.getVault(accountOwner1, vaultCounter)

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

      // whitelist short otoken to be used in the protocol
      await whitelist.whitelistOtoken(shortOtoken.address, {from: owner})

      // give free money
      await longOtoken.mintOtoken(accountOwner1, new BigNumber('100'))
      await longOtoken.mintOtoken(accountOperator1, new BigNumber('100'))
      await usdc.mint(accountOwner1, new BigNumber('1000000'))
      await usdc.mint(accountOperator1, new BigNumber('1000000'))
      await usdc.mint(random, new BigNumber('1000000'))
    })

    describe('Mint short otoken', () => {
      it('should revert minting from random address other than owner or operator', async () => {
        const vaultCounter = new BigNumber(await controllerProxy.getAccountVaultCounter(accountOwner1))
        assert.isAbove(vaultCounter.toNumber(), 0, 'Account owner have no vault')

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
        ]

        await expectRevert(
          controllerProxy.operate(actionArgs, {from: random}),
          'Controller: msg.sender is not authorized to run action',
        )
      })

      it('should revert minting using un-marginable collateral asset', async () => {
        const vaultCounter = new BigNumber(await controllerProxy.getAccountVaultCounter(accountOwner1))
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
            asset: weth.address,
            vaultId: vaultCounter.toNumber(),
            amount: collateralToDeposit.toNumber(),
            index: '0',
            data: ZERO_ADDR,
          },
        ]

        // free money
        await weth.mint(accountOwner1, collateralToDeposit)

        await weth.approve(marginPool.address, collateralToDeposit, {from: accountOwner1})
        await expectRevert(
          controllerProxy.operate(actionArgs, {from: accountOwner1}),
          'MarginCalculator: collateral asset not marginable for short asset',
        )
      })

      it('mint naked short otoken from owner', async () => {
        const vaultCounter = new BigNumber(await controllerProxy.getAccountVaultCounter(accountOwner1))
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
        const vaultBefore = await controllerProxy.getVault(accountOwner1, vaultCounter)

        await usdc.approve(marginPool.address, collateralToDeposit, {from: accountOwner1})
        await controllerProxy.operate(actionArgs, {from: accountOwner1})

        const marginPoolBalanceAfter = new BigNumber(await usdc.balanceOf(marginPool.address))
        const senderBalanceAfter = new BigNumber(await usdc.balanceOf(accountOwner1))
        const senderShortBalanceAfter = new BigNumber(await shortOtoken.balanceOf(accountOwner1))
        const vaultAfter = await controllerProxy.getVault(accountOwner1, vaultCounter)

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
        const vaultCounter = new BigNumber(await controllerProxy.getAccountVaultCounter(accountOwner1))
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
        const vaultBefore = await controllerProxy.getVault(accountOwner1, vaultCounter)

        await usdc.approve(marginPool.address, collateralToDeposit, {from: accountOperator1})
        await controllerProxy.operate(actionArgs, {from: accountOperator1})

        const marginPoolBalanceAfter = new BigNumber(await usdc.balanceOf(marginPool.address))
        const senderBalanceAfter = new BigNumber(await usdc.balanceOf(accountOperator1))
        const senderShortBalanceAfter = new BigNumber(await shortOtoken.balanceOf(accountOperator1))
        const vaultAfter = await controllerProxy.getVault(accountOwner1, vaultCounter)

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
        const vaultCounter = new BigNumber(await controllerProxy.getAccountVaultCounter(accountOwner1))
        assert.isAbove(vaultCounter.toNumber(), 0, 'Account owner have no vault')

        const vaultBefore = await controllerProxy.getVault(accountOwner1, vaultCounter)

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
          controllerProxy.operate(actionArgs, {from: accountOwner1}),
          'Controller: invalid final vault state',
        )
      })

      it('should withdraw exceeded collateral from naked short position when net value > 0 ', async () => {
        const vaultCounter = new BigNumber(await controllerProxy.getAccountVaultCounter(accountOwner1))
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
        await controllerProxy.operate(firstActionArgs, {from: accountOwner1})

        const vaultBefore = await controllerProxy.getVault(accountOwner1, vaultCounter)
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

        controllerProxy.operate(secondActionArgs, {from: accountOwner1})

        const vaultAfter = await controllerProxy.getVault(accountOwner1, vaultCounter)
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

        await whitelist.whitelistOtoken(invalidShortOtoken.address, {from: owner})

        const vaultCounter = new BigNumber(await controllerProxy.getAccountVaultCounter(accountOwner1))
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
          controllerProxy.operate(actionArgs, {from: accountOwner1}),
          'MarginCalculator: Too many short otokens in the vault.',
        )
      })

      describe('Mint un-whitelisted short otoken', () => {
        it('should revert minting an otoken that is not whitelisted in Whitelist module', async () => {
          const expiryTime = new BigNumber(60 * 60 * 24) // after 1 day

          const notWhitelistedShortOtoken: MockOtokenInstance = await MockOtoken.new()
          await notWhitelistedShortOtoken.init(
            addressBook.address,
            weth.address,
            usdc.address,
            usdc.address,
            new BigNumber(200).times(new BigNumber(10).exponentiatedBy(18)),
            new BigNumber(await time.latest()).plus(expiryTime),
            true,
          )

          const collateralToDeposit = new BigNumber(await notWhitelistedShortOtoken.strikePrice()).dividedBy(1e18)
          const amountToMint = new BigNumber('1')
          const actionArgs = [
            {
              actionType: ActionType.OpenVault,
              owner: accountOperator1,
              sender: accountOperator1,
              asset: ZERO_ADDR,
              vaultId: '1',
              amount: '0',
              index: '0',
              data: ZERO_ADDR,
            },
            {
              actionType: ActionType.MintShortOption,
              owner: accountOperator1,
              sender: accountOperator1,
              asset: notWhitelistedShortOtoken.address,
              vaultId: '1',
              amount: amountToMint.toNumber(),
              index: '0',
              data: ZERO_ADDR,
            },
            {
              actionType: ActionType.DepositCollateral,
              owner: accountOperator1,
              sender: accountOperator1,
              asset: usdc.address,
              vaultId: '1',
              amount: collateralToDeposit.toNumber(),
              index: '0',
              data: ZERO_ADDR,
            },
          ]

          await usdc.approve(marginPool.address, collateralToDeposit, {from: accountOperator1})
          await expectRevert(
            controllerProxy.operate(actionArgs, {from: accountOperator1}),
            'Controller: otoken is not whitelisted to be minted',
          )
        })
      })

      it('should mint without depositing collater and burn at the same transaction', async () => {
        const vaultCounter = new BigNumber('1')
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
            actionType: ActionType.BurnShortOption,
            owner: accountOwner1,
            sender: accountOwner1,
            asset: shortOtoken.address,
            vaultId: vaultCounter.toNumber(),
            amount: amountToMint.toNumber(),
            index: '0',
            data: ZERO_ADDR,
          },
        ]
        const vaultBefore = await controllerProxy.getVault(accountOwner1, vaultCounter)

        await controllerProxy.operate(actionArgs, {from: accountOwner1})

        const senderShortBalanceAfter = new BigNumber(await shortOtoken.balanceOf(accountOwner1))
        const vaultAfter = await controllerProxy.getVault(accountOwner1, vaultCounter)

        assert.equal(vaultAfter.shortOtokens.length, 1, 'Vault short otoken array length mismatch')
        assert.equal(
          senderShortBalanceAfter.toString(),
          senderShortBalanceAfter.toString(),
          'Sender short otoken amount mismatch',
        )
      })
    })

    describe('Burn short otoken', () => {
      it('should revert burning short otoken with wrong index from a vault', async () => {
        const vaultCounter = new BigNumber(await controllerProxy.getAccountVaultCounter(accountOwner1))
        assert.isAbove(vaultCounter.toNumber(), 0, 'Account owner have no vault')

        const shortOtokenToBurn = new BigNumber(await shortOtoken.balanceOf(accountOwner1))
        const actionArgs = [
          {
            actionType: ActionType.BurnShortOption,
            owner: accountOwner1,
            sender: accountOwner1,
            asset: shortOtoken.address,
            vaultId: vaultCounter.toNumber(),
            amount: shortOtokenToBurn.toNumber(),
            index: '1',
            data: ZERO_ADDR,
          },
        ]

        await expectRevert(
          controllerProxy.operate(actionArgs, {from: accountOwner1}),
          'MarginAccount: short otoken address mismatch',
        )
      })

      it('should revert burning when there is no enough balance', async () => {
        // transfer operator balance
        const operatorShortBalance = new BigNumber(await shortOtoken.balanceOf(accountOperator1))
        await shortOtoken.transfer(accountOwner1, operatorShortBalance, {from: accountOperator1})

        const vaultCounter = new BigNumber(await controllerProxy.getAccountVaultCounter(accountOwner1))
        assert.isAbove(vaultCounter.toNumber(), 0, 'Account owner have no vault')

        const shortOtokenToBurn = new BigNumber(await shortOtoken.balanceOf(accountOwner1))
        const actionArgs = [
          {
            actionType: ActionType.BurnShortOption,
            owner: accountOwner1,
            sender: accountOperator1,
            asset: shortOtoken.address,
            vaultId: vaultCounter.toNumber(),
            amount: shortOtokenToBurn.toNumber(),
            index: '1',
            data: ZERO_ADDR,
          },
        ]

        await expectRevert(
          controllerProxy.operate(actionArgs, {from: accountOperator1}),
          'MarginAccount: short otoken address mismatch',
        )

        // transfer back
        await shortOtoken.transfer(accountOperator1, operatorShortBalance, {from: accountOwner1})
      })

      it('should revert burning when called from an address other than account owner or operator', async () => {
        const vaultCounter = new BigNumber(await controllerProxy.getAccountVaultCounter(accountOwner1))
        assert.isAbove(vaultCounter.toNumber(), 0, 'Account owner have no vault')

        const shortOtokenToBurn = new BigNumber(await shortOtoken.balanceOf(accountOwner1))
        const actionArgs = [
          {
            actionType: ActionType.BurnShortOption,
            owner: accountOwner1,
            sender: accountOwner1,
            asset: usdc.address,
            vaultId: vaultCounter.toNumber(),
            amount: shortOtokenToBurn.toNumber(),
            index: '1',
            data: ZERO_ADDR,
          },
        ]

        await expectRevert(
          controllerProxy.operate(actionArgs, {from: random}),
          'Controller: msg.sender is not authorized to run action',
        )
      })

      it('should burn short otoken when called from account operator', async () => {
        const vaultCounter = new BigNumber(await controllerProxy.getAccountVaultCounter(accountOwner1))
        assert.isAbove(vaultCounter.toNumber(), 0, 'Account owner have no vault')

        const vaultBefore = await controllerProxy.getVault(accountOwner1, vaultCounter)

        const shortOtokenToBurn = new BigNumber(await shortOtoken.balanceOf(accountOperator1))
        const actionArgs = [
          {
            actionType: ActionType.BurnShortOption,
            owner: accountOwner1,
            sender: accountOperator1,
            asset: shortOtoken.address,
            vaultId: vaultCounter.toNumber(),
            amount: shortOtokenToBurn.toNumber(),
            index: '0',
            data: ZERO_ADDR,
          },
        ]
        const sellerBalanceBefore = new BigNumber(await shortOtoken.balanceOf(accountOperator1))

        await controllerProxy.operate(actionArgs, {from: accountOperator1})

        const sellerBalanceAfter = new BigNumber(await shortOtoken.balanceOf(accountOperator1))
        const vaultAfter = await controllerProxy.getVault(accountOwner1, vaultCounter)

        assert.equal(
          sellerBalanceBefore.minus(sellerBalanceAfter).toString(),
          shortOtokenToBurn.toString(),
          'Short otoken burned amount mismatch',
        )
        assert.equal(vaultAfter.shortOtokens.length, 1, 'Vault short otoken array length mismatch')
        assert.equal(
          vaultAfter.shortOtokens[0],
          shortOtoken.address,
          'Vault short otoken address after burning mismatch',
        )
        assert.equal(
          new BigNumber(vaultBefore.shortAmounts[0]).minus(new BigNumber(vaultAfter.shortAmounts[0])).toString(),
          shortOtokenToBurn.toString(),
          'Short otoken amount in vault after burn mismatch',
        )
      })

      it('should remove short otoken address from short otokens array if amount is equal to zero after burning', async () => {
        // send back all short otoken to owner
        const operatorShortBalance = new BigNumber(await shortOtoken.balanceOf(accountOperator1))
        await shortOtoken.transfer(accountOwner1, operatorShortBalance, {from: accountOperator1})

        const vaultCounter = new BigNumber(await controllerProxy.getAccountVaultCounter(accountOwner1))
        assert.isAbove(vaultCounter.toNumber(), 0, 'Account owner have no vault')

        const vaultBefore = await controllerProxy.getVault(accountOwner1, vaultCounter)

        const shortOtokenToBurn = new BigNumber(vaultBefore.shortAmounts[0])
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

        await controllerProxy.operate(actionArgs, {from: accountOwner1})

        const sellerBalanceAfter = new BigNumber(await shortOtoken.balanceOf(accountOwner1))
        const vaultAfter = await controllerProxy.getVault(accountOwner1, vaultCounter)

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

      describe('Burn expired otoken', () => {
        let expiredShortOtoken: MockOtokenInstance

        before(async () => {
          const vaultCounterBefore = new BigNumber(await controllerProxy.getAccountVaultCounter(accountOwner1))
          const expiryTime = new BigNumber(60 * 60) // after 1 hour
          expiredShortOtoken = await MockOtoken.new()
          // init otoken
          await expiredShortOtoken.init(
            addressBook.address,
            weth.address,
            usdc.address,
            usdc.address,
            new BigNumber(200).times(new BigNumber(10).exponentiatedBy(18)),
            new BigNumber(await time.latest()).plus(expiryTime),
            true,
          )

          // whitelist otoken to be minted
          await whitelist.whitelistOtoken(expiredShortOtoken.address, {from: owner})

          const collateralToDeposit = new BigNumber(await expiredShortOtoken.strikePrice()).dividedBy(1e18)
          const amountToMint = new BigNumber('1')
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
            {
              actionType: ActionType.MintShortOption,
              owner: accountOwner1,
              sender: accountOwner1,
              asset: expiredShortOtoken.address,
              vaultId: vaultCounterBefore.toNumber() + 1,
              amount: amountToMint.toNumber(),
              index: '0',
              data: ZERO_ADDR,
            },
            {
              actionType: ActionType.DepositCollateral,
              owner: accountOwner1,
              sender: accountOwner1,
              asset: usdc.address,
              vaultId: vaultCounterBefore.toNumber() + 1,
              amount: collateralToDeposit.toNumber(),
              index: '0',
              data: ZERO_ADDR,
            },
          ]

          const marginPoolBalanceBefore = new BigNumber(await usdc.balanceOf(marginPool.address))
          const senderBalanceBefore = new BigNumber(await usdc.balanceOf(accountOwner1))

          await usdc.approve(marginPool.address, collateralToDeposit, {from: accountOwner1})
          await controllerProxy.operate(actionArgs, {from: accountOwner1})

          const marginPoolBalanceAfter = new BigNumber(await usdc.balanceOf(marginPool.address))
          const senderBalanceAfter = new BigNumber(await usdc.balanceOf(accountOwner1))

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
        })

        it('should revert burning an expired long otoken', async () => {
          // increment time after expiredLongOtoken expiry
          await time.increase(3601) // increase time with one hour in seconds

          const vaultId = new BigNumber(await controllerProxy.getAccountVaultCounter(accountOwner1))
          const vault = await controllerProxy.getVault(accountOwner1, vaultId)
          const shortAmountToBurn = new BigNumber('1')
          const actionArgs = [
            {
              actionType: ActionType.BurnShortOption,
              owner: accountOwner1,
              sender: accountOwner1,
              asset: expiredShortOtoken.address,
              vaultId: vaultId.toNumber(),
              amount: shortAmountToBurn.toNumber(),
              index: '0',
              data: ZERO_ADDR,
            },
          ]

          assert.equal(
            await controllerProxy.isExpired(expiredShortOtoken.address),
            true,
            'Long otoken is not expired yet',
          )

          await expectRevert(
            controllerProxy.operate(actionArgs, {from: accountOwner1}),
            'Controller: can not burn expired otoken',
          )
        })
      })
    })
  })

  describe('Exercise', () => {
    let shortOtoken: MockOtokenInstance

    before(async () => {
      const expiryTime = new BigNumber(60 * 60 * 24) // after 1 day

      shortOtoken = await MockOtoken.new()
      // init otoken
      await shortOtoken.init(
        addressBook.address,
        weth.address,
        usdc.address,
        usdc.address,
        new BigNumber(200).times(new BigNumber(10).exponentiatedBy(18)),
        new BigNumber(await time.latest()).plus(expiryTime),
        true,
      )
      // whitelist short otoken to be used in the protocol
      await whitelist.whitelistOtoken(shortOtoken.address, {from: owner})
      // give free money
      await usdc.mint(accountOwner1, new BigNumber('1000000'))
      await usdc.mint(accountOperator1, new BigNumber('1000000'))
      await usdc.mint(random, new BigNumber('1000000'))
      // open new vault, mintnaked short, sell it to holder 1
      const vaultCounter = new BigNumber(await controllerProxy.getAccountVaultCounter(accountOwner1)).plus(1)
      const collateralToDeposit = new BigNumber(await shortOtoken.strikePrice()).dividedBy(1e18)
      const amountToMint = new BigNumber('1')
      const actionArgs = [
        {
          actionType: ActionType.OpenVault,
          owner: accountOwner1,
          sender: accountOwner1,
          asset: ZERO_ADDR,
          vaultId: vaultCounter.toNumber(),
          amount: '0',
          index: '0',
          data: ZERO_ADDR,
        },
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
      await usdc.approve(marginPool.address, collateralToDeposit, {from: accountOwner1})
      await controllerProxy.operate(actionArgs, {from: accountOwner1})
      // transfer minted short otoken to hodler`
      await shortOtoken.transfer(holder1, amountToMint, {from: accountOwner1})
    })

    it('should revert exercising un-expired otoken', async () => {
      const shortAmountToBurn = new BigNumber('1')
      const actionArgs = [
        {
          actionType: ActionType.Exercise,
          owner: ZERO_ADDR,
          sender: holder1,
          asset: shortOtoken.address,
          vaultId: '0',
          amount: shortAmountToBurn.toNumber(),
          index: '0',
          data: ZERO_ADDR,
        },
      ]

      assert.equal(await controllerProxy.isExpired(shortOtoken.address), false, 'Short otoken is already expired')

      await expectRevert(
        controllerProxy.operate(actionArgs, {from: holder1}),
        'Controller: can not exercise un-expired otoken',
      )
    })

    it('should revert exercising after expiry, when price is not finalized yet', async () => {
      // past time after expiry
      await time.increase(60 * 61 * 24) // increase time with one hour in seconds
      // set price in Oracle Mock, 150$ at expiry, expire ITM
      await oracle.setExpiryPrice(
        await shortOtoken.underlyingAsset(),
        new BigNumber(await shortOtoken.expiryTimestamp()),
        new BigNumber(150).times(new BigNumber(10).exponentiatedBy(18)),
      )
      // set it as not finalized in mock
      await oracle.setIsFinalized(
        await shortOtoken.underlyingAsset(),
        new BigNumber(await shortOtoken.expiryTimestamp()),
        false,
      )

      const shortAmountToBurn = new BigNumber('1')
      const actionArgs = [
        {
          actionType: ActionType.Exercise,
          owner: ZERO_ADDR,
          sender: holder1,
          asset: shortOtoken.address,
          vaultId: '0',
          amount: shortAmountToBurn.toNumber(),
          index: '0',
          data: ZERO_ADDR,
        },
      ]

      assert.equal(await controllerProxy.isExpired(shortOtoken.address), true, 'Short otoken is not expired yet')

      await expectRevert(
        controllerProxy.operate(actionArgs, {from: holder1}),
        'Controller: otoken underlying asset price is not finalized yet',
      )
    })

    it('should revert exercising if cash value receiver address in equal to address zero', async () => {
      // set it as finalized in mock
      await oracle.setIsFinalized(
        await shortOtoken.underlyingAsset(),
        new BigNumber(await shortOtoken.expiryTimestamp()),
        true,
      )

      const shortAmountToBurn = new BigNumber('1')
      const actionArgs = [
        {
          actionType: ActionType.Exercise,
          owner: ZERO_ADDR,
          sender: ZERO_ADDR,
          asset: shortOtoken.address,
          vaultId: '0',
          amount: shortAmountToBurn.toNumber(),
          index: '0',
          data: ZERO_ADDR,
        },
      ]

      assert.equal(await controllerProxy.isExpired(shortOtoken.address), true, 'Short otoken is not expired yet')

      await expectRevert(
        controllerProxy.operate(actionArgs, {from: holder1}),
        'Actions: cannot exercise to an invalid account',
      )
    })

    it('should exercise after expiry + price is finalized', async () => {
      const shortAmountToBurn = new BigNumber('1')
      const actionArgs = [
        {
          actionType: ActionType.Exercise,
          owner: ZERO_ADDR,
          sender: holder1,
          asset: shortOtoken.address,
          vaultId: '0',
          amount: shortAmountToBurn.toNumber(),
          index: '0',
          data: ZERO_ADDR,
        },
      ]
      assert.equal(await controllerProxy.isExpired(shortOtoken.address), true, 'Short otoken is not expired yet')

      const payout = new BigNumber('50')
      const marginPoolBalanceBefore = new BigNumber(await usdc.balanceOf(marginPool.address))
      const senderBalanceBefore = new BigNumber(await usdc.balanceOf(holder1))
      const senderShortBalanceBefore = new BigNumber(await shortOtoken.balanceOf(holder1))

      controllerProxy.operate(actionArgs, {from: holder1})

      const marginPoolBalanceAfter = new BigNumber(await usdc.balanceOf(marginPool.address))
      const senderBalanceAfter = new BigNumber(await usdc.balanceOf(holder1))
      const senderShortBalanceAfter = new BigNumber(await shortOtoken.balanceOf(holder1))

      assert.equal(
        marginPoolBalanceBefore.minus(marginPoolBalanceAfter).toString(),
        payout.toString(),
        'Margin pool collateral asset balance mismatch',
      )
      assert.equal(
        senderBalanceAfter.minus(senderBalanceBefore).toString(),
        payout.toString(),
        'Sender collateral asset balance mismatch',
      )
      assert.equal(
        senderShortBalanceBefore.minus(senderShortBalanceAfter).toString(),
        shortAmountToBurn.toString(),
        ' Burned short otoken amount mismatch',
      )
    })

    describe('Exercise multiple Otokens', () => {
      let firstOtoken: MockOtokenInstance
      let secondOtoken: MockOtokenInstance

      before(async () => {
        const expiryTime = new BigNumber(60 * 60 * 24) // after 1 day

        firstOtoken = await MockOtoken.new()
        secondOtoken = await MockOtoken.new()
        // init otoken
        await firstOtoken.init(
          addressBook.address,
          weth.address,
          usdc.address,
          usdc.address,
          new BigNumber(200).times(new BigNumber(10).exponentiatedBy(18)),
          new BigNumber(await time.latest()).plus(expiryTime),
          true,
        )
        await secondOtoken.init(
          addressBook.address,
          weth.address,
          usdc.address,
          usdc.address,
          new BigNumber(200).times(new BigNumber(10).exponentiatedBy(18)),
          new BigNumber(await time.latest()).plus(expiryTime),
          true,
        )
        // whitelist otoken to be used in the protocol
        await whitelist.whitelistOtoken(firstOtoken.address, {from: owner})
        await whitelist.whitelistOtoken(secondOtoken.address, {from: owner})
        // give free money
        await usdc.mint(accountOwner1, new BigNumber('1000000'))
        await usdc.mint(accountOperator1, new BigNumber('1000000'))
        await usdc.mint(random, new BigNumber('1000000'))
        // open new vault, mint naked short, sell it to holder 1
        const firstCollateralToDeposit = new BigNumber(await firstOtoken.strikePrice()).dividedBy(1e18)
        const secondCollateralToDeposit = new BigNumber(await secondOtoken.strikePrice()).dividedBy(1e18)
        const amountToMint = new BigNumber('1')
        let vaultCounter = new BigNumber(await controllerProxy.getAccountVaultCounter(accountOwner1)).plus(1)
        let actionArgs = [
          {
            actionType: ActionType.OpenVault,
            owner: accountOwner1,
            sender: accountOwner1,
            asset: ZERO_ADDR,
            vaultId: vaultCounter.toNumber(),
            amount: '0',
            index: '0',
            data: ZERO_ADDR,
          },
          {
            actionType: ActionType.MintShortOption,
            owner: accountOwner1,
            sender: accountOwner1,
            asset: firstOtoken.address,
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
            amount: firstCollateralToDeposit.toNumber(),
            index: '0',
            data: ZERO_ADDR,
          },
        ]
        await usdc.approve(marginPool.address, firstCollateralToDeposit, {from: accountOwner1})
        await controllerProxy.operate(actionArgs, {from: accountOwner1})

        vaultCounter = new BigNumber(await controllerProxy.getAccountVaultCounter(accountOwner1)).plus(1)
        actionArgs = [
          {
            actionType: ActionType.OpenVault,
            owner: accountOwner1,
            sender: accountOwner1,
            asset: ZERO_ADDR,
            vaultId: vaultCounter.toNumber(),
            amount: '0',
            index: '0',
            data: ZERO_ADDR,
          },
          {
            actionType: ActionType.MintShortOption,
            owner: accountOwner1,
            sender: accountOwner1,
            asset: secondOtoken.address,
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
            amount: secondCollateralToDeposit.toNumber(),
            index: '0',
            data: ZERO_ADDR,
          },
        ]
        await usdc.approve(marginPool.address, firstCollateralToDeposit, {from: accountOwner1})
        await controllerProxy.operate(actionArgs, {from: accountOwner1})
        // transfer minted short otoken to hodler
        await firstOtoken.transfer(holder1, amountToMint, {from: accountOwner1})
        await secondOtoken.transfer(holder1, amountToMint, {from: accountOwner1})
      })

      it('should exercise multiple Otokens in one transaction', async () => {
        // past time after expiry
        await time.increase(60 * 61 * 24)
        // set price in Oracle Mock, 150$ at expiry, expire ITM
        await oracle.setExpiryPrice(
          await firstOtoken.underlyingAsset(),
          new BigNumber(await firstOtoken.expiryTimestamp()),
          new BigNumber(150).times(new BigNumber(10).exponentiatedBy(18)),
        )
        await oracle.setExpiryPrice(
          await secondOtoken.underlyingAsset(),
          new BigNumber(await secondOtoken.expiryTimestamp()),
          new BigNumber(150).times(new BigNumber(10).exponentiatedBy(18)),
        )
        // set it as finalized in mock
        await oracle.setIsFinalized(
          await firstOtoken.underlyingAsset(),
          new BigNumber(await firstOtoken.expiryTimestamp()),
          true,
        )
        await oracle.setIsFinalized(
          await secondOtoken.underlyingAsset(),
          new BigNumber(await secondOtoken.expiryTimestamp()),
          true,
        )

        const amountToBurn = new BigNumber('1')
        const actionArgs = [
          {
            actionType: ActionType.Exercise,
            owner: ZERO_ADDR,
            sender: holder1,
            asset: firstOtoken.address,
            vaultId: '0',
            amount: amountToBurn.toNumber(),
            index: '0',
            data: ZERO_ADDR,
          },
          {
            actionType: ActionType.Exercise,
            owner: ZERO_ADDR,
            sender: holder1,
            asset: secondOtoken.address,
            vaultId: '0',
            amount: amountToBurn.toNumber(),
            index: '0',
            data: ZERO_ADDR,
          },
        ]

        const payout = new BigNumber('100')
        const marginPoolBalanceBefore = new BigNumber(await usdc.balanceOf(marginPool.address))
        const senderBalanceBefore = new BigNumber(await usdc.balanceOf(holder1))

        await controllerProxy.operate(actionArgs, {from: holder1})

        const marginPoolBalanceAfter = new BigNumber(await usdc.balanceOf(marginPool.address))
        const senderBalanceAfter = new BigNumber(await usdc.balanceOf(holder1))
        const senderFirstBalanceAfter = new BigNumber(await firstOtoken.balanceOf(holder1))
        const senderSecondBalanceAfter = new BigNumber(await secondOtoken.balanceOf(holder1))

        assert.equal(
          marginPoolBalanceBefore.minus(marginPoolBalanceAfter).toString(),
          payout.toString(),
          'Margin pool collateral asset balance mismatch',
        )
        assert.equal(
          senderBalanceAfter.minus(senderBalanceBefore).toString(),
          payout.toString(),
          'Sender collateral asset balance mismatch',
        )
        assert.equal(senderFirstBalanceAfter.toString(), '0', ' Burned first otoken amount mismatch')
        assert.equal(senderSecondBalanceAfter.toString(), '0', ' Burned first otoken amount mismatch')
      })
    })
  })

  describe('Settle vault', () => {
    let shortOtoken: MockOtokenInstance

    before(async () => {
      const expiryTime = new BigNumber(60 * 60 * 24) // after 1 day

      shortOtoken = await MockOtoken.new()
      // init otoken
      await shortOtoken.init(
        addressBook.address,
        weth.address,
        usdc.address,
        usdc.address,
        new BigNumber(200).times(new BigNumber(10).exponentiatedBy(18)),
        new BigNumber(await time.latest()).plus(expiryTime),
        true,
      )
      // whitelist otoken to be used in the protocol
      await whitelist.whitelistOtoken(shortOtoken.address, {from: owner})
      // give free money
      await usdc.mint(accountOwner1, new BigNumber('1000000'))
      await usdc.mint(accountOperator1, new BigNumber('1000000'))
      await usdc.mint(random, new BigNumber('1000000'))
      // open new vault, mint naked short, sell it to holder 1
      const collateralToDespoit = new BigNumber(await shortOtoken.strikePrice()).dividedBy(1e18)
      const amountToMint = new BigNumber('1')
      const vaultCounter = new BigNumber(await controllerProxy.getAccountVaultCounter(accountOwner1)).plus(1)
      const actionArgs = [
        {
          actionType: ActionType.OpenVault,
          owner: accountOwner1,
          sender: accountOwner1,
          asset: ZERO_ADDR,
          vaultId: vaultCounter.toNumber(),
          amount: '0',
          index: '0',
          data: ZERO_ADDR,
        },
        {
          actionType: ActionType.DepositCollateral,
          owner: accountOwner1,
          sender: accountOwner1,
          asset: usdc.address,
          vaultId: vaultCounter.toNumber(),
          amount: collateralToDespoit.toNumber(),
          index: '0',
          data: ZERO_ADDR,
        },
      ]
      await usdc.approve(marginPool.address, collateralToDespoit, {from: accountOwner1})
      await controllerProxy.operate(actionArgs, {from: accountOwner1})
    })

    it('should revert settling a vault that have no minted otoken', async () => {
      const vaultCounter = new BigNumber(await controllerProxy.getAccountVaultCounter(accountOwner1))
      const actionArgs = [
        {
          actionType: ActionType.SettleVault,
          owner: accountOwner1,
          sender: accountOwner1,
          asset: shortOtoken.address,
          vaultId: vaultCounter.toNumber(),
          amount: '0',
          index: '0',
          data: ZERO_ADDR,
        },
      ]

      await expectRevert(
        controllerProxy.operate(actionArgs, {from: accountOwner1}),
        'Controller: can not settle a vault with no otoken minted',
      )
    })

    it('should revert settling vault before expiry', async () => {
      // mint token in vault before
      const amountToMint = new BigNumber('1')
      let vaultCounter = new BigNumber(await controllerProxy.getAccountVaultCounter(accountOwner1))

      let actionArgs = [
        {
          actionType: ActionType.MintShortOption,
          owner: accountOwner1,
          sender: accountOwner1,
          asset: shortOtoken.address,
          vaultId: vaultCounter.toNumber(),
          amount: amountToMint.toString(),
          index: '0',
          data: ZERO_ADDR,
        },
      ]
      await controllerProxy.operate(actionArgs, {from: accountOwner1})
      await shortOtoken.transfer(holder1, amountToMint, {from: accountOwner1})

      vaultCounter = new BigNumber(await controllerProxy.getAccountVaultCounter(accountOwner1))
      actionArgs = [
        {
          actionType: ActionType.SettleVault,
          owner: accountOwner1,
          sender: accountOwner1,
          asset: shortOtoken.address,
          vaultId: vaultCounter.toNumber(),
          amount: '0',
          index: '0',
          data: ZERO_ADDR,
        },
      ]

      await expectRevert(
        controllerProxy.operate(actionArgs, {from: accountOwner1}),
        'Controller: can not settle vault with un-expired otoken',
      )
    })

    it('should revert settling an invalid vault', async () => {
      const vaultCounter = new BigNumber(await controllerProxy.getAccountVaultCounter(accountOwner1))
      const actionArgs = [
        {
          actionType: ActionType.SettleVault,
          owner: accountOwner1,
          sender: accountOwner1,
          asset: shortOtoken.address,
          vaultId: vaultCounter.plus(10000).toNumber(),
          amount: '0',
          index: '0',
          data: ZERO_ADDR,
        },
      ]

      await expectRevert(controllerProxy.operate(actionArgs, {from: accountOwner1}), 'Controller: invalid vault id')
    })

    it('should revert settling after expiry when price is not finalized', async () => {
      // past time after expiry
      await time.increase(60 * 61 * 24) // increase time with one hour in seconds
      // set price in Oracle Mock, 150$ at expiry, expire ITM
      await oracle.setExpiryPrice(
        await shortOtoken.underlyingAsset(),
        new BigNumber(await shortOtoken.expiryTimestamp()),
        new BigNumber(150).times(new BigNumber(10).exponentiatedBy(18)),
      )
      // set it as not finalized in mock
      await oracle.setIsFinalized(
        await shortOtoken.underlyingAsset(),
        new BigNumber(await shortOtoken.expiryTimestamp()),
        false,
      )

      const vaultCounter = new BigNumber(await controllerProxy.getAccountVaultCounter(accountOwner1))
      const actionArgs = [
        {
          actionType: ActionType.SettleVault,
          owner: accountOwner1,
          sender: accountOwner1,
          asset: shortOtoken.address,
          vaultId: vaultCounter.toNumber(),
          amount: '0',
          index: '0',
          data: ZERO_ADDR,
        },
      ]

      assert.equal(await controllerProxy.isExpired(shortOtoken.address), true, 'Short otoken is not expired yet')

      await expectRevert(
        controllerProxy.operate(actionArgs, {from: accountOwner1}),
        'Controller: otoken underlying asset price is not finalized yet',
      )
    })

    it('should settle ITM otoken after expiry + price is finalized', async () => {
      await oracle.setIsFinalized(
        await shortOtoken.underlyingAsset(),
        new BigNumber(await shortOtoken.expiryTimestamp()),
        true,
      )
      const vaultCounter = new BigNumber(await controllerProxy.getAccountVaultCounter(accountOwner1))
      const actionArgs = [
        {
          actionType: ActionType.SettleVault,
          owner: accountOwner1,
          sender: accountOwner1,
          asset: shortOtoken.address,
          vaultId: vaultCounter.toNumber(),
          amount: '0',
          index: '0',
          data: ZERO_ADDR,
        },
      ]

      const payout = new BigNumber('150')
      const marginPoolBalanceBefore = new BigNumber(await usdc.balanceOf(marginPool.address))
      const senderBalanceBefore = new BigNumber(await usdc.balanceOf(accountOwner1))

      controllerProxy.operate(actionArgs, {from: accountOwner1})

      const marginPoolBalanceAfter = new BigNumber(await usdc.balanceOf(marginPool.address))
      const senderBalanceAfter = new BigNumber(await usdc.balanceOf(accountOwner1))

      assert.equal(
        marginPoolBalanceBefore.minus(marginPoolBalanceAfter).toString(),
        payout.toString(),
        'Margin pool collateral asset balance mismatch',
      )
      assert.equal(
        senderBalanceAfter.minus(senderBalanceBefore).toString(),
        payout.toString(),
        'Sender collateral asset balance mismatch',
      )
    })

    describe('Settle multiple vaults ATM and OTM', () => {
      let firstShortOtoken: MockOtokenInstance
      let secondShortOtoken: MockOtokenInstance

      before(async () => {
        // give free money
        await usdc.mint(accountOwner1, new BigNumber('1000000'))
        await usdc.mint(accountOperator1, new BigNumber('1000000'))
        await usdc.mint(random, new BigNumber('1000000'))

        let expiryTime = new BigNumber(60 * 60 * 24) // after 1 day

        firstShortOtoken = await MockOtoken.new()
        await firstShortOtoken.init(
          addressBook.address,
          weth.address,
          usdc.address,
          usdc.address,
          new BigNumber(200).times(new BigNumber(10).exponentiatedBy(18)),
          new BigNumber(await time.latest()).plus(expiryTime),
          true,
        )
        // whitelist otoken to be used in the protocol
        await whitelist.whitelistOtoken(firstShortOtoken.address, {from: owner})
        // open new vault, mint naked short, sell it to holder 1
        let collateralToDespoit = new BigNumber(await firstShortOtoken.strikePrice()).dividedBy(1e18)
        let amountToMint = new BigNumber('1')
        let vaultCounter = new BigNumber(await controllerProxy.getAccountVaultCounter(accountOwner1)).plus(1)
        let actionArgs = [
          {
            actionType: ActionType.OpenVault,
            owner: accountOwner1,
            sender: accountOwner1,
            asset: ZERO_ADDR,
            vaultId: vaultCounter.toNumber(),
            amount: '0',
            index: '0',
            data: ZERO_ADDR,
          },
          {
            actionType: ActionType.MintShortOption,
            owner: accountOwner1,
            sender: accountOwner1,
            asset: firstShortOtoken.address,
            vaultId: vaultCounter.toNumber(),
            amount: amountToMint.toString(),
            index: '0',
            data: ZERO_ADDR,
          },
          {
            actionType: ActionType.DepositCollateral,
            owner: accountOwner1,
            sender: accountOwner1,
            asset: usdc.address,
            vaultId: vaultCounter.toNumber(),
            amount: collateralToDespoit.toNumber(),
            index: '0',
            data: ZERO_ADDR,
          },
        ]
        await usdc.approve(marginPool.address, collateralToDespoit, {from: accountOwner1})
        await controllerProxy.operate(actionArgs, {from: accountOwner1})

        expiryTime = new BigNumber(60 * 60 * 24 * 2) // after 1 day
        secondShortOtoken = await MockOtoken.new()
        await secondShortOtoken.init(
          addressBook.address,
          weth.address,
          usdc.address,
          usdc.address,
          new BigNumber(200).times(new BigNumber(10).exponentiatedBy(18)),
          new BigNumber(await time.latest()).plus(expiryTime),
          true,
        )
        // whitelist otoken to be used in the protocol
        await whitelist.whitelistOtoken(secondShortOtoken.address, {from: owner})
        // open new vault, mint naked short, sell it to holder 1
        collateralToDespoit = new BigNumber(await secondShortOtoken.strikePrice()).dividedBy(1e18)
        amountToMint = new BigNumber('1')
        vaultCounter = new BigNumber(await controllerProxy.getAccountVaultCounter(accountOwner1)).plus(1)
        actionArgs = [
          {
            actionType: ActionType.OpenVault,
            owner: accountOwner1,
            sender: accountOwner1,
            asset: ZERO_ADDR,
            vaultId: vaultCounter.toNumber(),
            amount: '0',
            index: '0',
            data: ZERO_ADDR,
          },
          {
            actionType: ActionType.MintShortOption,
            owner: accountOwner1,
            sender: accountOwner1,
            asset: secondShortOtoken.address,
            vaultId: vaultCounter.toNumber(),
            amount: amountToMint.toString(),
            index: '0',
            data: ZERO_ADDR,
          },
          {
            actionType: ActionType.DepositCollateral,
            owner: accountOwner1,
            sender: accountOwner1,
            asset: usdc.address,
            vaultId: vaultCounter.toNumber(),
            amount: collateralToDespoit.toNumber(),
            index: '0',
            data: ZERO_ADDR,
          },
        ]
        await usdc.approve(marginPool.address, collateralToDespoit, {from: accountOwner1})
        await controllerProxy.operate(actionArgs, {from: accountOwner1})

        await time.increaseTo(new BigNumber(await secondShortOtoken.expiryTimestamp()).plus(1000).toString())
        // set price and finalize it for both otokens
        await oracle.setExpiryPrice(
          await firstShortOtoken.underlyingAsset(),
          new BigNumber(await firstShortOtoken.expiryTimestamp()),
          new BigNumber(200).times(new BigNumber(10).exponentiatedBy(18)),
        )
        await oracle.setIsFinalized(
          await firstShortOtoken.underlyingAsset(),
          new BigNumber(await firstShortOtoken.expiryTimestamp()),
          true,
        )
        await oracle.setExpiryPrice(
          await secondShortOtoken.underlyingAsset(),
          new BigNumber(await secondShortOtoken.expiryTimestamp()),
          new BigNumber(250).times(new BigNumber(10).exponentiatedBy(18)),
        )
        await oracle.setIsFinalized(
          await secondShortOtoken.underlyingAsset(),
          new BigNumber(await secondShortOtoken.expiryTimestamp()),
          true,
        )
      })

      it('should settle multiple vaults in one transaction (ATM,OTM)', async () => {
        const vaultCounter = new BigNumber(await controllerProxy.getAccountVaultCounter(accountOwner1))
        const actionArgs = [
          {
            actionType: ActionType.SettleVault,
            owner: accountOwner1,
            sender: accountOwner1,
            asset: secondShortOtoken.address,
            vaultId: vaultCounter.toNumber(),
            amount: '0',
            index: '0',
            data: ZERO_ADDR,
          },
          {
            actionType: ActionType.SettleVault,
            owner: accountOwner1,
            sender: accountOwner1,
            asset: firstShortOtoken.address,
            vaultId: vaultCounter.minus(1).toNumber(),
            amount: '0',
            index: '0',
            data: ZERO_ADDR,
          },
        ]

        const payout = new BigNumber('400')
        const marginPoolBalanceBefore = new BigNumber(await usdc.balanceOf(marginPool.address))
        const senderBalanceBefore = new BigNumber(await usdc.balanceOf(accountOwner1))

        controllerProxy.operate(actionArgs, {from: accountOwner1})

        const marginPoolBalanceAfter = new BigNumber(await usdc.balanceOf(marginPool.address))
        const senderBalanceAfter = new BigNumber(await usdc.balanceOf(accountOwner1))

        assert.equal(
          marginPoolBalanceBefore.minus(marginPoolBalanceAfter).toString(),
          payout.toString(),
          'Margin pool collateral asset balance mismatch',
        )
        assert.equal(
          senderBalanceAfter.minus(senderBalanceBefore).toString(),
          payout.toString(),
          'Sender collateral asset balance mismatch',
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
        await controllerProxy.isPriceFinalized(expiredOtoken.address),
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
      assert.equal(
        await controllerProxy.isPriceFinalized(expiredOtoken.address),
        expectedResutl,
        'Price is not finalized',
      )
    })
  })

  describe('Expiry', () => {
    it('should return false for non expired otoken', async () => {
      const otoken: MockOtokenInstance = await MockOtoken.new()
      await otoken.init(
        addressBook.address,
        weth.address,
        usdc.address,
        usdc.address,
        new BigNumber(200).times(new BigNumber(10).exponentiatedBy(18)),
        new BigNumber(await time.latest()).plus(60000 * 60000),
        true,
      )

      assert.equal(await controllerProxy.isExpired(otoken.address), false, 'Otoken expiry check mismatch')
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

      assert.equal(await controllerProxy.isExpired(expiredOtoken.address), true, 'Otoken expiry check mismatch')
    })
  })

  describe('Pause system', () => {
    it('should revert when pausing the system from non-owner', async () => {
      await expectRevert(controllerProxy.setSystemPaused(true, {from: random}), 'Ownable: caller is not the owner')
    })

    it('should pause system', async () => {
      const stateBefore = await controllerProxy.systemPaused()
      assert.equal(stateBefore, false, 'System already paused')

      await controllerProxy.setSystemPaused(true)

      const stateAfter = await controllerProxy.systemPaused()
      assert.equal(stateAfter, true, 'System not paused')
    })
  })

  describe('Refresh configuration', () => {
    it('should revert refreshing configuration from address other than owner', async () => {
      await expectRevert(controllerProxy.refreshConfiguration({from: random}), 'Ownable: caller is not the owner')
    })

    it('should refresh configuratiom', async () => {
      // update modules
      const oracle = await MockOracle.new(addressBook.address, {from: owner})
      const calculator = await MockMarginCalculator.new(addressBook.address, {from: owner})
      const marginPool = await MarginPool.new(addressBook.address, {from: owner})
      const whitelist = await MockWhitelistModule.new({from: owner})

      await addressBook.setOracle(oracle.address)
      await addressBook.setMarginCalculator(calculator.address)
      await addressBook.setMarginPool(marginPool.address)
      await addressBook.setWhitelist(whitelist.address)

      // referesh controller configuration
      await controllerProxy.refreshConfiguration()

      assert.equal(await controllerProxy.oracle(), oracle.address, 'Oracle address mismatch after refresh')
      assert.equal(await controllerProxy.calculator(), calculator.address, 'Calculator address mismatch after refresh')
      assert.equal(await controllerProxy.pool(), marginPool.address, 'Oracle address mismatch after refresh')
      assert.equal(await controllerProxy.whitelist(), whitelist.address, 'Oracle address mismatch after refresh')
    })
  })
})
