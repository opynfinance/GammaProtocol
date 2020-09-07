import {
  MockERC20Instance,
  MarginCalculatorInstance,
  AddressBookInstance,
  MockOracleInstance,
  OtokenInstance,
  ControllerInstance,
  MockWhitelistModuleInstance,
  MarginPoolInstance,
} from '../../build/types/truffle-types'
import {createVault, createScaledUint256, createScaledNumber} from '../utils'
import {assert} from 'chai'
import BigNumber from 'bignumber.js'

import Reverter from '../Reverter'

const {expectRevert, time} = require('@openzeppelin/test-helpers')
const AddressBook = artifacts.require('AddressBook.sol')
const MockOracle = artifacts.require('MockOracle.sol')
const Otoken = artifacts.require('Otoken.sol')
const MockERC20 = artifacts.require('MockERC20.sol')
const MarginCalculator = artifacts.require('MarginCalculator.sol')
const MockWhitelist = artifacts.require('MockWhitelistModule.sol')
const MarginPool = artifacts.require('MarginPool.sol')
const Controller = artifacts.require('Controller.sol')
const MarginAccount = artifacts.require('MarginAccount.sol')
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

contract('Naked Call Option flow', ([admin, accountOwner1, accountOperator1, buyer]) => {
  const reverter = new Reverter(web3)

  let expiry: number

  let addressBook: AddressBookInstance
  let calculator: MarginCalculatorInstance
  let controllerProxy: ControllerInstance
  let controllerImplementation: ControllerInstance
  let marginPool: MarginPoolInstance

  // whitelist module mock
  let whitelist: MockWhitelistModuleInstance
  // oracle modulce mock
  let oracle: MockOracleInstance

  let usdc: MockERC20Instance
  let dai: MockERC20Instance
  let weth: MockERC20Instance

  let ethCall: OtokenInstance
  const strikePrice = 300

  const optionsAmount = 10
  const collateralAmount = optionsAmount
  let vaultCounter: number

  before('set up contracts', async () => {
    const now = (await time.latest()).toNumber()
    expiry = now + time.duration.days(500).toNumber()

    // initiate addressbook first.
    addressBook = await AddressBook.new()
    // setup calculator
    calculator = await MarginCalculator.new(addressBook.address)
    // setup margin pool
    marginPool = await MarginPool.new(addressBook.address)
    // setup controllerProxy module
    const lib = await MarginAccount.new()
    await Controller.link('MarginAccount', lib.address)
    controllerImplementation = await Controller.new(addressBook.address)
    controllerProxy = await Controller.new(addressBook.address)
    // setup mock Oracle module
    oracle = await MockOracle.new(addressBook.address)
    // setup mock whitelist module
    whitelist = await MockWhitelist.new()

    // setup usdc and weth
    // TODO: make usdc 18
    usdc = await MockERC20.new('USDC', 'USDC', 18)
    dai = await MockERC20.new('DAI', 'DAI', 18)
    weth = await MockERC20.new('WETH', 'WETH', 18)

    // setup address book
    await addressBook.setOracle(oracle.address)
    await addressBook.setController(controllerImplementation.address)
    await addressBook.setMarginCalculator(calculator.address)
    await addressBook.setWhitelist(whitelist.address)
    await addressBook.setMarginPool(marginPool.address)

    const controllerProxyAddress = await addressBook.getController()
    controllerProxy = await Controller.at(controllerProxyAddress)
    await controllerProxy.refreshConfiguration()

    ethCall = await Otoken.new()
    await ethCall.init(
      addressBook.address,
      weth.address,
      usdc.address,
      weth.address,
      createScaledUint256(strikePrice, 18),
      expiry,
      false,
    )

    // setup the whitelist module
    await whitelist.whitelistOtoken(ethCall.address)
    await whitelist.whitelistCollateral(weth.address)

    // mint weth to user
    weth.mint(accountOwner1, createScaledUint256(2 * collateralAmount, (await weth.decimals()).toNumber()))

    // have the user approve all the weth transfers
    weth.approve(marginPool.address, '10000000000000000000000', {from: accountOwner1})

    const vaultCounterBefore = new BigNumber(await controllerProxy.getAccountVaultCounter(accountOwner1))
    vaultCounter = vaultCounterBefore.toNumber() + 1
  })

  describe('Integration test: Sell a naked call and close it before expiry', () => {
    it('Seller should be able to open a short call option', async () => {
      // Keep track of balances before
      const ownerWethBalanceBefore = new BigNumber(await weth.balanceOf(accountOwner1))
      const marginPoolWethBalanceBefore = new BigNumber(await weth.balanceOf(marginPool.address))
      const ownerOtokenBalanceBefore = new BigNumber(await ethCall.balanceOf(accountOwner1))
      const marginPoolOtokenSupplyBefore = new BigNumber(await ethCall.totalSupply())

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
          asset: ethCall.address,
          vaultId: vaultCounter,
          amount: createScaledUint256(optionsAmount, 18),
          index: '0',
          data: ZERO_ADDR,
        },
        {
          actionType: ActionType.DepositCollateral,
          owner: accountOwner1,
          sender: accountOwner1,
          asset: weth.address,
          vaultId: vaultCounter,
          amount: createScaledUint256(collateralAmount, (await weth.decimals()).toNumber()),
          index: '0',
          data: ZERO_ADDR,
        },
      ]

      await controllerProxy.operate(actionArgs, {from: accountOwner1})

      // keep track of balances after
      const ownerWethBalanceAfter = new BigNumber(await weth.balanceOf(accountOwner1))
      const marginPoolWethBalanceAfter = new BigNumber(await weth.balanceOf(marginPool.address))

      const ownerOtokenBalanceAfter = new BigNumber(await ethCall.balanceOf(accountOwner1))
      const marginPoolOtokenSupplyAfter = new BigNumber(await ethCall.totalSupply())

      // check balances before and after changed as expected
      assert.equal(
        ownerWethBalanceBefore
          .minus(createScaledUint256(collateralAmount, (await weth.decimals()).toNumber()))
          .toString(),
        ownerWethBalanceAfter.toString(),
      )
      assert.equal(
        marginPoolWethBalanceBefore
          .plus(createScaledUint256(collateralAmount, (await weth.decimals()).toNumber()))
          .toString(),
        marginPoolWethBalanceAfter.toString(),
      )
      assert.equal(
        ownerOtokenBalanceBefore.plus(createScaledUint256(optionsAmount, 18)).toString(),
        ownerOtokenBalanceAfter.toString(),
      )
      assert.equal(
        marginPoolOtokenSupplyBefore.plus(createScaledUint256(optionsAmount, 18)).toString(),
        marginPoolOtokenSupplyAfter.toString(),
      )

      // Check that we end at a valid state
      const vaultAfter = await controllerProxy.getVault(accountOwner1, vaultCounter)
      const vaultStateAfter = await calculator.getExcessCollateral(vaultAfter)
      assert.equal(vaultStateAfter[0].toString(), '0')
      assert.equal(vaultStateAfter[1], true)

      // Check the vault balances stored in the contract
      assert.equal(vaultAfter.shortOtokens.length, 1, 'Length of the short otoken array in the vault is incorrect')
      assert.equal(vaultAfter.collateralAssets.length, 1, 'Length of the collateral array in the vault is incorrect')
      assert.equal(vaultAfter.longOtokens.length, 0, 'Length of the long otoken array in the vault is incorrect')

      assert.equal(vaultAfter.shortOtokens[0], ethCall.address, 'Incorrect short otoken in the vault')
      assert.equal(vaultAfter.collateralAssets[0], weth.address, 'Incorrect collateral asset in the vault')

      assert.equal(vaultAfter.shortAmounts.length, 1, 'Length of the short amounts array in the vault is incorrect')
      assert.equal(
        vaultAfter.collateralAmounts.length,
        1,
        'Length of the collateral amounts array in the vault is incorrect',
      )
      assert.equal(vaultAfter.longAmounts.length, 0, 'Length of the long amounts array in the vault is incorrect')

      assert.equal(
        vaultAfter.shortAmounts[0].toString(),
        createScaledUint256(optionsAmount, 18),
        'Incorrect amount of short stored in the vault',
      )
      assert.equal(
        vaultAfter.collateralAmounts[0].toString(),
        createScaledUint256(collateralAmount, 18),
        'Incorrect amount of collateral stored in the vault',
      )

      await reverter.snapshot()
    })

    it('deposit more collateral into the safe vault', async () => {
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
          amount: createScaledUint256(collateralAmount, (await weth.decimals()).toNumber()),
          index: '0',
          data: ZERO_ADDR,
        },
      ]

      await controllerProxy.operate(actionArgs, {from: accountOwner1})

      // keep track of balances after
      const ownerWethBalanceAfter = new BigNumber(await weth.balanceOf(accountOwner1))
      const marginPoolWethBalanceAfter = new BigNumber(await weth.balanceOf(marginPool.address))

      // check balances before and after changed as expected
      assert.equal(
        ownerWethBalanceBefore
          .minus(createScaledUint256(collateralAmount, (await weth.decimals()).toNumber()))
          .toString(),
        ownerWethBalanceAfter.toString(),
      )
      assert.equal(
        marginPoolWethBalanceBefore
          .plus(createScaledUint256(collateralAmount, (await weth.decimals()).toNumber()))
          .toString(),
        marginPoolWethBalanceAfter.toString(),
      )

      // Check that there is excess margin
      const vaultAfter = await controllerProxy.getVault(accountOwner1, vaultCounter)
      const vaultStateAfter = await calculator.getExcessCollateral(vaultAfter)
      assert.equal(
        vaultStateAfter[0].toString(),
        createScaledUint256(collateralAmount, (await weth.decimals()).toNumber()),
      )
      assert.equal(vaultStateAfter[1], true)

      // Check the vault balances stored in the contract
      assert.equal(vaultAfter.shortOtokens.length, 1, 'Length of the short otoken array in the vault is incorrect')
      assert.equal(vaultAfter.collateralAssets.length, 1, 'Length of the collateral array in the vault is incorrect')
      assert.equal(vaultAfter.longOtokens.length, 0, 'Length of the long otoken array in the vault is incorrect')

      assert.equal(vaultAfter.shortOtokens[0], ethCall.address, 'Incorrect short otoken in the vault')
      assert.equal(vaultAfter.collateralAssets[0], weth.address, 'Incorrect collateral asset in the vault')

      assert.equal(vaultAfter.shortAmounts.length, 1, 'Length of the short amounts array in the vault is incorrect')
      assert.equal(
        vaultAfter.collateralAmounts.length,
        1,
        'Length of the collateral amounts array in the vault is incorrect',
      )
      assert.equal(vaultAfter.longAmounts.length, 0, 'Length of the long amounts array in the vault is incorrect')

      assert.equal(
        vaultAfter.shortAmounts[0].toString(),
        createScaledUint256(optionsAmount, 18),
        'Incorrect amount of short options stored in the vault',
      )
      assert.equal(
        vaultAfter.collateralAmounts[0].toString(),
        createScaledUint256(2 * collateralAmount, (await weth.decimals()).toNumber()),
        'Incorrect amount of collateral stored in the vault',
      )
    })
    it('withdraw excess collateral from the safe vault', async () => {
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
          amount: createScaledUint256(collateralAmount, (await weth.decimals()).toNumber()),
          index: '0',
          data: ZERO_ADDR,
        },
      ]

      await controllerProxy.operate(actionArgs, {from: accountOwner1})

      // keep track of balances after
      const ownerWethBalanceAfter = new BigNumber(await weth.balanceOf(accountOwner1))
      const marginPoolWethBalanceAfter = new BigNumber(await weth.balanceOf(marginPool.address))

      // check balances before and after changed as expected
      assert.equal(
        ownerWethBalanceBefore
          .plus(createScaledUint256(collateralAmount, (await weth.decimals()).toNumber()))
          .toString(),
        ownerWethBalanceAfter.toString(),
      )
      assert.equal(
        marginPoolWethBalanceBefore
          .minus(createScaledUint256(collateralAmount, (await weth.decimals()).toNumber()))
          .toString(),
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
      assert.equal(vaultAfter.longOtokens.length, 0, 'Length of the long otoken array in the vault is incorrect')

      assert.equal(vaultAfter.shortOtokens[0], ethCall.address, 'Incorrect short otoken in the vault')
      assert.equal(vaultAfter.collateralAssets[0], weth.address, 'Incorrect collateral asset in the vault')

      assert.equal(vaultAfter.shortAmounts.length, 1, 'Length of the short amounts array in the vault is incorrect')
      assert.equal(
        vaultAfter.collateralAmounts.length,
        1,
        'Length of the collateral amounts array in the vault is incorrect',
      )
      assert.equal(vaultAfter.longAmounts.length, 0, 'Length of the long amounts array in the vault is incorrect')

      assert.equal(
        vaultAfter.shortAmounts[0].toString(),
        createScaledUint256(optionsAmount, 18),
        'Incorrect amount of short stored in the vault',
      )
      assert.equal(
        vaultAfter.collateralAmounts[0].toString(),
        createScaledUint256(collateralAmount, 18),
        'Incorrect amount of collateral stored in the vault',
      )
    })

    it('withdrawing collateral from the safe vault without excess colalteral should fail', async () => {
      const actionArgs = [
        {
          actionType: ActionType.WithdrawCollateral,
          owner: accountOwner1,
          sender: accountOwner1,
          asset: weth.address,
          vaultId: vaultCounter,
          amount: createScaledUint256(collateralAmount, (await weth.decimals()).toNumber()),
          index: '0',
          data: ZERO_ADDR,
        },
      ]
      // TODO: Revert message to be updated
      await expectRevert.unspecified(controllerProxy.operate(actionArgs, {from: accountOwner1}))
    })

    it('should be able to transfer long otokens to another address', async () => {
      // keep track of balances
      const ownerOtokenBalanceBeforeSell = new BigNumber(await ethCall.balanceOf(accountOwner1))
      const buyerBalanceBeforeSell = new BigNumber(await ethCall.balanceOf(buyer))

      // owner sells their call option
      ethCall.transfer(buyer, createScaledUint256(optionsAmount, 18), {from: accountOwner1})

      const ownerOtokenBalanceAfterSell = new BigNumber(await ethCall.balanceOf(accountOwner1))
      const buyerBalanceAfterSell = new BigNumber(await ethCall.balanceOf(buyer))

      assert.equal(
        ownerOtokenBalanceBeforeSell.minus(createScaledUint256(optionsAmount, 18)).toString(),
        ownerOtokenBalanceAfterSell.toString(),
      )
      assert.equal(
        buyerBalanceBeforeSell.plus(createScaledUint256(optionsAmount, 18)).toString(),
        buyerBalanceAfterSell.toString(),
      )

      // owner buys back their call option
      ethCall.transfer(accountOwner1, createScaledUint256(optionsAmount, 18), {from: buyer})
    })

    it('should be able to close out the short position', async () => {
      // Keep track of balances before
      const ownerWethBalanceBefore = new BigNumber(await weth.balanceOf(accountOwner1))
      const marginPoolWethBalanceBefore = new BigNumber(await weth.balanceOf(marginPool.address))
      const ownerOtokenBalanceBefore = new BigNumber(await ethCall.balanceOf(accountOwner1))
      const marginPoolOtokenSupplyBefore = new BigNumber(await ethCall.totalSupply())

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
          amount: createScaledUint256(collateralAmount, (await weth.decimals()).toNumber()),
          index: '0',
          data: ZERO_ADDR,
        },
        {
          actionType: ActionType.BurnShortOption,
          owner: accountOwner1,
          sender: accountOwner1,
          asset: ethCall.address,
          vaultId: vaultCounter,
          amount: createScaledUint256(optionsAmount, 18),
          index: '0',
          data: ZERO_ADDR,
        },
      ]

      await controllerProxy.operate(actionArgs, {from: accountOwner1})

      // keep track of balances after
      const ownerWethBalanceAfter = new BigNumber(await weth.balanceOf(accountOwner1))
      const marginPoolWethBalanceAfter = new BigNumber(await weth.balanceOf(marginPool.address))

      const ownerOtokenBalanceAfter = new BigNumber(await ethCall.balanceOf(accountOwner1))
      const marginPoolOtokenSupplyAfter = new BigNumber(await ethCall.totalSupply())

      // check balances before and after changed as expected
      assert.equal(
        ownerWethBalanceBefore
          .plus(createScaledUint256(collateralAmount, (await weth.decimals()).toNumber()))
          .toString(),
        ownerWethBalanceAfter.toString(),
      )
      assert.equal(
        marginPoolWethBalanceBefore
          .minus(createScaledUint256(collateralAmount, (await weth.decimals()).toNumber()))
          .toString(),
        marginPoolWethBalanceAfter.toString(),
      )
      assert.equal(
        ownerOtokenBalanceBefore.minus(createScaledUint256(optionsAmount, 18)).toString(),
        ownerOtokenBalanceAfter.toString(),
      )
      assert.equal(
        marginPoolOtokenSupplyBefore.minus(createScaledUint256(optionsAmount, 18)).toString(),
        marginPoolOtokenSupplyAfter.toString(),
      )

      // Check that we end at a valid state
      const vaultAfter = await controllerProxy.getVault(accountOwner1, vaultCounter)
      const vaultStateAfter = await calculator.getExcessCollateral(vaultAfter)
      assert.equal(vaultStateAfter[0].toString(), '0')
      assert.equal(vaultStateAfter[1], true)

      // Check the vault balances stored in the contract
      assert.equal(vaultAfter.shortOtokens.length, 1, 'Length of the short otoken array in the vault is incorrect')
      assert.equal(vaultAfter.collateralAssets.length, 1, 'Length of the collateral array in the vault is incorrect')
      assert.equal(vaultAfter.longOtokens.length, 0, 'Length of the long otoken array in the vault is incorrect')

      assert.equal(vaultAfter.shortOtokens[0], ZERO_ADDR, 'Incorrect short otoken in the vault')
      assert.equal(vaultAfter.collateralAssets[0], ZERO_ADDR, 'Incorrect collateral asset in the vault')

      assert.equal(vaultAfter.shortAmounts.length, 1, 'Length of the short amounts array in the vault is incorrect')
      assert.equal(
        vaultAfter.collateralAmounts.length,
        1,
        'Length of the collateral amounts array in the vault is incorrect',
      )
      assert.equal(vaultAfter.longAmounts.length, 0, 'Length of the long amounts array in the vault is incorrect')

      assert.equal(vaultAfter.shortAmounts[0].toString(), '0', 'Incorrect amount of short stored in the vault')
      assert.equal(
        vaultAfter.collateralAmounts[0].toString(),
        '0',
        'Incorrect amount of collateral stored in the vault',
      )
    })
  })
})
