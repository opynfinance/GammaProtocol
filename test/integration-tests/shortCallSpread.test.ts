import {
  MockERC20Instance,
  MarginCalculatorInstance,
  MockAddressBookInstance,
  MockOracleInstance,
  OtokenInstance,
  ControllerInstance,
  MockWhitelistModuleInstance,
  MarginPoolInstance,
} from '../../build/types/truffle-types'
import {createVault, createScaledUint256} from '../utils'
import {assert} from 'chai'
import BigNumber from 'bignumber.js'

import Reverter from '../Reverter'

const {expectRevert, time} = require('@openzeppelin/test-helpers')
const AddressBook = artifacts.require('MockAddressBook.sol')
const MockOracle = artifacts.require('MockOracle.sol')
const Otoken = artifacts.require('Otoken.sol')
const MockERC20 = artifacts.require('MockERC20.sol')
const MarginCalculator = artifacts.require('MarginCalculator.sol')
const MockWhitelist = artifacts.require('MockWhitelistModule.sol')
const MarginPool = artifacts.require('MarginPool.sol')
const Controller = artifacts.require('Controller.sol')
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

contract('Put Spread Option flow', ([admin, accountOwner1, accountOperator1, buyer, accountOwner2]) => {
  const reverter = new Reverter(web3)
  let expiry: number

  let addressBook: MockAddressBookInstance
  let calculator: MarginCalculatorInstance
  let controller: ControllerInstance
  let marginPool: MarginPoolInstance

  // whitelist module mock
  let whitelist: MockWhitelistModuleInstance
  // oracle modulce mock
  let oracle: MockOracleInstance

  let usdc: MockERC20Instance
  let dai: MockERC20Instance
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
    expiry = now + time.duration.days(30).toNumber()

    // initiate addressbook first.
    addressBook = await AddressBook.new()
    // setup calculator
    calculator = await MarginCalculator.new(addressBook.address)
    // setup margin pool
    marginPool = await MarginPool.new(addressBook.address)
    // setup controller module
    controller = await Controller.new(addressBook.address)
    // setup mock Oracle module
    oracle = await MockOracle.new(addressBook.address)
    // setup mock whitelist module
    whitelist = await MockWhitelist.new()

    // setup usdc and weth
    // TODO: make usdc 6 decimals
    usdc = await MockERC20.new('USDC', 'USDC', 18)
    dai = await MockERC20.new('DAI', 'DAI', 18)
    weth = await MockERC20.new('WETH', 'WETH', 18)

    // TODO: setup address book
    await addressBook.setOracle(oracle.address)
    await addressBook.setController(controller.address)
    await addressBook.setMarginCalculator(calculator.address)
    await addressBook.setWhitelist(whitelist.address)
    await addressBook.setMarginPool(marginPool.address)

    longCall = await Otoken.new()
    await longCall.init(
      addressBook.address,
      weth.address,
      usdc.address,
      weth.address,
      createScaledUint256(longStrike, 18),
      expiry,
      false,
    )

    shortCall = await Otoken.new()
    await shortCall.init(
      addressBook.address,
      weth.address,
      usdc.address,
      weth.address,
      createScaledUint256(shortStrike, 18),
      expiry,
      false,
    )

    // setup the whitelist module
    await whitelist.whitelistOtoken(longCall.address)
    await whitelist.whitelistOtoken(shortCall.address)
    await whitelist.whitelistCollateral(weth.address)

    // mint weth to user
    weth.mint(accountOwner1, createScaledUint256(2 * collateralAmount, (await weth.decimals()).toNumber()))
    weth.mint(accountOwner2, createScaledUint256(longStrike * optionsAmount, (await weth.decimals()).toNumber()))
    weth.mint(buyer, createScaledUint256(longStrike * optionsAmount, (await weth.decimals()).toNumber()))

    // have the user approve all the weth transfers
    weth.approve(marginPool.address, '10000000000000000000000', {from: accountOwner1})
    weth.approve(marginPool.address, '10000000000000000000000000000000000000000', {from: accountOwner2})
    weth.approve(marginPool.address, '10000000000000000000000000000', {from: buyer})

    const vaultCounterBefore = new BigNumber(await controller.getAccountVaultCounter(accountOwner1))
    vaultCounter = vaultCounterBefore.toNumber() + 1
  })

  describe('Integration test: Sell a short put spread and close it before expiry', () => {
    it('Someone else mints the long option and sends it to the seller', async () => {
      const collateralToMintLong = optionsAmount

      const vault = {
        shortOtokens: [longCall.address],
        longOtokens: [],
        collateralAssets: [weth.address],
        shortAmounts: [createScaledUint256(optionsAmount, 18)],
        longAmounts: [],
        collateralAmounts: [createScaledUint256(optionsAmount, 18)],
      }

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
          amount: createScaledUint256(optionsAmount, 18),
          index: '0',
          data: ZERO_ADDR,
        },
        {
          actionType: ActionType.DepositCollateral,
          owner: accountOwner2,
          sender: accountOwner2,
          asset: weth.address,
          vaultId: vaultCounter,
          amount: createScaledUint256(collateralToMintLong, (await weth.decimals()).toNumber()),
          index: '0',
          data: ZERO_ADDR,
        },
      ]

      await controller.operate(actionArgs, {from: accountOwner2})

      // buyer sells their long put option to owner
      longCall.transfer(accountOwner1, createScaledUint256(optionsAmount, 18), {from: accountOwner2})
    })
    it('Seller should be able to open a short put spread', async () => {
      // Keep track of balances before
      const ownerUsdcBalanceBefore = new BigNumber(await weth.balanceOf(accountOwner1))
      const marginPoolUsdcBalanceBefore = new BigNumber(await weth.balanceOf(marginPool.address))

      const ownerShortOtokenBalanceBefore = new BigNumber(await shortCall.balanceOf(accountOwner1))
      const marginPoolShortOtokenSupplyBefore = new BigNumber(await shortCall.totalSupply())

      const ownerlongOtokenBalanceBefore = new BigNumber(await longCall.balanceOf(accountOwner1))
      const marginPoolLongOtokenSupplyBefore = new BigNumber(await longCall.totalSupply())
      const marginPoolLongOtokenBalanceBefore = new BigNumber(await longCall.balanceOf(marginPool.address))

      // Check that we start at a valid state
      const vaultBefore = await controller.getVault(accountOwner1, vaultCounter)
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
        {
          actionType: ActionType.DepositLongOption,
          owner: accountOwner1,
          sender: accountOwner1,
          asset: longCall.address,
          vaultId: vaultCounter,
          amount: createScaledUint256(optionsAmount, 18),
          index: '0',
          data: ZERO_ADDR,
        },
      ]

      await longCall.approve(marginPool.address, '1000000000000000000000', {from: accountOwner1})
      await controller.operate(actionArgs, {from: accountOwner1})

      // keep track of balances after
      const ownerUsdcBalanceAfter = new BigNumber(await weth.balanceOf(accountOwner1))
      const marginPoolUsdcBalanceAfter = new BigNumber(await weth.balanceOf(marginPool.address))

      const ownerShortOtokenBalanceAfter = new BigNumber(await shortCall.balanceOf(accountOwner1))
      const marginPoolShortOtokenSupplyAfter = new BigNumber(await shortCall.totalSupply())

      const ownerlongOtokenBalanceAfter = new BigNumber(await longCall.balanceOf(accountOwner1))
      const marginPoolLongOtokenSupplyAfter = new BigNumber(await longCall.totalSupply())
      const marginPoolLongOtokenBalanceAfter = new BigNumber(await longCall.balanceOf(marginPool.address))

      // check balances before and after changed as expected
      assert.equal(
        ownerUsdcBalanceBefore
          .minus(createScaledUint256(collateralAmount, (await weth.decimals()).toNumber()))
          .toString(),
        ownerUsdcBalanceAfter.toString(),
      )
      assert.equal(
        marginPoolUsdcBalanceBefore
          .plus(createScaledUint256(collateralAmount, (await weth.decimals()).toNumber()))
          .toString(),
        marginPoolUsdcBalanceAfter.toString(),
      )
      assert.equal(
        ownerShortOtokenBalanceBefore.plus(createScaledUint256(optionsAmount, 18)).toString(),
        ownerShortOtokenBalanceAfter.toString(),
      )
      assert.equal(
        marginPoolShortOtokenSupplyBefore.plus(createScaledUint256(optionsAmount, 18)).toString(),
        marginPoolShortOtokenSupplyAfter.toString(),
      )

      assert.equal(
        ownerlongOtokenBalanceBefore.minus(createScaledUint256(optionsAmount, 18)).toString(),
        ownerlongOtokenBalanceAfter.toString(),
      )
      assert.equal(marginPoolLongOtokenSupplyBefore.toString(), marginPoolLongOtokenSupplyAfter.toString())
      assert.equal(
        marginPoolLongOtokenBalanceBefore.plus(createScaledUint256(optionsAmount, 18)).toString(),
        marginPoolLongOtokenBalanceAfter.toString(),
      )

      // Check that we end at a valid state
      const vaultAfter = await controller.getVault(accountOwner1, vaultCounter)
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
        createScaledUint256(optionsAmount, 18),
        'Incorrect amount of short options stored in the vault',
      )
      assert.equal(
        vaultAfter.collateralAmounts[0].toString(),
        createScaledUint256(collateralAmount, 18),
        'Incorrect amount of collateral stored in the vault',
      )
      assert.equal(
        vaultAfter.longAmounts[0].toString(),
        createScaledUint256(optionsAmount, 18),
        'Incorrect amount of long options stored in the vault',
      )

      await reverter.snapshot()
    })

    it('deposit more collateral into the safe vault', async () => {
      // Keep track of balances before
      const ownerUsdcBalanceBefore = new BigNumber(await weth.balanceOf(accountOwner1))
      const marginPoolUsdcBalanceBefore = new BigNumber(await weth.balanceOf(marginPool.address))

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

      await controller.operate(actionArgs, {from: accountOwner1})

      // keep track of balances after
      const ownerUsdcBalanceAfter = new BigNumber(await weth.balanceOf(accountOwner1))
      const marginPoolUsdcBalanceAfter = new BigNumber(await weth.balanceOf(marginPool.address))

      // check balances before and after changed as expected
      assert.equal(
        ownerUsdcBalanceBefore
          .minus(createScaledUint256(collateralAmount, (await weth.decimals()).toNumber()))
          .toString(),
        ownerUsdcBalanceAfter.toString(),
      )
      assert.equal(
        marginPoolUsdcBalanceBefore
          .plus(createScaledUint256(collateralAmount, (await weth.decimals()).toNumber()))
          .toString(),
        marginPoolUsdcBalanceAfter.toString(),
      )

      // Check that there is excess margin
      const vaultAfter = await controller.getVault(accountOwner1, vaultCounter)
      const vaultStateAfter = await calculator.getExcessCollateral(vaultAfter)
      assert.equal(
        vaultStateAfter[0].toString(),
        createScaledUint256(collateralAmount, (await weth.decimals()).toNumber()),
      )
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
        createScaledUint256(optionsAmount, 18),
        'Incorrect amount of short options stored in the vault',
      )
      assert.equal(
        vaultAfter.collateralAmounts[0].toString(),
        createScaledUint256(2 * collateralAmount, 18),
        'Incorrect amount of collateral stored in the vault',
      )
      assert.equal(
        vaultAfter.longAmounts[0].toString(),
        createScaledUint256(optionsAmount, 18),
        'Incorrect amount of long options stored in the vault',
      )
    })
    it('withdraw excess collateral from the safe vault', async () => {
      // Keep track of balances before
      const ownerUsdcBalanceBefore = new BigNumber(await weth.balanceOf(accountOwner1))
      const marginPoolUsdcBalanceBefore = new BigNumber(await weth.balanceOf(marginPool.address))

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

      await controller.operate(actionArgs, {from: accountOwner1})

      // keep track of balances after
      const ownerUsdcBalanceAfter = new BigNumber(await weth.balanceOf(accountOwner1))
      const marginPoolUsdcBalanceAfter = new BigNumber(await weth.balanceOf(marginPool.address))

      // check balances before and after changed as expected
      assert.equal(
        ownerUsdcBalanceBefore
          .plus(createScaledUint256(collateralAmount, (await weth.decimals()).toNumber()))
          .toString(),
        ownerUsdcBalanceAfter.toString(),
      )
      assert.equal(
        marginPoolUsdcBalanceBefore
          .minus(createScaledUint256(collateralAmount, (await weth.decimals()).toNumber()))
          .toString(),
        marginPoolUsdcBalanceAfter.toString(),
      )

      // Check that we end at a valid state with no extra collateral
      const vaultAfter = await controller.getVault(accountOwner1, vaultCounter)
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
        createScaledUint256(optionsAmount, 18),
        'Incorrect amount of short options stored in the vault',
      )
      assert.equal(
        vaultAfter.collateralAmounts[0].toString(),
        createScaledUint256(collateralAmount, 18),
        'Incorrect amount of collateral stored in the vault',
      )
      assert.equal(
        vaultAfter.longAmounts[0].toString(),
        createScaledUint256(optionsAmount, 18),
        'Incorrect amount of long options stored in the vault',
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
      await expectRevert.unspecified(controller.operate(actionArgs, {from: accountOwner1}))
    })

    it('should be able to transfer long otokens to another address', async () => {
      // keep track of balances
      const ownerShortOtokenBalanceBeforeSell = new BigNumber(await shortCall.balanceOf(accountOwner1))
      const buyerBalanceBeforeSell = new BigNumber(await shortCall.balanceOf(buyer))

      // owner sells their put option
      shortCall.transfer(buyer, createScaledUint256(optionsAmount, 18), {from: accountOwner1})

      const ownerShortOtokenBalanceAfterSell = new BigNumber(await shortCall.balanceOf(accountOwner1))
      const buyerBalanceAfterSell = new BigNumber(await shortCall.balanceOf(buyer))

      assert.equal(
        ownerShortOtokenBalanceBeforeSell.minus(createScaledUint256(optionsAmount, 18)).toString(),
        ownerShortOtokenBalanceAfterSell.toString(),
      )
      assert.equal(
        buyerBalanceBeforeSell.plus(createScaledUint256(optionsAmount, 18)).toString(),
        buyerBalanceAfterSell.toString(),
      )

      // owner buys back their put option
      shortCall.transfer(accountOwner1, createScaledUint256(optionsAmount, 18), {from: buyer})
    })

    xit('should be able to close out the short spread position', async () => {
      // Keep track of balances before
      const ownerUsdcBalanceBefore = new BigNumber(await weth.balanceOf(accountOwner1))
      const marginPoolUsdcBalanceBefore = new BigNumber(await weth.balanceOf(marginPool.address))
      const ownerShortOtokenBalanceBefore = new BigNumber(await shortCall.balanceOf(accountOwner1))
      const marginPoolShortOtokenSupplyBefore = new BigNumber(await shortCall.totalSupply())

      const ownerlongOtokenBalanceBefore = new BigNumber(await longCall.balanceOf(accountOwner1))
      const marginPoolLongOtokenSupplyBefore = new BigNumber(await longCall.totalSupply())
      const marginPoolLongOtokenBalanceBefore = new BigNumber(await longCall.balanceOf(marginPool.address))

      // Check that we start at a valid state
      const vaultBefore = await controller.getVault(accountOwner1, vaultCounter)
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
          asset: shortCall.address,
          vaultId: vaultCounter,
          amount: createScaledUint256(optionsAmount, 18),
          index: '0',
          data: ZERO_ADDR,
        },
        {
          actionType: ActionType.WithdrawLongOption,
          owner: accountOwner1,
          sender: accountOwner1,
          asset: longCall.address,
          vaultId: vaultCounter,
          amount: createScaledUint256(optionsAmount, 18),
          index: '0',
          data: ZERO_ADDR,
        },
      ]

      await controller.operate(actionArgs, {from: accountOwner1})

      // keep track of balances after
      const ownerUsdcBalanceAfter = new BigNumber(await weth.balanceOf(accountOwner1))
      const marginPoolUsdcBalanceAfter = new BigNumber(await weth.balanceOf(marginPool.address))

      const ownerShortOtokenBalanceAfter = new BigNumber(await shortCall.balanceOf(accountOwner1))
      const marginPoolShortOtokenSupplyAfter = new BigNumber(await shortCall.totalSupply())

      const ownerlongOtokenBalanceAfter = new BigNumber(await longCall.balanceOf(accountOwner1))
      const marginPoolLongOtokenSupplyAfter = new BigNumber(await longCall.totalSupply())
      const marginPoolLongOtokenBalanceAfter = new BigNumber(await longCall.balanceOf(marginPool.address))

      // check balances before and after changed as expected
      assert.equal(
        ownerUsdcBalanceBefore
          .plus(createScaledUint256(collateralAmount, (await weth.decimals()).toNumber()))
          .toString(),
        ownerUsdcBalanceAfter.toString(),
      )
      assert.equal(
        marginPoolUsdcBalanceBefore
          .minus(createScaledUint256(collateralAmount, (await weth.decimals()).toNumber()))
          .toString(),
        marginPoolUsdcBalanceAfter.toString(),
      )
      assert.equal(
        ownerShortOtokenBalanceBefore.minus(createScaledUint256(optionsAmount, 18)).toString(),
        ownerShortOtokenBalanceAfter.toString(),
      )
      assert.equal(
        marginPoolShortOtokenSupplyBefore.minus(createScaledUint256(optionsAmount, 18)).toString(),
        marginPoolShortOtokenSupplyAfter.toString(),
      )

      assert.equal(
        ownerlongOtokenBalanceBefore.plus(createScaledUint256(optionsAmount, 18)).toString(),
        ownerlongOtokenBalanceAfter.toString(),
      )
      assert.equal(marginPoolLongOtokenSupplyBefore.toString(), marginPoolLongOtokenSupplyAfter.toString())
      assert.equal(
        marginPoolLongOtokenBalanceBefore.minus(createScaledUint256(optionsAmount, 18)).toString(),
        marginPoolLongOtokenBalanceAfter.toString(),
      )

      // Check that we end at a valid state
      const vaultAfter = await controller.getVault(accountOwner1, vaultCounter)
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

  describe('Integration test: Sell a naked short put and close it after expiry', () => {
    describe('OTM Tests', async () => {
      before('revert to state where options have been created', async () => {
        await reverter.revert()
      })

      it('Seller: close an OTM position after expiry', async () => {
        // Set the oracle price
        if ((await time.latest()) < expiry) {
          await time.increaseTo(expiry + 2)
        }
        await oracle.setIsFinalized(weth.address, expiry, true)
        const strikePriceChange = 100
        const expirySpotPrice = shortStrike + strikePriceChange
        await oracle.setExpiryPrice(weth.address, expiry, createScaledUint256(expirySpotPrice, 18))

        // Keep track of balances before
        const ownerUsdcBalanceBefore = new BigNumber(await weth.balanceOf(accountOwner1))
        const marginPoolUsdcBalanceBefore = new BigNumber(await weth.balanceOf(marginPool.address))
        const ownerOtokenBalanceBefore = new BigNumber(await shortCall.balanceOf(accountOwner1))
        const marginPoolOtokenSupplyBefore = new BigNumber(await shortCall.totalSupply())

        // Check that we start at a valid state
        const vaultBefore = await controller.getVault(accountOwner1, vaultCounter)
        const vaultStateBefore = await calculator.getExcessCollateral(vaultBefore)
        assert.equal(vaultStateBefore[0].toString(), '0')
        assert.equal(vaultStateBefore[1], true)

        const actionArgs = [
          {
            actionType: ActionType.SettleVault,
            owner: accountOwner1,
            sender: accountOwner1,
            asset: ZERO_ADDR,
            vaultId: vaultCounter,
            amount: '0',
            index: '0',
            data: ZERO_ADDR,
          },
        ]

        await controller.operate(actionArgs, {from: accountOwner1})

        // keep track of balances after
        const ownerUsdcBalanceAfter = new BigNumber(await weth.balanceOf(accountOwner1))
        const marginPoolUsdcBalanceAfter = new BigNumber(await weth.balanceOf(marginPool.address))

        const ownerOtokenBalanceAfter = new BigNumber(await shortCall.balanceOf(accountOwner1))
        const marginPoolOtokenSupplyAfter = new BigNumber(await shortCall.totalSupply())

        // check balances before and after changed as expected
        assert.equal(
          ownerUsdcBalanceBefore
            .plus(createScaledUint256(collateralAmount, (await weth.decimals()).toNumber()))
            .toString(),
          ownerUsdcBalanceAfter.toString(),
        )
        assert.equal(
          marginPoolUsdcBalanceBefore
            .minus(createScaledUint256(collateralAmount, (await weth.decimals()).toNumber()))
            .toString(),
          marginPoolUsdcBalanceAfter.toString(),
        )
        assert.equal(ownerOtokenBalanceBefore.toString(), ownerOtokenBalanceAfter.toString())
        assert.equal(marginPoolOtokenSupplyBefore.toString(), marginPoolOtokenSupplyAfter.toString())

        // Check that we end at a valid state
        const vaultAfter = await controller.getVault(accountOwner1, vaultCounter)
        const vaultStateAfter = await calculator.getExcessCollateral(vaultAfter)
        assert.equal(vaultStateAfter[0].toString(), '0')
        assert.equal(vaultStateAfter[1], true)

        // Check the vault balances stored in the contract
        assert.equal(vaultAfter.shortOtokens.length, 1, 'Length of the short otoken array in the vault is incorrect')
        assert.equal(vaultAfter.collateralAssets.length, 1, 'Length of the collateral array in the vault is incorrect')
        assert.equal(vaultAfter.longOtokens.length, 1, 'Length of the long otoken array in the vault is incorrect')

        assert.equal(vaultAfter.shortOtokens[0], ZERO_ADDR, 'Incorrect short otoken in the vault')
        assert.equal(vaultAfter.longOtokens[0], ZERO_ADDR, 'Incorrect long otoken in the vault')
        assert.equal(vaultAfter.collateralAssets[0], ZERO_ADDR, 'Incorrect collateral asset in the vault')

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

      xit('Buyer: exercise OTM put option after expiry', async () => {
        // owner sells their put option
        shortCall.transfer(buyer, createScaledUint256(optionsAmount, 18), {from: accountOwner1})

        // Keep track of balances before
        const ownerUsdcBalanceBefore = new BigNumber(await weth.balanceOf(buyer))
        const marginPoolUsdcBalanceBefore = new BigNumber(await weth.balanceOf(marginPool.address))
        const ownerOtokenBalanceBefore = new BigNumber(await shortCall.balanceOf(buyer))
        const marginPoolOtokenSupplyBefore = new BigNumber(await shortCall.totalSupply())

        const actionArgs = [
          {
            actionType: ActionType.Exercise,
            owner: buyer,
            sender: buyer,
            asset: shortCall.address,
            vaultId: '0',
            amount: createScaledUint256(optionsAmount, 18),
            index: '0',
            data: ZERO_ADDR,
          },
        ]

        await shortCall.approve(marginPool.address, createScaledUint256(optionsAmount, 18), {from: buyer})
        await controller.operate(actionArgs, {from: buyer})

        // keep track of balances after
        const ownerUsdcBalanceAfter = new BigNumber(await weth.balanceOf(buyer))
        const marginPoolUsdcBalanceAfter = new BigNumber(await weth.balanceOf(marginPool.address))
        const ownerOtokenBalanceAfter = new BigNumber(await shortCall.balanceOf(buyer))
        const marginPoolOtokenSupplyAfter = new BigNumber(await shortCall.totalSupply())

        // check balances before and after changed as expected
        assert.equal(ownerUsdcBalanceBefore.toString(), ownerUsdcBalanceAfter.toString())
        assert.equal(marginPoolUsdcBalanceBefore.toString(), marginPoolUsdcBalanceAfter.toString())
        assert.equal(
          ownerOtokenBalanceBefore.minus(createScaledUint256(optionsAmount, 18)).toString(),
          ownerOtokenBalanceAfter.toString(),
        )
        assert.equal(
          marginPoolOtokenSupplyBefore.minus(createScaledUint256(optionsAmount, 18)).toString(),
          marginPoolOtokenSupplyAfter.toString(),
        )
      })
    })

    describe('ITM Tests', async () => {
      before('revert to state where options have been created', async () => {
        await reverter.revert()
      })

      it('Seller: close an ITM position after expiry', async () => {
        // Set the oracle price
        if ((await time.latest()) < expiry) {
          await time.increaseTo(expiry + 2)
        }
        await oracle.setIsFinalized(weth.address, expiry, true)
        const strikePriceChange = 50
        const expirySpotPrice = shortStrike - strikePriceChange
        await oracle.setExpiryPrice(weth.address, expiry, createScaledUint256(expirySpotPrice, 18))

        // Keep track of balances before
        const ownerUsdcBalanceBefore = new BigNumber(await weth.balanceOf(accountOwner1))
        const marginPoolUsdcBalanceBefore = new BigNumber(await weth.balanceOf(marginPool.address))
        const ownerOtokenBalanceBefore = new BigNumber(await shortCall.balanceOf(accountOwner1))
        const marginPoolOtokenSupplyBefore = new BigNumber(await shortCall.totalSupply())

        // Check that we start at a valid state
        const vaultBefore = await controller.getVault(accountOwner1, vaultCounter)
        const vaultStateBefore = await calculator.getExcessCollateral(vaultBefore)
        assert.equal(vaultStateBefore[0].toString(), '0')
        assert.equal(vaultStateBefore[1], true)

        const actionArgs = [
          {
            actionType: ActionType.SettleVault,
            owner: accountOwner1,
            sender: accountOwner1,
            asset: ZERO_ADDR,
            vaultId: vaultCounter,
            amount: '0',
            index: '0',
            data: ZERO_ADDR,
          },
        ]

        await controller.operate(actionArgs, {from: accountOwner1})

        // keep track of balances after
        const ownerUsdcBalanceAfter = new BigNumber(await weth.balanceOf(accountOwner1))
        const marginPoolUsdcBalanceAfter = new BigNumber(await weth.balanceOf(marginPool.address))

        const ownerOtokenBalanceAfter = new BigNumber(await shortCall.balanceOf(accountOwner1))
        const marginPoolOtokenSupplyAfter = new BigNumber(await shortCall.totalSupply())

        const collateralPayout = Math.max(collateralAmount - strikePriceChange * optionsAmount, 0)

        // check balances before and after changed as expected
        assert.equal(
          ownerUsdcBalanceBefore
            .plus(createScaledUint256(collateralPayout, (await weth.decimals()).toNumber()))
            .toString(),
          ownerUsdcBalanceAfter.toString(),
        )
        assert.equal(
          marginPoolUsdcBalanceBefore
            .minus(createScaledUint256(collateralPayout, (await weth.decimals()).toNumber()))
            .toString(),
          marginPoolUsdcBalanceAfter.toString(),
        )
        assert.equal(ownerOtokenBalanceBefore.toString(), ownerOtokenBalanceAfter.toString())
        assert.equal(marginPoolOtokenSupplyBefore.toString(), marginPoolOtokenSupplyAfter.toString())

        // Check that we end at a valid state
        const vaultAfter = await controller.getVault(accountOwner1, vaultCounter)
        const vaultStateAfter = await calculator.getExcessCollateral(vaultAfter)
        assert.equal(vaultStateAfter[0].toString(), '0')
        assert.equal(vaultStateAfter[1], true)

        // Check the vault balances stored in the contract
        assert.equal(vaultAfter.shortOtokens.length, 1, 'Length of the short otoken array in the vault is incorrect')
        assert.equal(vaultAfter.collateralAssets.length, 1, 'Length of the collateral array in the vault is incorrect')
        assert.equal(vaultAfter.longOtokens.length, 1, 'Length of the long otoken array in the vault is incorrect')

        assert.equal(vaultAfter.shortOtokens[0], ZERO_ADDR, 'Incorrect short otoken in the vault')
        assert.equal(vaultAfter.longOtokens[0], ZERO_ADDR, 'Incorrect long otoken in the vault')
        assert.equal(vaultAfter.collateralAssets[0], ZERO_ADDR, 'Incorrect collateral asset in the vault')

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

      xit('Buyer: exercise ITM put option after expiry', async () => {
        // owner sells their put option
        shortCall.transfer(buyer, createScaledUint256(optionsAmount, 18), {from: accountOwner1})
        // oracle orice decreases
        const strikePriceChange = 50

        // Keep track of balances before
        const ownerUsdcBalanceBefore = new BigNumber(await weth.balanceOf(buyer))
        const marginPoolUsdcBalanceBefore = new BigNumber(await weth.balanceOf(marginPool.address))
        const ownerOtokenBalanceBefore = new BigNumber(await shortCall.balanceOf(buyer))
        const marginPoolOtokenSupplyBefore = new BigNumber(await shortCall.totalSupply())

        const actionArgs = [
          {
            actionType: ActionType.Exercise,
            owner: buyer,
            sender: buyer,
            asset: shortCall.address,
            vaultId: '0',
            amount: createScaledUint256(optionsAmount, 18),
            index: '0',
            data: ZERO_ADDR,
          },
        ]

        await shortCall.approve(marginPool.address, createScaledUint256(optionsAmount, 18), {from: buyer})
        await controller.operate(actionArgs, {from: buyer})

        // keep track of balances after
        const ownerUsdcBalanceAfter = new BigNumber(await weth.balanceOf(buyer))
        const marginPoolUsdcBalanceAfter = new BigNumber(await weth.balanceOf(marginPool.address))
        const ownerOtokenBalanceAfter = new BigNumber(await shortCall.balanceOf(buyer))
        const marginPoolOtokenSupplyAfter = new BigNumber(await shortCall.totalSupply())

        const payout = strikePriceChange * optionsAmount

        // check balances before and after changed as expected
        assert.equal(
          ownerUsdcBalanceBefore.plus(createScaledUint256(payout, (await weth.decimals()).toNumber())).toString(),
          ownerUsdcBalanceAfter.toString(),
        )
        assert.equal(
          marginPoolUsdcBalanceBefore.minus(createScaledUint256(payout, (await weth.decimals()).toNumber())).toString(),
          marginPoolUsdcBalanceAfter.toString(),
        )
        assert.equal(
          ownerOtokenBalanceBefore.minus(createScaledUint256(optionsAmount, 18)).toString(),
          ownerOtokenBalanceAfter.toString(),
        )
        assert.equal(
          marginPoolOtokenSupplyBefore.minus(createScaledUint256(optionsAmount, 18)).toString(),
          marginPoolOtokenSupplyAfter.toString(),
        )
      })
    })
  })
})
