import {
  WETH9Instance,
  MockOtokenInstance,
  MockERC20Instance,
  MockOracleInstance,
  MockWhitelistModuleInstance,
  MarginCalculatorInstance,
  MarginPoolInstance,
  ControllerInstance,
  AddressBookInstance,
  OwnedUpgradeabilityProxyInstance,
  PayableProxyControllerInstance,
  CalleeAllowanceTesterInstance,
} from '../../build/types/truffle-types'
import BigNumber from 'bignumber.js'
import { createTokenAmount, createScaledNumber } from '../utils'

const { expectRevert, time } = require('@openzeppelin/test-helpers')

const WETH9 = artifacts.require('WETH9.sol')
const MockERC20 = artifacts.require('MockERC20.sol')
const MockOtoken = artifacts.require('MockOtoken.sol')
const MockOracle = artifacts.require('MockOracle.sol')
const OwnedUpgradeabilityProxy = artifacts.require('OwnedUpgradeabilityProxy.sol')
const MarginCalculator = artifacts.require('MarginCalculator.sol')
const MockWhitelistModule = artifacts.require('MockWhitelistModule.sol')
const AddressBook = artifacts.require('AddressBook.sol')
const MarginPool = artifacts.require('MarginPool.sol')
const Controller = artifacts.require('Controller.sol')
const MarginVault = artifacts.require('MarginVault.sol')
const CalleeAllowanceTester = artifacts.require('CalleeAllowanceTester.sol')
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
  Redeem,
  Call,
}

