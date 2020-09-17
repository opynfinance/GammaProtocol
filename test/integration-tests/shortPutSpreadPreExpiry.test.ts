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
import {createTokenAmount, getExpiry} from '../utils'
import {assert} from 'chai'
import BigNumber from 'bignumber.js'

const {expectRevert} = require('@openzeppelin/test-helpers')
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

contract('Short Put Spread Option closed before expiry flow', ([accountOwner1, nakedBuyer, accountOwner2]) => {
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

  let higherStrikePut: OtokenInstance
  let lowerStrikePut: OtokenInstance
  const higherStrike = 300
  const lowerStrike = 200

  const optionsAmount = 10
  const collateralAmount = Math.abs(higherStrike - lowerStrike) * optionsAmount

  let vaultCounter: number

  before('set up contracts', async () => {
    expiry = await getExpiry()
    // setup usdc and weth
    usdc = await MockERC20.new('USDC', 'USDC', 6)
    weth = await MockERC20.new('WETH', 'WETH', 18)

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
    await whitelist.whitelistCollateral(usdc.address)
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
      usdc.address,
      createTokenAmount(lowerStrike, 18),
      expiry,
      true,
    )

    await otokenFactory.createOtoken(
      weth.address,
      usdc.address,
      usdc.address,
      createTokenAmount(higherStrike, 18),
      expiry,
      true,
    )

    const lowerStrikePutAddress = await otokenFactory.getOtoken(
      weth.address,
      usdc.address,
      usdc.address,
      createTokenAmount(lowerStrike, 18),
      expiry,
      true,
    )

    lowerStrikePut = await Otoken.at(lowerStrikePutAddress)

    const higherStrikePutAddress = await otokenFactory.getOtoken(
      weth.address,
      usdc.address,
      usdc.address,
      createTokenAmount(higherStrike, 18),
      expiry,
      true,
    )

    higherStrikePut = await Otoken.at(higherStrikePutAddress)

    // mint usdc to user
    const accountOwner1Usdc = createTokenAmount(2 * collateralAmount, (await usdc.decimals()).toNumber())
    const accountOwner2Usdc = createTokenAmount(lowerStrike * optionsAmount, (await usdc.decimals()).toNumber())
    const nakedBuyerUsdc = createTokenAmount(lowerStrike * optionsAmount, (await usdc.decimals()).toNumber())

    usdc.mint(accountOwner1, accountOwner1Usdc)
    usdc.mint(accountOwner2, accountOwner2Usdc)
    usdc.mint(nakedBuyer, nakedBuyerUsdc)

    // have the user approve all the usdc transfers
    usdc.approve(marginPool.address, accountOwner1Usdc, {from: accountOwner1})
    usdc.approve(marginPool.address, accountOwner2Usdc, {from: accountOwner2})

    const vaultCounterBefore = new BigNumber(await controllerProxy.getAccountVaultCounter(accountOwner1))
    vaultCounter = vaultCounterBefore.toNumber() + 1
  })

  describe('Integration test: Open a short put spread and close it before expiry', () => {
    before('accountOwner2 mints the lower strike put option, sends it to accountOwner1', async () => {
      const collateralToMintLong = lowerStrike * optionsAmount
      const scaledOptionsAmount = createTokenAmount(optionsAmount, 18)
      const scaledCollateralToMintLong = createTokenAmount(collateralToMintLong, (await usdc.decimals()).toNumber())

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
          asset: lowerStrikePut.address,
          vaultId: vaultCounter,
          amount: scaledOptionsAmount,
          index: '0',
          data: ZERO_ADDR,
        },
        {
          actionType: ActionType.DepositCollateral,
          owner: accountOwner2,
          sender: accountOwner2,
          asset: usdc.address,
          vaultId: vaultCounter,
          amount: scaledCollateralToMintLong,
          index: '0',
          data: ZERO_ADDR,
        },
      ]

      await controllerProxy.operate(actionArgs, {from: accountOwner2})

      // accountOwner2 transfers their lower strike put option to accountOwner1
      lowerStrikePut.transfer(accountOwner1, scaledOptionsAmount, {from: accountOwner2})
    })
    it('accountOwner1 should be able to open a short put spread', async () => {
      const scaledOptionsAmount = createTokenAmount(optionsAmount, 18)
      const scaledCollateralAmount = createTokenAmount(collateralAmount, (await usdc.decimals()).toNumber())

      // Keep track of balances before
      const ownerUsdcBalanceBefore = new BigNumber(await usdc.balanceOf(accountOwner1))
      const marginPoolUsdcBalanceBefore = new BigNumber(await usdc.balanceOf(marginPool.address))

      const ownerShortOtokenBalanceBefore = new BigNumber(await higherStrikePut.balanceOf(accountOwner1))
      const higherStrikePutSupplyBefore = new BigNumber(await higherStrikePut.totalSupply())

      const ownerlongOtokenBalanceBefore = new BigNumber(await lowerStrikePut.balanceOf(accountOwner1))
      const lowerStrikePutSupplyBefore = new BigNumber(await lowerStrikePut.totalSupply())
      const marginPoolLongOtokenBalanceBefore = new BigNumber(await lowerStrikePut.balanceOf(marginPool.address))

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
          asset: higherStrikePut.address,
          vaultId: vaultCounter,
          amount: scaledOptionsAmount,
          index: '0',
          data: ZERO_ADDR,
        },
        {
          actionType: ActionType.DepositCollateral,
          owner: accountOwner1,
          sender: accountOwner1,
          asset: usdc.address,
          vaultId: vaultCounter,
          amount: scaledCollateralAmount,
          index: '0',
          data: ZERO_ADDR,
        },
        {
          actionType: ActionType.DepositLongOption,
          owner: accountOwner1,
          sender: accountOwner1,
          asset: lowerStrikePut.address,
          vaultId: vaultCounter,
          amount: scaledOptionsAmount,
          index: '0',
          data: ZERO_ADDR,
        },
      ]

      await lowerStrikePut.approve(marginPool.address, scaledOptionsAmount, {from: accountOwner1})
      await controllerProxy.operate(actionArgs, {from: accountOwner1})

      // keep track of balances after
      const ownerUsdcBalanceAfter = new BigNumber(await usdc.balanceOf(accountOwner1))
      const marginPoolUsdcBalanceAfter = new BigNumber(await usdc.balanceOf(marginPool.address))

      const ownerShortOtokenBalanceAfter = new BigNumber(await higherStrikePut.balanceOf(accountOwner1))
      const higherStrikePutSupplyAfter = new BigNumber(await higherStrikePut.totalSupply())

      const ownerlongOtokenBalanceAfter = new BigNumber(await lowerStrikePut.balanceOf(accountOwner1))
      const lowerStrikePutSupplyAfter = new BigNumber(await lowerStrikePut.totalSupply())
      const marginPoolLongOtokenBalanceAfter = new BigNumber(await lowerStrikePut.balanceOf(marginPool.address))

      // check balances before and after changed as expected
      assert.equal(ownerUsdcBalanceBefore.minus(scaledCollateralAmount).toString(), ownerUsdcBalanceAfter.toString())
      assert.equal(
        marginPoolUsdcBalanceBefore.plus(scaledCollateralAmount).toString(),
        marginPoolUsdcBalanceAfter.toString(),
      )
      assert.equal(
        ownerShortOtokenBalanceBefore.plus(scaledOptionsAmount).toString(),
        ownerShortOtokenBalanceAfter.toString(),
      )
      assert.equal(
        higherStrikePutSupplyBefore.plus(scaledOptionsAmount).toString(),
        higherStrikePutSupplyAfter.toString(),
      )

      assert.equal(
        ownerlongOtokenBalanceBefore.minus(scaledOptionsAmount).toString(),
        ownerlongOtokenBalanceAfter.toString(),
      )
      assert.equal(lowerStrikePutSupplyBefore.toString(), lowerStrikePutSupplyAfter.toString())
      assert.equal(
        marginPoolLongOtokenBalanceBefore.plus(scaledOptionsAmount).toString(),
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

      assert.equal(vaultAfter.shortOtokens[0], higherStrikePut.address, 'Incorrect short otoken in the vault')
      assert.equal(vaultAfter.collateralAssets[0], usdc.address, 'Incorrect collateral asset in the vault')
      assert.equal(vaultAfter.longOtokens[0], lowerStrikePut.address, 'Incorrect long otoken in the vault')

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

    it('accountOwner1 deposits more collateral into the safe vault', async () => {
      const scaledOptionsAmount = createTokenAmount(optionsAmount, 18)
      const scaledCollateralAmount = createTokenAmount(collateralAmount, (await usdc.decimals()).toNumber())
      // Keep track of balances before
      const ownerUsdcBalanceBefore = new BigNumber(await usdc.balanceOf(accountOwner1))
      const marginPoolUsdcBalanceBefore = new BigNumber(await usdc.balanceOf(marginPool.address))

      const actionArgs = [
        {
          actionType: ActionType.DepositCollateral,
          owner: accountOwner1,
          sender: accountOwner1,
          asset: usdc.address,
          vaultId: vaultCounter,
          amount: scaledCollateralAmount,
          index: '0',
          data: ZERO_ADDR,
        },
      ]

      await controllerProxy.operate(actionArgs, {from: accountOwner1})

      // keep track of balances after
      const ownerUsdcBalanceAfter = new BigNumber(await usdc.balanceOf(accountOwner1))
      const marginPoolUsdcBalanceAfter = new BigNumber(await usdc.balanceOf(marginPool.address))

      // check balances before and after changed as expected
      assert.equal(ownerUsdcBalanceBefore.minus(scaledCollateralAmount).toString(), ownerUsdcBalanceAfter.toString())
      assert.equal(
        marginPoolUsdcBalanceBefore.plus(scaledCollateralAmount).toString(),
        marginPoolUsdcBalanceAfter.toString(),
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

      assert.equal(vaultAfter.shortOtokens[0], higherStrikePut.address, 'Incorrect short otoken in the vault')
      assert.equal(vaultAfter.collateralAssets[0], usdc.address, 'Incorrect collateral asset in the vault')
      assert.equal(vaultAfter.longOtokens[0], lowerStrikePut.address, 'Incorrect long otoken in the vault')

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
        createTokenAmount(2 * collateralAmount, (await usdc.decimals()).toNumber()),
        'Incorrect amount of collateral stored in the vault',
      )
      assert.equal(
        vaultAfter.longAmounts[0].toString(),
        scaledOptionsAmount,
        'Incorrect amount of long options stored in the vault',
      )
    })
    it('accountOwner1 withdraws excess collateral from the safe vault', async () => {
      const scaledOptionsAmount = createTokenAmount(optionsAmount, 18)
      const scaledCollateralAmount = createTokenAmount(collateralAmount, (await usdc.decimals()).toNumber())
      // Keep track of balances before
      const ownerUsdcBalanceBefore = new BigNumber(await usdc.balanceOf(accountOwner1))
      const marginPoolUsdcBalanceBefore = new BigNumber(await usdc.balanceOf(marginPool.address))

      const actionArgs = [
        {
          actionType: ActionType.WithdrawCollateral,
          owner: accountOwner1,
          sender: accountOwner1,
          asset: usdc.address,
          vaultId: vaultCounter,
          amount: scaledCollateralAmount,
          index: '0',
          data: ZERO_ADDR,
        },
      ]

      await controllerProxy.operate(actionArgs, {from: accountOwner1})

      // keep track of balances after
      const ownerUsdcBalanceAfter = new BigNumber(await usdc.balanceOf(accountOwner1))
      const marginPoolUsdcBalanceAfter = new BigNumber(await usdc.balanceOf(marginPool.address))

      // check balances before and after changed as expected
      assert.equal(ownerUsdcBalanceBefore.plus(scaledCollateralAmount).toString(), ownerUsdcBalanceAfter.toString())
      assert.equal(
        marginPoolUsdcBalanceBefore.minus(scaledCollateralAmount).toString(),
        marginPoolUsdcBalanceAfter.toString(),
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

      assert.equal(vaultAfter.shortOtokens[0], higherStrikePut.address, 'Incorrect short otoken in the vault')
      assert.equal(vaultAfter.collateralAssets[0], usdc.address, 'Incorrect collateral asset in the vault')
      assert.equal(vaultAfter.longOtokens[0], lowerStrikePut.address, 'Incorrect long otoken in the vault')

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

    it('accountOwner1 withdrawing collateral from the safe vault without excess colalteral should fail', async () => {
      const scaledCollateralAmount = createTokenAmount(collateralAmount, (await usdc.decimals()).toNumber())
      const actionArgs = [
        {
          actionType: ActionType.WithdrawCollateral,
          owner: accountOwner1,
          sender: accountOwner1,
          asset: usdc.address,
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
      const ownerShortOtokenBalanceBeforeSell = new BigNumber(await higherStrikePut.balanceOf(accountOwner1))
      const nakedBuyerBalanceBeforeSell = new BigNumber(await higherStrikePut.balanceOf(nakedBuyer))

      // owner sells their put option
      higherStrikePut.transfer(nakedBuyer, scaledOptionsAmount, {from: accountOwner1})

      const ownerShortOtokenBalanceAfterSell = new BigNumber(await higherStrikePut.balanceOf(accountOwner1))
      const nakedBuyerBalanceAfterSell = new BigNumber(await higherStrikePut.balanceOf(nakedBuyer))

      assert.equal(
        ownerShortOtokenBalanceBeforeSell.minus(scaledOptionsAmount).toString(),
        ownerShortOtokenBalanceAfterSell.toString(),
      )
      assert.equal(
        nakedBuyerBalanceBeforeSell.plus(scaledOptionsAmount).toString(),
        nakedBuyerBalanceAfterSell.toString(),
      )

      // owner buys back their put option
      higherStrikePut.transfer(accountOwner1, scaledOptionsAmount, {from: nakedBuyer})
    })

    it('accountOwner1 should be able to close out the short spread position', async () => {
      const scaledOptionsAmount = createTokenAmount(optionsAmount, 18)
      const scaledCollateralAmount = createTokenAmount(collateralAmount, (await usdc.decimals()).toNumber())
      // Keep track of balances before
      const ownerUsdcBalanceBefore = new BigNumber(await usdc.balanceOf(accountOwner1))
      const marginPoolUsdcBalanceBefore = new BigNumber(await usdc.balanceOf(marginPool.address))
      const ownerShortOtokenBalanceBefore = new BigNumber(await higherStrikePut.balanceOf(accountOwner1))
      const higherStrikePutSupplyBefore = new BigNumber(await higherStrikePut.totalSupply())

      const ownerlongOtokenBalanceBefore = new BigNumber(await lowerStrikePut.balanceOf(accountOwner1))
      const lowerStrikePutSupplyBefore = new BigNumber(await lowerStrikePut.totalSupply())
      const marginPoolLongOtokenBalanceBefore = new BigNumber(await lowerStrikePut.balanceOf(marginPool.address))

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
          asset: usdc.address,
          vaultId: vaultCounter,
          amount: scaledCollateralAmount,
          index: '0',
          data: ZERO_ADDR,
        },
        {
          actionType: ActionType.BurnShortOption,
          owner: accountOwner1,
          sender: accountOwner1,
          asset: higherStrikePut.address,
          vaultId: vaultCounter,
          amount: scaledOptionsAmount,
          index: '0',
          data: ZERO_ADDR,
        },
        {
          actionType: ActionType.WithdrawLongOption,
          owner: accountOwner1,
          sender: accountOwner1,
          asset: lowerStrikePut.address,
          vaultId: vaultCounter,
          amount: scaledOptionsAmount,
          index: '0',
          data: ZERO_ADDR,
        },
      ]

      await controllerProxy.operate(actionArgs, {from: accountOwner1})

      // keep track of balances after
      const ownerUsdcBalanceAfter = new BigNumber(await usdc.balanceOf(accountOwner1))
      const marginPoolUsdcBalanceAfter = new BigNumber(await usdc.balanceOf(marginPool.address))

      const ownerShortOtokenBalanceAfter = new BigNumber(await higherStrikePut.balanceOf(accountOwner1))
      const higherStrikePutSupplyAfter = new BigNumber(await higherStrikePut.totalSupply())

      const ownerlongOtokenBalanceAfter = new BigNumber(await lowerStrikePut.balanceOf(accountOwner1))
      const lowerStrikePutSupplyAfter = new BigNumber(await lowerStrikePut.totalSupply())
      const marginPoolLongOtokenBalanceAfter = new BigNumber(await lowerStrikePut.balanceOf(marginPool.address))

      // check balances before and after changed as expected
      assert.equal(ownerUsdcBalanceBefore.plus(scaledCollateralAmount).toString(), ownerUsdcBalanceAfter.toString())
      assert.equal(
        marginPoolUsdcBalanceBefore.minus(scaledCollateralAmount).toString(),
        marginPoolUsdcBalanceAfter.toString(),
      )
      assert.equal(
        ownerShortOtokenBalanceBefore.minus(scaledOptionsAmount).toString(),
        ownerShortOtokenBalanceAfter.toString(),
      )
      assert.equal(
        higherStrikePutSupplyBefore.minus(scaledOptionsAmount).toString(),
        higherStrikePutSupplyAfter.toString(),
      )

      assert.equal(
        ownerlongOtokenBalanceBefore.plus(scaledOptionsAmount).toString(),
        ownerlongOtokenBalanceAfter.toString(),
      )
      assert.equal(lowerStrikePutSupplyBefore.toString(), lowerStrikePutSupplyAfter.toString())
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
