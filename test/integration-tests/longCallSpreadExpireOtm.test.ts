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

const {time} = require('@openzeppelin/test-helpers')
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

contract('Long Call Spread Option expires Otm flow', ([accountOwner1, nakedBuyer, accountOwner2]) => {
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

  let higherStrikeCall: OtokenInstance
  let lowerStrikeCall: OtokenInstance
  const higherStrike = 200
  const lowerStrike = 100

  const optionsAmount = 10
  const collateralAmount = (Math.abs(lowerStrike - higherStrike) * optionsAmount) / lowerStrike

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
      createTokenAmount(lowerStrike, 18),
      expiry,
      false,
    )

    await otokenFactory.createOtoken(
      weth.address,
      usdc.address,
      weth.address,
      createTokenAmount(higherStrike, 18),
      expiry,
      false,
    )

    const lowerStrikeCallAddress = await otokenFactory.getOtoken(
      weth.address,
      usdc.address,
      weth.address,
      createTokenAmount(lowerStrike, 18),
      expiry,
      false,
    )

    lowerStrikeCall = await Otoken.at(lowerStrikeCallAddress)

    const higherStrikeCallAddress = await otokenFactory.getOtoken(
      weth.address,
      usdc.address,
      weth.address,
      createTokenAmount(higherStrike, 18),
      expiry,
      false,
    )

    higherStrikeCall = await Otoken.at(higherStrikeCallAddress)

    // mint weth to user
    const accountOwner1Weth = createTokenAmount(2 * collateralAmount, (await weth.decimals()).toNumber())
    const accountOwner2Weth = createTokenAmount(lowerStrike * optionsAmount, (await weth.decimals()).toNumber())
    const nakedBuyerWeth = createTokenAmount(lowerStrike * optionsAmount, (await weth.decimals()).toNumber())
    weth.mint(accountOwner1, accountOwner1Weth)
    weth.mint(accountOwner2, accountOwner2Weth)
    weth.mint(nakedBuyer, nakedBuyerWeth)

    // have the user approve all the weth transfers
    weth.approve(marginPool.address, accountOwner1Weth, {from: accountOwner1})
    weth.approve(marginPool.address, accountOwner2Weth, {from: accountOwner2})
    weth.approve(marginPool.address, nakedBuyerWeth, {from: nakedBuyer})

    const vaultCounterBefore = new BigNumber(await controllerProxy.getAccountVaultCounter(accountOwner1))
    vaultCounter = vaultCounterBefore.toNumber() + 1
  })

  describe('Integration test: Open a long call spread and close it after expires OTM', () => {
    before(
      'accountOwner2 mints the lower strike call option, sends it to accountOwner1. accountOwner1 opens a long call spread',
      async () => {
        const collateralToMintLong = optionsAmount
        const scaledOptionsAmount = createTokenAmount(optionsAmount, 18)
        const scaledCollateralAmount = createTokenAmount(collateralToMintLong, (await weth.decimals()).toNumber())

        const actionArgsAccountOwner2 = [
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
            asset: lowerStrikeCall.address,
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
            amount: scaledCollateralAmount,
            index: '0',
            data: ZERO_ADDR,
          },
        ]

        await controllerProxy.operate(actionArgsAccountOwner2, {from: accountOwner2})

        // accountOwner2 transfers their lower strike call option to accountOwner1
        await lowerStrikeCall.transfer(accountOwner1, scaledOptionsAmount, {from: accountOwner2})

        const actionArgsAccountOwner1 = [
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
            asset: higherStrikeCall.address,
            vaultId: vaultCounter,
            amount: scaledOptionsAmount,
            index: '0',
            data: ZERO_ADDR,
          },
          {
            actionType: ActionType.DepositLongOption,
            owner: accountOwner1,
            sender: accountOwner1,
            asset: lowerStrikeCall.address,
            vaultId: vaultCounter,
            amount: scaledOptionsAmount,
            index: '0',
            data: ZERO_ADDR,
          },
        ]

        await lowerStrikeCall.approve(marginPool.address, scaledOptionsAmount, {from: accountOwner1})
        await controllerProxy.operate(actionArgsAccountOwner1, {from: accountOwner1})
      },
    )

    it('accountOwner1: close an OTM long call spread position after expiry', async () => {
      const scaledOptionsAmount = createTokenAmount(optionsAmount, 18)

      // Keep track of balances before
      const ownerWethBalanceBefore = new BigNumber(await weth.balanceOf(accountOwner1))
      const marginPoolWethBalanceBefore = new BigNumber(await weth.balanceOf(marginPool.address))
      const ownerOtokenBalanceBefore = new BigNumber(await higherStrikeCall.balanceOf(accountOwner1))
      const higherStrikeCallSupplyBefore = new BigNumber(await higherStrikeCall.totalSupply())
      const lowerStrikeCallSupplyBefore = new BigNumber(await lowerStrikeCall.totalSupply())

      // Check that we start at a valid state
      const vaultBefore = await controllerProxy.getVault(accountOwner1, vaultCounter)
      const vaultStateBefore = await calculator.getExcessCollateral(vaultBefore)
      assert.equal(vaultStateBefore[0].toString(), '0')
      assert.equal(vaultStateBefore[1], true)

      // Set the oracle price
      if ((await time.latest()) < expiry) {
        await time.increaseTo(expiry + 2)
      }
      const strikePriceChange = 50
      const expirySpotPrice = lowerStrike - strikePriceChange
      const scaledETHPrice = createTokenAmount(expirySpotPrice, 18)
      const scaledUSDCPrice = createTokenAmount(1, 18)
      await oracle.setExpiryPriceFinalizedAllPeiodOver(weth.address, expiry, scaledETHPrice, true)
      await oracle.setExpiryPriceFinalizedAllPeiodOver(usdc.address, expiry, scaledUSDCPrice, true)

      // Check that after expiry, the vault excess balance has updated as expected
      const vaultStateBeforeSettlement = await calculator.getExcessCollateral(vaultBefore)
      assert.equal(vaultStateBeforeSettlement[0].toString(), '0')
      assert.equal(vaultStateBeforeSettlement[1], true)

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

      await controllerProxy.operate(actionArgs, {from: accountOwner1})

      // keep track of balances after
      const ownerWethBalanceAfter = new BigNumber(await weth.balanceOf(accountOwner1))
      const marginPoolWethBalanceAfter = new BigNumber(await weth.balanceOf(marginPool.address))

      const ownerOtokenBalanceAfter = new BigNumber(await higherStrikeCall.balanceOf(accountOwner1))
      const higherStrikeCallSupplyAfter = new BigNumber(await higherStrikeCall.totalSupply())
      const lowerStrikeCallSupplyAfter = new BigNumber(await lowerStrikeCall.totalSupply())

      // check balances before and after changed as expected
      assert.equal(ownerWethBalanceBefore.toString(), ownerWethBalanceAfter.toString())
      assert.equal(marginPoolWethBalanceBefore.toString(), marginPoolWethBalanceAfter.toString())
      assert.equal(ownerOtokenBalanceBefore.toString(), ownerOtokenBalanceAfter.toString())
      assert.equal(higherStrikeCallSupplyBefore.toString(), higherStrikeCallSupplyAfter.toString())
      assert.equal(
        lowerStrikeCallSupplyBefore.minus(scaledOptionsAmount).toString(),
        lowerStrikeCallSupplyAfter.toString(),
      )

      // Check that we end at a valid state
      const vaultAfter = await controllerProxy.getVault(accountOwner1, vaultCounter)
      const vaultStateAfter = await calculator.getExcessCollateral(vaultAfter)
      assert.equal(vaultStateAfter[0].toString(), '0')
      assert.equal(vaultStateAfter[1], true)

      // Check the vault balances stored in the contract
      assert.equal(vaultAfter.shortOtokens.length, 0, 'Length of the short otoken array in the vault is incorrect')
      assert.equal(vaultAfter.collateralAssets.length, 0, 'Length of the collateral array in the vault is incorrect')
      assert.equal(vaultAfter.longOtokens.length, 0, 'Length of the long otoken array in the vault is incorrect')

      assert.equal(vaultAfter.shortAmounts.length, 0, 'Length of the short amounts array in the vault is incorrect')
      assert.equal(
        vaultAfter.collateralAmounts.length,
        0,
        'Length of the collateral amounts array in the vault is incorrect',
      )
      assert.equal(vaultAfter.longAmounts.length, 0, 'Length of the long amounts array in the vault is incorrect')
    })

    it('nakedBuyer: exercise the higher strike OTM call option after expiry', async () => {
      const scaledOptionsAmount = createTokenAmount(optionsAmount, 18)
      // accountOwner1 transfers their higher strike call option to the naked buyer
      await higherStrikeCall.transfer(nakedBuyer, scaledOptionsAmount, {from: accountOwner1})

      // Keep track of balances before
      const nakedBuyerWethBalanceBefore = new BigNumber(await weth.balanceOf(nakedBuyer))
      const marginPoolWethBalanceBefore = new BigNumber(await weth.balanceOf(marginPool.address))
      const nakedBuyerOtokenBalanceBefore = new BigNumber(await higherStrikeCall.balanceOf(nakedBuyer))
      const higherStrikeCallSupplyBefore = new BigNumber(await higherStrikeCall.totalSupply())

      const actionArgs = [
        {
          actionType: ActionType.Exercise,
          owner: nakedBuyer,
          sender: nakedBuyer,
          asset: higherStrikeCall.address,
          vaultId: '0',
          amount: scaledOptionsAmount,
          index: '0',
          data: ZERO_ADDR,
        },
      ]

      await higherStrikeCall.approve(marginPool.address, scaledOptionsAmount, {from: nakedBuyer})
      await controllerProxy.operate(actionArgs, {from: nakedBuyer})

      // keep track of balances after
      const nakedBuyerWethBalanceAfter = new BigNumber(await weth.balanceOf(nakedBuyer))
      const marginPoolWethBalanceAfter = new BigNumber(await weth.balanceOf(marginPool.address))
      const nakedBuyerOtokenBalanceAfter = new BigNumber(await higherStrikeCall.balanceOf(nakedBuyer))
      const higherStrikeCallSupplyAfter = new BigNumber(await higherStrikeCall.totalSupply())

      // check balances before and after changed as expected
      assert.equal(nakedBuyerWethBalanceBefore.toString(), nakedBuyerWethBalanceAfter.toString())
      assert.equal(marginPoolWethBalanceBefore.toString(), marginPoolWethBalanceAfter.toString())
      assert.equal(
        nakedBuyerOtokenBalanceBefore.minus(scaledOptionsAmount).toString(),
        nakedBuyerOtokenBalanceAfter.toString(),
      )
      assert.equal(
        higherStrikeCallSupplyBefore.minus(scaledOptionsAmount).toString(),
        higherStrikeCallSupplyAfter.toString(),
      )
    })
  })
})
