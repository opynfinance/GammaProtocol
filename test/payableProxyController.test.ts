import {
  WETH9Instance,
  CallTesterInstance,
  MockMarginCalculatorInstance,
  MockOtokenInstance,
  MockERC20Instance,
  MockOracleInstance,
  MockWhitelistModuleInstance,
  MarginPoolInstance,
  ControllerInstance,
  AddressBookInstance,
  OwnedUpgradeabilityProxyInstance,
  PayableProxyControllerInstance,
} from '../build/types/truffle-types'
import BigNumber from 'bignumber.js'

const {expectRevert, expectEvent, time} = require('@openzeppelin/test-helpers')

const WETH9 = artifacts.require('WETH9.sol')
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
const PayableProxyController = artifacts.require('PayableProxyController.sol')

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

contract(
  'PayableProxyController',
  ([owner, accountOwner1, accountOwner2, accountOperator1, holder1, terminator, random]) => {
    // ERC20 mock
    let usdc: MockERC20Instance
    let weth: WETH9Instance
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
    // payable controller proxy
    let payableProxyController: PayableProxyControllerInstance

    before('Deployment', async () => {
      // addressbook deployment
      addressBook = await AddressBook.new()
      // ERC20 deployment
      usdc = await MockERC20.new('USDC', 'USDC', 8)
      weth = await WETH9.new()
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

      payableProxyController = await PayableProxyController.new(
        controllerProxy.address,
        marginPool.address,
        weth.address,
      )

      // make everyone rich
      await usdc.mint(accountOwner1, new BigNumber('1000'))
      await usdc.mint(accountOperator1, new BigNumber('1000'))
      await usdc.mint(random, new BigNumber('1000'))
    })

    describe('Wrap ETH and execute actions', () => {
      it('should deposit a whitelisted collateral asset from account owner', async () => {
        // set payabale proxy as operator
        await controllerProxy.setOperator(payableProxyController.address, true, {from: accountOwner1})
        // whitelist weth
        await whitelist.whitelistCollateral(weth.address)

        const vaultCounter = new BigNumber(await controllerProxy.getAccountVaultCounter(accountOwner1)).plus(1)
        const collateralToDeposit = new BigNumber('5')

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
            sender: payableProxyController.address,
            asset: weth.address,
            vaultId: vaultCounter.toNumber(),
            amount: collateralToDeposit.toNumber(),
            index: '0',
            data: ZERO_ADDR,
          },
        ]

        const marginPoolBalanceBefore = new BigNumber(await weth.balanceOf(marginPool.address))

        await payableProxyController.operate(actionArgs, accountOwner1, {
          from: accountOwner1,
          value: collateralToDeposit.toString(),
        })

        const marginPoolBalanceAfter = new BigNumber(await weth.balanceOf(marginPool.address))
        const vaultAfter = await controllerProxy.getVault(accountOwner1, vaultCounter)

        assert.equal(
          marginPoolBalanceAfter.minus(marginPoolBalanceBefore).toString(),
          collateralToDeposit.toString(),
          'Margin pool balance collateral asset balance mismatch',
        )
        assert.equal(vaultAfter.collateralAssets.length, 1, 'Vault collateral assets array length mismatch')
        assert.equal(
          vaultAfter.collateralAssets[0],
          weth.address,
          'Collateral asset address deposited into vault mismatch',
        )
        assert.equal(
          new BigNumber(vaultAfter.collateralAmounts[0]).toString(),
          collateralToDeposit.toString(),
          'Collateral asset amount deposited into vault mismatch',
        )
      })

      it('should wrap ETH, execute actions and unwrap remaining WETH', async () => {
        const vaultCounter = new BigNumber(await controllerProxy.getAccountVaultCounter(accountOwner1)).plus(1)
        const collateralToDeposit = new BigNumber('5')
        const ethToSend = new BigNumber('7')

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
            sender: payableProxyController.address,
            asset: weth.address,
            vaultId: vaultCounter.toNumber(),
            amount: collateralToDeposit.toNumber(),
            index: '0',
            data: ZERO_ADDR,
          },
        ]

        const marginPoolBalanceBefore = new BigNumber(await weth.balanceOf(marginPool.address))

        await payableProxyController.operate(actionArgs, accountOwner1, {
          from: accountOwner1,
          value: ethToSend.toString(),
        })

        const marginPoolBalanceAfter = new BigNumber(await weth.balanceOf(marginPool.address))
        const vaultAfter = await controllerProxy.getVault(accountOwner1, vaultCounter)

        assert.equal(
          marginPoolBalanceAfter.minus(marginPoolBalanceBefore).toString(),
          collateralToDeposit.toString(),
          'Margin pool balance collateral asset balance mismatch',
        )
        assert.equal(vaultAfter.collateralAssets.length, 1, 'Vault collateral assets array length mismatch')
        assert.equal(
          vaultAfter.collateralAssets[0],
          weth.address,
          'Collateral asset address deposited into vault mismatch',
        )
        assert.equal(
          new BigNumber(vaultAfter.collateralAmounts[0]).toString(),
          collateralToDeposit.toString(),
          'Collateral asset amount deposited into vault mismatch',
        )
      })

      it('should revert sending remaining ETH to address zero', async () => {
        const vaultCounter = new BigNumber(await controllerProxy.getAccountVaultCounter(accountOwner1)).plus(1)
        const collateralToDeposit = new BigNumber('5')
        const ethToSend = new BigNumber('7')

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
            sender: payableProxyController.address,
            asset: weth.address,
            vaultId: vaultCounter.toNumber(),
            amount: collateralToDeposit.toNumber(),
            index: '0',
            data: ZERO_ADDR,
          },
        ]
        await expectRevert(
          payableProxyController.operate(actionArgs, ZERO_ADDR, {
            from: accountOwner1,
            value: ethToSend.toString(),
          }),
          'PayableProxyController: cannot send ETH to address zero',
        )
      })

      it('should revert calling fallback function unless caller is WETH token address', async () => {
        const ethToSend = new BigNumber('7')

        await expectRevert(
          web3.eth.sendTransaction({
            from: accountOwner1,
            to: payableProxyController.address,
            value: ethToSend.toString(),
          }),
          'PayableProxyController: Cannot receive ETH',
        )
      })
    })

    describe('Operate without ETH', async () => {
      it('should normally execute operate', async () => {
        const vaultCounterBefore = new BigNumber(await controllerProxy.getAccountVaultCounter(accountOwner1)).plus(1)
        const actionArgs = [
          {
            actionType: ActionType.OpenVault,
            owner: accountOwner1,
            sender: accountOwner1,
            asset: ZERO_ADDR,
            vaultId: vaultCounterBefore.toNumber(),
            amount: '0',
            index: '0',
            data: ZERO_ADDR,
          },
        ]

        await payableProxyController.operate(actionArgs, ZERO_ADDR, {
          from: accountOwner1,
        })

        const vaultCounterAfter = new BigNumber(await controllerProxy.getAccountVaultCounter(accountOwner1))
        assert.equal(vaultCounterAfter.minus(vaultCounterBefore).toString(), '1', 'vault counter after mismatch')
      })
    })
  },
)
