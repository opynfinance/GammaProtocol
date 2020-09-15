import {
  MockERC20Instance,
  MarginCalculatorInstance,
  AddressBookInstance,
  MockOracleInstance,
  OtokenInstance,
  ControllerInstance,
  WhitelistInstance,
  MarginPoolInstance,
  OtokenFactoryInstance,
} from '../../build/types/truffle-types'
import {createTokenAmount} from '../utils'
import {assert} from 'chai'
import BigNumber from 'bignumber.js'

const {expectRevert, time} = require('@openzeppelin/test-helpers')
const AddressBook = artifacts.require('AddressBook.sol')
const MockOracle = artifacts.require('MockOracle.sol')
const Otoken = artifacts.require('Otoken.sol')
const MockERC20 = artifacts.require('MockERC20.sol')
const MarginCalculator = artifacts.require('MarginCalculator.sol')
const Whitelist = artifacts.require('Whitelist.sol')
const MarginPool = artifacts.require('MarginPool.sol')
const Controller = artifacts.require('Controller.sol')
const MarginAccount = artifacts.require('MarginAccount.sol')
const OTokenFactory = artifacts.require('OtokenFactory.sol')
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

contract('Short Call Spread Option flow', ([accountOwner1, buyer, accountOwner2]) => {
  let expiry: number

  let addressBook: AddressBookInstance
  let calculator: MarginCalculatorInstance
  let controllerProxy: ControllerInstance
  let controllerImplementation: ControllerInstance
  let marginPool: MarginPoolInstance
  let whitelist: WhitelistInstance
  let otokenImplementation: OtokenInstance
  let otokenFactory: OtokenFactoryInstance

  // oracle modulce mock
  let oracle: MockOracleInstance

  let usdc: MockERC20Instance
  let weth: MockERC20Instance

  let shortCall: OtokenInstance
  let longCall: OtokenInstance
  const shortStrike = 100
  const longStrike = 200

  const optionsAmount = 10
  const collateralAmount = (Math.abs(longStrike - shortStrike) * optionsAmount) / longStrike

  let vaultCounter: number

  before('set up contracts', async () => {
    const now = (await time.latest()).toNumber()
    const multiplier = (now - 28800) / 86400
    expiry = (Number(multiplier.toFixed(0)) + 1) * 86400 + time.duration.days(30).toNumber() + 28800
    // setup usdc and weth
    usdc = await MockERC20.new('USDC', 'USDC', 6)
    weth = await MockERC20.new('WETH', 'WETH', 16)

    // initiate addressbook first.
    addressBook = await AddressBook.new()
    // setup calculator
    calculator = await MarginCalculator.new(addressBook.address)
    // setup margin pool
    marginPool = await MarginPool.new(addressBook.address)
    // setup margin account
    const lib = await MarginAccount.new()
    // setup controllerProxy module
    await Controller.link('MarginAccount', lib.address)
    controllerImplementation = await Controller.new(addressBook.address)
    // setup mock Oracle module
    oracle = await MockOracle.new(addressBook.address)
    // setup whitelist module
    whitelist = await Whitelist.new(addressBook.address)
    await whitelist.whitelistCollateral(weth.address)
    whitelist.whitelistProduct(weth.address, usdc.address, usdc.address, true)
    whitelist.whitelistProduct(weth.address, usdc.address, weth.address, false)
    // setup otoken
    otokenImplementation = await Otoken.new()
    // setup factory
    otokenFactory = await OTokenFactory.new(addressBook.address)

    // setup address book
    await addressBook.setOracle(oracle.address)
    await addressBook.setController(controllerImplementation.address)
    await addressBook.setMarginCalculator(calculator.address)
    await addressBook.setWhitelist(whitelist.address)
    await addressBook.setMarginPool(marginPool.address)
    await addressBook.setOtokenFactory(otokenFactory.address)
    await addressBook.setOtokenImpl(otokenImplementation.address)

    const controllerProxyAddress = await addressBook.getController()
    controllerProxy = await Controller.at(controllerProxyAddress)
    await controllerProxy.refreshConfiguration()

    await otokenFactory.createOtoken(
      weth.address,
      usdc.address,
      weth.address,
      createTokenAmount(longStrike, 18),
      expiry,
      false,
    )

    await otokenFactory.createOtoken(
      weth.address,
      usdc.address,
      weth.address,
      createTokenAmount(shortStrike, 18),
      expiry,
      false,
    )

    const longCallAddress = await otokenFactory.getOtoken(
      weth.address,
      usdc.address,
      weth.address,
      createTokenAmount(longStrike, 18),
      expiry,
      false,
    )

    longCall = await Otoken.at(longCallAddress)

    const shortCallAddress = await otokenFactory.getOtoken(
      weth.address,
      usdc.address,
      weth.address,
      createTokenAmount(shortStrike, 18),
      expiry,
      false,
    )

    shortCall = await Otoken.at(shortCallAddress)

    // mint weth to user
    const accountOwner1Weth = createTokenAmount(2 * collateralAmount, (await weth.decimals()).toNumber())
    const accountOwner2Weth = createTokenAmount(longStrike * optionsAmount, (await weth.decimals()).toNumber())
    const buyerWeth = createTokenAmount(longStrike * optionsAmount, (await weth.decimals()).toNumber())

    weth.mint(accountOwner1, accountOwner1Weth)
    weth.mint(accountOwner2, accountOwner2Weth)
    weth.mint(buyer, buyerWeth)

    // have the user approve all the weth transfers
    weth.approve(marginPool.address, '10000000000000000000000', {from: accountOwner1})
    weth.approve(marginPool.address, '10000000000000000000000000000000000000000', {from: accountOwner2})
    weth.approve(marginPool.address, '10000000000000000000000000000', {from: buyer})

    const vaultCounterBefore = new BigNumber(await controllerProxy.getAccountVaultCounter(accountOwner1))
    vaultCounter = vaultCounterBefore.toNumber() + 1
  })

  describe('Integration test: Sell a short call spread and close it before expiry', () => {
    it('Someone else mints the long option and sends it to the seller', async () => {
      const collateralToMintLong = optionsAmount
      const scaledOptionsAmount = createTokenAmount(optionsAmount, 18)
      const scaledCollateralToMintLong = createTokenAmount(collateralToMintLong, (await weth.decimals()).toNumber())

      const actionArgs = [
        {
          actionType: ActionType.OpenVault,
          owner: accountOwner2,
          sender: accountOwner2,
          asset: ZERO_ADDR,
          vaultId: vaultCounter,
          amount: '0',
          index: '0',
          data: ZERO_ADDR,
        },
        {
          actionType: ActionType.MintShortOption,
          owner: accountOwner2,
          sender: accountOwner2,
          asset: longCall.address,
          vaultId: vaultCounter,
          amount: scaledOptionsAmount,
          index: '0',
          data: ZERO_ADDR,
        },
        {
          actionType: ActionType.DepositCollateral,
          owner: accountOwner2,
          sender: accountOwner2,
          asset: weth.address,
          vaultId: vaultCounter,
          amount: scaledCollateralToMintLong,
          index: '0',
          data: ZERO_ADDR,
        },
      ]

      await controllerProxy.operate(actionArgs, {from: accountOwner2})

      // buyer sells their long put option to owner
      await longCall.transfer(accountOwner1, scaledOptionsAmount, {from: accountOwner2})
    })
    it('Seller should be able to open a short put spread', async () => {
      const scaledOptionsAmount = createTokenAmount(optionsAmount, 18)
      const scaledCollateralAmount = createTokenAmount(collateralAmount, (await weth.decimals()).toNumber())
      // Keep track of balances before
      const ownerWethBalanceBefore = new BigNumber(await weth.balanceOf(accountOwner1))
      const marginPoolWethBalanceBefore = new BigNumber(await weth.balanceOf(marginPool.address))

      const ownerShortOtokenBalanceBefore = new BigNumber(await shortCall.balanceOf(accountOwner1))
      const marginPoolShortOtokenSupplyBefore = new BigNumber(await shortCall.totalSupply())

      const ownerlongOtokenBalanceBefore = new BigNumber(await longCall.balanceOf(accountOwner1))
      const marginPoolLongOtokenSupplyBefore = new BigNumber(await longCall.totalSupply())
      const marginPoolLongOtokenBalanceBefore = new BigNumber(await longCall.balanceOf(marginPool.address))

      // Check that we start at a valid state
      const vaultBefore = await controllerProxy.getVault(accountOwner1, vaultCounter)
      const vaultStateBefore = await calculator.getExcessCollateral(vaultBefore)
      assert.equal(vaultStateBefore[0].toString(), '0')
      assert.equal(vaultStateBefore[1], true)

      // Check the vault balances stored in the contract
      assert.equal(vaultBefore.shortOtokens.length, 0, 'Length of the short otoken array in the vault is incorrect')
      assert.equal(vaultBefore.collateralAssets.length, 0, 'Length of the collateral array in the vault is incorrect')
      assert.equal(vaultBefore.longOtokens.length, 0, 'Length of the long otoken array in the vault is incorrect')

      assert.equal(vaultBefore.shortAmounts.length, 0, 'Length of the short amounts array in the vault is incorrect')
      assert.equal(
        vaultBefore.collateralAmounts.length,
        0,
        'Length of the collateral amounts array in the vault is incorrect',
      )
      assert.equal(vaultBefore.longAmounts.length, 0, 'Length of the long amounts array in the vault is incorrect')

      const actionArgs = [
        {
          actionType: ActionType.OpenVault,
          owner: accountOwner1,
          sender: accountOwner1,
          asset: ZERO_ADDR,
          vaultId: vaultCounter,
          amount: '0',
          index: '0',
          data: ZERO_ADDR,
        },
        {
          actionType: ActionType.MintShortOption,
          owner: accountOwner1,
          sender: accountOwner1,
          asset: shortCall.address,
          vaultId: vaultCounter,
          amount: scaledOptionsAmount,
          index: '0',
          data: ZERO_ADDR,
        },
        {
          actionType: ActionType.DepositCollateral,
          owner: accountOwner1,
          sender: accountOwner1,
          asset: weth.address,
          vaultId: vaultCounter,
          amount: scaledCollateralAmount,
          index: '0',
          data: ZERO_ADDR,
        },
        {
          actionType: ActionType.DepositLongOption,
          owner: accountOwner1,
          sender: accountOwner1,
          asset: longCall.address,
          vaultId: vaultCounter,
          amount: scaledOptionsAmount,
          index: '0',
          data: ZERO_ADDR,
        },
      ]

      await longCall.approve(marginPool.address, '1000000000000000000000', {from: accountOwner1})
      await controllerProxy.operate(actionArgs, {from: accountOwner1})

      // keep track of balances after
      const ownerWethBalanceAfter = new BigNumber(await weth.balanceOf(accountOwner1))
      const marginPoolWethBalanceAfter = new BigNumber(await weth.balanceOf(marginPool.address))

      const ownerShortOtokenBalanceAfter = new BigNumber(await shortCall.balanceOf(accountOwner1))
      const marginPoolShortOtokenSupplyAfter = new BigNumber(await shortCall.totalSupply())

      const ownerlongOtokenBalanceAfter = new BigNumber(await longCall.balanceOf(accountOwner1))
      const marginPoolLongOtokenSupplyAfter = new BigNumber(await longCall.totalSupply())
      const marginPoolLongOtokenBalanceAfter = new BigNumber(await longCall.balanceOf(marginPool.address))

      // check balances before and after changed as expected
      assert.equal(ownerWethBalanceBefore.minus(scaledCollateralAmount).toString(), ownerWethBalanceAfter.toString())
      assert.equal(
        marginPoolWethBalanceBefore.plus(scaledCollateralAmount).toString(),
        marginPoolWethBalanceAfter.toString(),
      )
      assert.equal(
        ownerShortOtokenBalanceBefore.plus(scaledOptionsAmount).toString(),
        ownerShortOtokenBalanceAfter.toString(),
      )
      assert.equal(
        marginPoolShortOtokenSupplyBefore.plus(scaledOptionsAmount).toString(),
        marginPoolShortOtokenSupplyAfter.toString(),
      )

      assert.equal(
        ownerlongOtokenBalanceBefore.minus(scaledOptionsAmount).toString(),
        ownerlongOtokenBalanceAfter.toString(),
      )
      assert.equal(marginPoolLongOtokenSupplyBefore.toString(), marginPoolLongOtokenSupplyAfter.toString())
      assert.equal(
        marginPoolLongOtokenBalanceBefore.plus(scaledOptionsAmount).toString(),
        marginPoolLongOtokenBalanceAfter.toString(),
      )

      // Check that we end at a valid state
      const vaultAfter = await controllerProxy.getVault(accountOwner1, vaultCounter)
      const vaultStateAfter = await calculator.getExcessCollateral(vaultAfter)
      // TODO: why is this erroring here?
      assert.equal(vaultStateAfter[0].toString(), '0')
      assert.equal(vaultStateAfter[1], true)

      // Check the vault balances stored in the contract
      assert.equal(vaultAfter.shortOtokens.length, 1, 'Length of the short otoken array in the vault is incorrect')
      assert.equal(vaultAfter.collateralAssets.length, 1, 'Length of the collateral array in the vault is incorrect')
      assert.equal(vaultAfter.longOtokens.length, 1, 'Length of the long otoken array in the vault is incorrect')

      assert.equal(vaultAfter.shortOtokens[0], shortCall.address, 'Incorrect short otoken in the vault')
      assert.equal(vaultAfter.collateralAssets[0], weth.address, 'Incorrect collateral asset in the vault')
      assert.equal(vaultAfter.longOtokens[0], longCall.address, 'Incorrect long otoken in the vault')

      assert.equal(vaultAfter.shortAmounts.length, 1, 'Length of the short amounts array in the vault is incorrect')
      assert.equal(
        vaultAfter.collateralAmounts.length,
        1,
        'Length of the collateral amounts array in the vault is incorrect',
      )
      assert.equal(vaultAfter.longAmounts.length, 1, 'Length of the long amounts array in the vault is incorrect')

      assert.equal(
        vaultAfter.shortAmounts[0].toString(),
        scaledOptionsAmount,
        'Incorrect amount of short options stored in the vault',
      )
      assert.equal(
        vaultAfter.collateralAmounts[0].toString(),
        scaledCollateralAmount,
        'Incorrect amount of collateral stored in the vault',
      )
      assert.equal(
        vaultAfter.longAmounts[0].toString(),
        scaledOptionsAmount,
        'Incorrect amount of long options stored in the vault',
      )
    })

    it('deposit more collateral into the safe vault', async () => {
      const scaledOptionsAmount = createTokenAmount(optionsAmount, 18)
      const scaledCollateralAmount = createTokenAmount(collateralAmount, (await weth.decimals()).toNumber())
      // Keep track of balances before
      const ownerWethBalanceBefore = new BigNumber(await weth.balanceOf(accountOwner1))
      const marginPoolWethBalanceBefore = new BigNumber(await weth.balanceOf(marginPool.address))

      const actionArgs = [
        {
          actionType: ActionType.DepositCollateral,
          owner: accountOwner1,
          sender: accountOwner1,
          asset: weth.address,
          vaultId: vaultCounter,
          amount: scaledCollateralAmount,
          index: '0',
          data: ZERO_ADDR,
        },
      ]

      await controllerProxy.operate(actionArgs, {from: accountOwner1})

      // keep track of balances after
      const ownerWethBalanceAfter = new BigNumber(await weth.balanceOf(accountOwner1))
      const marginPoolWethBalanceAfter = new BigNumber(await weth.balanceOf(marginPool.address))

      // check balances before and after changed as expected
      assert.equal(ownerWethBalanceBefore.minus(scaledCollateralAmount).toString(), ownerWethBalanceAfter.toString())
      assert.equal(
        marginPoolWethBalanceBefore.plus(scaledCollateralAmount).toString(),
        marginPoolWethBalanceAfter.toString(),
      )

      // Check that there is excess margin
      const vaultAfter = await controllerProxy.getVault(accountOwner1, vaultCounter)
      const vaultStateAfter = await calculator.getExcessCollateral(vaultAfter)
      assert.equal(vaultStateAfter[0].toString(), scaledCollateralAmount)
      assert.equal(vaultStateAfter[1], true)

      // Check the vault balances stored in the contract
      assert.equal(vaultAfter.shortOtokens.length, 1, 'Length of the short otoken array in the vault is incorrect')
      assert.equal(vaultAfter.collateralAssets.length, 1, 'Length of the collateral array in the vault is incorrect')
      assert.equal(vaultAfter.longOtokens.length, 1, 'Length of the long otoken array in the vault is incorrect')

      assert.equal(vaultAfter.shortOtokens[0], shortCall.address, 'Incorrect short otoken in the vault')
      assert.equal(vaultAfter.collateralAssets[0], weth.address, 'Incorrect collateral asset in the vault')
      assert.equal(vaultAfter.longOtokens[0], longCall.address, 'Incorrect long otoken in the vault')

      assert.equal(vaultAfter.shortAmounts.length, 1, 'Length of the short amounts array in the vault is incorrect')
      assert.equal(
        vaultAfter.collateralAmounts.length,
        1,
        'Length of the collateral amounts array in the vault is incorrect',
      )
      assert.equal(vaultAfter.longAmounts.length, 1, 'Length of the long amounts array in the vault is incorrect')

      assert.equal(
        vaultAfter.shortAmounts[0].toString(),
        scaledOptionsAmount,
        'Incorrect amount of short options stored in the vault',
      )
      assert.equal(
        vaultAfter.collateralAmounts[0].toString(),
        new BigNumber(scaledCollateralAmount).times(2).toString(),
        'Incorrect amount of collateral stored in the vault',
      )
      assert.equal(
        vaultAfter.longAmounts[0].toString(),
        scaledOptionsAmount,
        'Incorrect amount of long options stored in the vault',
      )
    })
    it('withdraw excess collateral from the safe vault', async () => {
      const scaledOptionsAmount = createTokenAmount(optionsAmount, 18)
      const scaledCollateralAmount = createTokenAmount(collateralAmount, (await weth.decimals()).toNumber())
      // Keep track of balances before
      const ownerWethBalanceBefore = new BigNumber(await weth.balanceOf(accountOwner1))
      const marginPoolWethBalanceBefore = new BigNumber(await weth.balanceOf(marginPool.address))

      const actionArgs = [
        {
          actionType: ActionType.WithdrawCollateral,
          owner: accountOwner1,
          sender: accountOwner1,
          asset: weth.address,
          vaultId: vaultCounter,
          amount: scaledCollateralAmount,
          index: '0',
          data: ZERO_ADDR,
        },
      ]

      await controllerProxy.operate(actionArgs, {from: accountOwner1})

      // keep track of balances after
      const ownerWethBalanceAfter = new BigNumber(await weth.balanceOf(accountOwner1))
      const marginPoolWethBalanceAfter = new BigNumber(await weth.balanceOf(marginPool.address))

      // check balances before and after changed as expected
      assert.equal(ownerWethBalanceBefore.plus(scaledCollateralAmount).toString(), ownerWethBalanceAfter.toString())
      assert.equal(
        marginPoolWethBalanceBefore.minus(scaledCollateralAmount).toString(),
        marginPoolWethBalanceAfter.toString(),
      )

      // Check that we end at a valid state with no extra collateral
      const vaultAfter = await controllerProxy.getVault(accountOwner1, vaultCounter)
      const vaultStateAfter = await calculator.getExcessCollateral(vaultAfter)
      assert.equal(vaultStateAfter[0].toString(), '0')
      assert.equal(vaultStateAfter[1], true)

      // Check the vault balances stored in the contract
      assert.equal(vaultAfter.shortOtokens.length, 1, 'Length of the short otoken array in the vault is incorrect')
      assert.equal(vaultAfter.collateralAssets.length, 1, 'Length of the collateral array in the vault is incorrect')
      assert.equal(vaultAfter.longOtokens.length, 1, 'Length of the long otoken array in the vault is incorrect')

      assert.equal(vaultAfter.shortOtokens[0], shortCall.address, 'Incorrect short otoken in the vault')
      assert.equal(vaultAfter.collateralAssets[0], weth.address, 'Incorrect collateral asset in the vault')
      assert.equal(vaultAfter.longOtokens[0], longCall.address, 'Incorrect long otoken in the vault')

      assert.equal(vaultAfter.shortAmounts.length, 1, 'Length of the short amounts array in the vault is incorrect')
      assert.equal(
        vaultAfter.collateralAmounts.length,
        1,
        'Length of the collateral amounts array in the vault is incorrect',
      )
      assert.equal(vaultAfter.longAmounts.length, 1, 'Length of the long amounts array in the vault is incorrect')

      assert.equal(
        vaultAfter.shortAmounts[0].toString(),
        scaledOptionsAmount,
        'Incorrect amount of short options stored in the vault',
      )
      assert.equal(
        vaultAfter.collateralAmounts[0].toString(),
        scaledCollateralAmount,
        'Incorrect amount of collateral stored in the vault',
      )
      assert.equal(
        vaultAfter.longAmounts[0].toString(),
        scaledOptionsAmount,
        'Incorrect amount of long options stored in the vault',
      )
    })

    it('withdrawing collateral from the safe vault without excess colalteral should fail', async () => {
      const scaledCollateralAmount = createTokenAmount(collateralAmount, (await weth.decimals()).toNumber())

      const actionArgs = [
        {
          actionType: ActionType.WithdrawCollateral,
          owner: accountOwner1,
          sender: accountOwner1,
          asset: weth.address,
          vaultId: vaultCounter,
          amount: scaledCollateralAmount,
          index: '0',
          data: ZERO_ADDR,
        },
      ]
      // TODO: Revert message to be updated
      await expectRevert.unspecified(controllerProxy.operate(actionArgs, {from: accountOwner1}))
    })

    it('should be able to transfer long otokens to another address', async () => {
      const scaledOptionsAmount = createTokenAmount(optionsAmount, 18)

      // keep track of balances
      const ownerShortOtokenBalanceBeforeSell = new BigNumber(await shortCall.balanceOf(accountOwner1))
      const buyerBalanceBeforeSell = new BigNumber(await shortCall.balanceOf(buyer))

      // owner sells their put option
      await shortCall.transfer(buyer, scaledOptionsAmount, {from: accountOwner1})

      const ownerShortOtokenBalanceAfterSell = new BigNumber(await shortCall.balanceOf(accountOwner1))
      const buyerBalanceAfterSell = new BigNumber(await shortCall.balanceOf(buyer))

      assert.equal(
        ownerShortOtokenBalanceBeforeSell.minus(scaledOptionsAmount).toString(),
        ownerShortOtokenBalanceAfterSell.toString(),
      )
      assert.equal(buyerBalanceBeforeSell.plus(scaledOptionsAmount).toString(), buyerBalanceAfterSell.toString())

      // owner buys back their put option
      shortCall.transfer(accountOwner1, scaledOptionsAmount, {from: buyer})
    })

    it('should be able to close out the short spread position', async () => {
      const scaledOptionsAmount = createTokenAmount(optionsAmount, 18)
      const scaledCollateralAmount = createTokenAmount(collateralAmount, (await weth.decimals()).toNumber())

      // Keep track of balances before
      const ownerWethBalanceBefore = new BigNumber(await weth.balanceOf(accountOwner1))
      const marginPoolWethBalanceBefore = new BigNumber(await weth.balanceOf(marginPool.address))
      const ownerShortOtokenBalanceBefore = new BigNumber(await shortCall.balanceOf(accountOwner1))
      const marginPoolShortOtokenSupplyBefore = new BigNumber(await shortCall.totalSupply())

      const ownerlongOtokenBalanceBefore = new BigNumber(await longCall.balanceOf(accountOwner1))
      const marginPoolLongOtokenSupplyBefore = new BigNumber(await longCall.totalSupply())
      const marginPoolLongOtokenBalanceBefore = new BigNumber(await longCall.balanceOf(marginPool.address))

      // Check that we start at a valid state
      const vaultBefore = await controllerProxy.getVault(accountOwner1, vaultCounter)
      const vaultStateBefore = await calculator.getExcessCollateral(vaultBefore)
      assert.equal(vaultStateBefore[0].toString(), '0')
      assert.equal(vaultStateBefore[1], true)

      const actionArgs = [
        {
          actionType: ActionType.WithdrawCollateral,
          owner: accountOwner1,
          sender: accountOwner1,
          asset: weth.address,
          vaultId: vaultCounter,
          amount: scaledCollateralAmount,
          index: '0',
          data: ZERO_ADDR,
        },
        {
          actionType: ActionType.BurnShortOption,
          owner: accountOwner1,
          sender: accountOwner1,
          asset: shortCall.address,
          vaultId: vaultCounter,
          amount: scaledOptionsAmount,
          index: '0',
          data: ZERO_ADDR,
        },
        {
          actionType: ActionType.WithdrawLongOption,
          owner: accountOwner1,
          sender: accountOwner1,
          asset: longCall.address,
          vaultId: vaultCounter,
          amount: scaledOptionsAmount,
          index: '0',
          data: ZERO_ADDR,
        },
      ]

      await controllerProxy.operate(actionArgs, {from: accountOwner1})

      // keep track of balances after
      const ownerWethBalanceAfter = new BigNumber(await weth.balanceOf(accountOwner1))
      const marginPoolWethBalanceAfter = new BigNumber(await weth.balanceOf(marginPool.address))

      const ownerShortOtokenBalanceAfter = new BigNumber(await shortCall.balanceOf(accountOwner1))
      const marginPoolShortOtokenSupplyAfter = new BigNumber(await shortCall.totalSupply())

      const ownerlongOtokenBalanceAfter = new BigNumber(await longCall.balanceOf(accountOwner1))
      const marginPoolLongOtokenSupplyAfter = new BigNumber(await longCall.totalSupply())
      const marginPoolLongOtokenBalanceAfter = new BigNumber(await longCall.balanceOf(marginPool.address))

      // check balances before and after changed as expected
      assert.equal(ownerWethBalanceBefore.plus(scaledCollateralAmount).toString(), ownerWethBalanceAfter.toString())
      assert.equal(
        marginPoolWethBalanceBefore.minus(scaledCollateralAmount).toString(),
        marginPoolWethBalanceAfter.toString(),
      )
      assert.equal(
        ownerShortOtokenBalanceBefore.minus(scaledOptionsAmount).toString(),
        ownerShortOtokenBalanceAfter.toString(),
      )
      assert.equal(
        marginPoolShortOtokenSupplyBefore.minus(scaledOptionsAmount).toString(),
        marginPoolShortOtokenSupplyAfter.toString(),
      )

      assert.equal(
        ownerlongOtokenBalanceBefore.plus(scaledOptionsAmount).toString(),
        ownerlongOtokenBalanceAfter.toString(),
      )
      assert.equal(marginPoolLongOtokenSupplyBefore.toString(), marginPoolLongOtokenSupplyAfter.toString())
      assert.equal(
        marginPoolLongOtokenBalanceBefore.minus(scaledOptionsAmount).toString(),
        marginPoolLongOtokenBalanceAfter.toString(),
      )

      // Check that we end at a valid state
      const vaultAfter = await controllerProxy.getVault(accountOwner1, vaultCounter)
      const vaultStateAfter = await calculator.getExcessCollateral(vaultAfter)
      assert.equal(vaultStateAfter[0].toString(), '0')
      assert.equal(vaultStateAfter[1], true)

      // Check the vault balances stored in the contract
      assert.equal(vaultAfter.shortOtokens.length, 1, 'Length of the short otoken array in the vault is incorrect')
      assert.equal(vaultAfter.collateralAssets.length, 1, 'Length of the collateral array in the vault is incorrect')
      assert.equal(vaultAfter.longOtokens.length, 1, 'Length of the long otoken array in the vault is incorrect')

      assert.equal(vaultAfter.shortOtokens[0], ZERO_ADDR, 'Incorrect short otoken in the vault')
      assert.equal(vaultAfter.collateralAssets[0], ZERO_ADDR, 'Incorrect collateral asset in the vault')
      assert.equal(vaultAfter.longOtokens[0], ZERO_ADDR, 'Incorrect long otoken in the vault')

      assert.equal(vaultAfter.shortAmounts.length, 1, 'Length of the short amounts array in the vault is incorrect')
      assert.equal(
        vaultAfter.collateralAmounts.length,
        1,
        'Length of the collateral amounts array in the vault is incorrect',
      )
      assert.equal(vaultAfter.longAmounts.length, 1, 'Length of the long amounts array in the vault is incorrect')

      assert.equal(vaultAfter.shortAmounts[0].toString(), '0', 'Incorrect amount of short stored in the vault')
      assert.equal(
        vaultAfter.collateralAmounts[0].toString(),
        '0',
        'Incorrect amount of collateral stored in the vault',
      )
      assert.equal(vaultAfter.longAmounts[0].toString(), '0', 'Incorrect amount of long stored in the vault')
    })
  })
})