contract('PayableProxyController', ([owner, accountOwner1, holder1, random]) => {
  const usdcDecimals = 6

  // ERC20 mock
  let usdc: MockERC20Instance
  let weth: WETH9Instance
  // Oracle module
  let oracle: MockOracleInstance
  // calculator module
  let calculator: MarginCalculatorInstance
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
  let testerCallee: CalleeAllowanceTesterInstance

  const openVaultBytes = web3.eth.abi.encodeParameter('uint256', 0)

  before('Deployment', async () => {
    // addressbook deployment
    addressBook = await AddressBook.new()
    // ERC20 deployment
    usdc = await MockERC20.new('USDC', 'USDC', usdcDecimals)
    weth = await WETH9.new()
    // deploy Oracle module
    oracle = await MockOracle.new(addressBook.address, { from: owner })
    // calculator deployment
    calculator = await MarginCalculator.new(oracle.address, addressBook.address)
    // margin pool deployment
    marginPool = await MarginPool.new(addressBook.address)
    // whitelist module
    whitelist = await MockWhitelistModule.new()
    // callee allowance tester
    testerCallee = await CalleeAllowanceTester.new(weth.address)
    // set margin pool in addressbook
    await addressBook.setMarginPool(marginPool.address)
    // set calculator in addressbook
    await addressBook.setMarginCalculator(calculator.address)
    // set oracle in AddressBook
    await addressBook.setOracle(oracle.address)
    // set whitelist module address
    await addressBook.setWhitelist(whitelist.address)
    // deploy Controller module
    const lib = await MarginVault.new()
    await Controller.link('MarginVault', lib.address)
    controllerImplementation = await Controller.new()

    // set controller address in AddressBook
    await addressBook.setController(controllerImplementation.address, { from: owner })

    // check controller deployment
    const controllerProxyAddress = await addressBook.getController()
    controllerProxy = await Controller.at(controllerProxyAddress)
    const proxy: OwnedUpgradeabilityProxyInstance = await OwnedUpgradeabilityProxy.at(controllerProxyAddress)

    assert.equal(await proxy.proxyOwner(), addressBook.address, 'Proxy owner address mismatch')
    assert.equal(await controllerProxy.owner(), owner, 'Controller owner address mismatch')
    assert.equal(await controllerProxy.systemPartiallyPaused(), false, 'system is partially paused')

    payableProxyController = await PayableProxyController.new(controllerProxy.address, marginPool.address, weth.address)

    // make everyone rich
    await usdc.mint(accountOwner1, createTokenAmount(10000, usdcDecimals))
  })

  describe('Wrap ETH and execute actions', () => {
    it('should deposit a whitelisted collateral asset from account owner', async () => {
      // set payabale proxy as operator
      await controllerProxy.setOperator(payableProxyController.address, true, { from: accountOwner1 })
      // whitelist weth
      await whitelist.whitelistCollateral(weth.address)
      await whitelist.whitelistCoveredCollateral(weth.address, weth.address, false)

      const vaultCounter = new BigNumber(await controllerProxy.getAccountVaultCounter(accountOwner1)).plus(1)
      const collateralToDeposit = new BigNumber('5')

      const actionArgs = [
        {
          actionType: ActionType.OpenVault,
          owner: accountOwner1,
          secondAddress: accountOwner1,
          asset: ZERO_ADDR,
          vaultId: vaultCounter.toNumber(),
          amount: '0',
          index: '0',
          data: openVaultBytes,
        },
        {
          actionType: ActionType.DepositCollateral,
          owner: accountOwner1,
          secondAddress: payableProxyController.address,
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
      const vaultAfter = (await controllerProxy.getVaultWithDetails(accountOwner1, vaultCounter))[0]

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
          secondAddress: accountOwner1,
          asset: ZERO_ADDR,
          vaultId: vaultCounter.toNumber(),
          amount: '0',
          index: '0',
          data: openVaultBytes,
        },
        {
          actionType: ActionType.DepositCollateral,
          owner: accountOwner1,
          secondAddress: payableProxyController.address,
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
      const vaultAfter = (await controllerProxy.getVaultWithDetails(accountOwner1, vaultCounter))[0]

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
          secondAddress: accountOwner1,
          asset: ZERO_ADDR,
          vaultId: vaultCounter.toNumber(),
          amount: '0',
          index: '0',
          data: openVaultBytes,
        },
        {
          actionType: ActionType.DepositCollateral,
          owner: accountOwner1,
          secondAddress: payableProxyController.address,
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

    it('should revert calling operate on a vault from a random address other than owner or operator', async () => {
      const vaultCounterBefore = new BigNumber(await controllerProxy.getAccountVaultCounter(accountOwner1))
      const actionArgs = [
        {
          actionType: ActionType.OpenVault,
          owner: accountOwner1,
          secondAddress: accountOwner1,
          asset: ZERO_ADDR,
          vaultId: vaultCounterBefore.plus(1).toNumber(),
          amount: '0',
          index: '0',
          data: openVaultBytes,
        },
      ]

      await expectRevert(
        payableProxyController.operate(actionArgs, ZERO_ADDR, {
          from: random,
        }),
        'PayableProxyController: cannot execute action',
      )
    })

    it('should wrap eth and make it accessable to callee contract', async () => {
      await whitelist.whitelistCallee(testerCallee.address, { from: owner })

      const amountEth = createTokenAmount(0.5, 18)
      const wethBalanceBefore = new BigNumber(await weth.balanceOf(testerCallee.address))
      const data = web3.eth.abi.encodeParameters(
        ['address', 'uint256'],
        [payableProxyController.address, amountEth.toString()],
      )
      const actionArgs = [
        {
          actionType: ActionType.Call,
          owner: accountOwner1,
          secondAddress: testerCallee.address,
          asset: ZERO_ADDR,
          vaultId: 0,
          amount: '0',
          index: '0',
          data,
        },
      ]
      await payableProxyController.operate(actionArgs, accountOwner1, {
        from: accountOwner1,
        value: amountEth,
      })
      const wethBalanceAfter = new BigNumber(await weth.balanceOf(testerCallee.address))
      assert.equal(wethBalanceAfter.minus(wethBalanceBefore).toString(), amountEth.toString())
    })
  })

  describe('Operate without ETH', () => {
    it('should normally execute operate', async () => {
      const vaultCounterBefore = new BigNumber(await controllerProxy.getAccountVaultCounter(accountOwner1))
      const actionArgs = [
        {
          actionType: ActionType.OpenVault,
          owner: accountOwner1,
          secondAddress: accountOwner1,
          asset: ZERO_ADDR,
          vaultId: vaultCounterBefore.plus(1).toNumber(),
          amount: '0',
          index: '0',
          data: openVaultBytes,
        },
      ]

      await payableProxyController.operate(actionArgs, ZERO_ADDR, {
        from: accountOwner1,
      })

      const vaultCounterAfter = new BigNumber(await controllerProxy.getAccountVaultCounter(accountOwner1))
      assert.equal(
        vaultCounterAfter.minus(vaultCounterBefore).toString(),
        '1',
        'vault counter after execution mismatch',
      )
    })
  })

  describe('Operate without owner address', () => {
    let shortOtoken: MockOtokenInstance

    before(async () => {
      const expiryTime = new BigNumber(60 * 60 * 24) // after 1 day
      const expiry = new BigNumber(await time.latest()).plus(expiryTime)
      const strikePrice = 200
      const underlyingPriceAtExpiry = createScaledNumber(150)
      const strikePriceAtExpiry = createScaledNumber(1)

      shortOtoken = await MockOtoken.new()
      // init otoken
      await shortOtoken.init(
        addressBook.address,
        weth.address,
        usdc.address,
        usdc.address,
        createScaledNumber(strikePrice),
        expiry,
        true,
      )
      // whitelist short otoken to be used in the protocol
      await whitelist.whitelistOtoken(shortOtoken.address, { from: owner })
      // whitelist collateral
      await whitelist.whitelistCollateral(usdc.address, { from: owner })
      await whitelist.whitelistCoveredCollateral(usdc.address, weth.address, true)
      // open new vault, mintnaked short, sell it to holder 1
      const vaultCounter = new BigNumber(await controllerProxy.getAccountVaultCounter(accountOwner1)).plus(1)
      const collateralToDeposit = createTokenAmount(strikePrice, 6)
      const amountToMint = createTokenAmount(1)
      const actionArgs = [
        {
          actionType: ActionType.OpenVault,
          owner: accountOwner1,
          secondAddress: accountOwner1,
          asset: ZERO_ADDR,
          vaultId: vaultCounter.toNumber(),
          amount: '0',
          index: '0',
          data: openVaultBytes,
        },
        {
          actionType: ActionType.MintShortOption,
          owner: accountOwner1,
          secondAddress: accountOwner1,
          asset: shortOtoken.address,
          vaultId: vaultCounter.toNumber(),
          amount: amountToMint.toString(),
          index: '0',
          data: ZERO_ADDR,
        },
        {
          actionType: ActionType.DepositCollateral,
          owner: accountOwner1,
          secondAddress: accountOwner1,
          asset: usdc.address,
          vaultId: vaultCounter.toNumber(),
          amount: collateralToDeposit,
          index: '0',
          data: ZERO_ADDR,
        },
      ]
      await usdc.approve(marginPool.address, collateralToDeposit, { from: accountOwner1 })
      await payableProxyController.operate(actionArgs, accountOwner1, { from: accountOwner1 })
      // transfer minted short otoken to hodler`
      await shortOtoken.transfer(holder1, amountToMint.toString(), { from: accountOwner1 })
      // increase time with one hour in seconds
      await time.increase(60 * 61 * 24)
      await oracle.setExpiryPriceFinalizedAllPeiodOver(
        await shortOtoken.underlyingAsset(),
        new BigNumber(await shortOtoken.expiryTimestamp()),
        underlyingPriceAtExpiry,
        true,
      )
      await oracle.setExpiryPriceFinalizedAllPeiodOver(
        await shortOtoken.strikeAsset(),
        new BigNumber(await shortOtoken.expiryTimestamp()),
        strikePriceAtExpiry,
        true,
      )
    })

    it('should normally execute when owner address is equal to zero', async () => {
      const amountToRedeem = createTokenAmount(1)
      const actionArgs = [
        {
          actionType: ActionType.Redeem,
          owner: ZERO_ADDR,
          secondAddress: holder1,
          asset: shortOtoken.address,
          vaultId: '0',
          amount: amountToRedeem.toString(),
          index: '0',
          data: ZERO_ADDR,
        },
      ]
      assert.equal(await controllerProxy.hasExpired(shortOtoken.address), true, 'Short otoken is not expired yet')

      await shortOtoken.transfer(payableProxyController.address, amountToRedeem.toString(), { from: holder1 })
      await payableProxyController.operate(actionArgs, holder1, { from: holder1 })
    })
  })
})
