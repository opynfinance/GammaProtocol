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
import {createVault, createScaledUint256} from '../utils'
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

contract('Short Call Spread Option flow', ([admin, accountOwner1, accountOperator1, buyer, accountOwner2]) => {
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
    // setup controllerProxy module
    const lib = await MarginAccount.new()
    await Controller.link('MarginAccount', lib.address)
    controllerImplementation = await Controller.new(addressBook.address)
    // setup mock Oracle module
    oracle = await MockOracle.new(addressBook.address)
    // setup mock whitelist module
    whitelist = await MockWhitelist.new()

    // setup usdc and weth
    // TODO: make usdc 6 decimals
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

    const vaultCounterBefore = new BigNumber(await controllerProxy.getAccountVaultCounter(accountOwner1))
    vaultCounter = vaultCounterBefore.toNumber() + 1
  })

  describe('Integration test: Sell a short call spread and close it after expires OTM', () => {
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

      const actionArgsBuyer = [
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

      await controllerProxy.operate(actionArgsBuyer, {from: accountOwner2})

      // buyer sells their long put option to owner
      longCall.transfer(accountOwner1, createScaledUint256(optionsAmount, 18), {from: accountOwner2})

      const actionArgsSeller = [
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
      await controllerProxy.operate(actionArgsSeller, {from: accountOwner1})
    })

    it('Seller: close an ITM position after expiry', async () => {
      // Keep track of balances before
      const ownerWethBalanceBefore = new BigNumber(await weth.balanceOf(accountOwner1))
      const marginPoolWethBalanceBefore = new BigNumber(await weth.balanceOf(marginPool.address))
      const ownerOtokenBalanceBefore = new BigNumber(await shortCall.balanceOf(accountOwner1))
      const marginPoolOtokenSupplyBefore = new BigNumber(await shortCall.totalSupply())

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
      const expirySpotPrice = shortStrike - strikePriceChange
      await oracle.setExpiryPrice(weth.address, expiry, createScaledUint256(expirySpotPrice, 18))
      await oracle.setIsDisputePeriodOver(weth.address, expiry, true)
      await oracle.setIsFinalized(weth.address, expiry, true)

      const collateralPayout = Math.max(collateralAmount - (strikePriceChange * optionsAmount) / expirySpotPrice, 0)

      // Check that after expiry, the vault excess balance has updated as expected
      const vaultStateBeforeSettlement = await calculator.getExcessCollateral(vaultBefore)
      assert.equal(
        vaultStateBeforeSettlement[0].toString(),
        createScaledUint256(collateralPayout, (await usdc.decimals()).toNumber()),
      )
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

      const ownerOtokenBalanceAfter = new BigNumber(await shortCall.balanceOf(accountOwner1))
      const marginPoolOtokenSupplyAfter = new BigNumber(await shortCall.totalSupply())

      // check balances before and after changed as expected
      assert.equal(
        ownerWethBalanceBefore
          .plus(createScaledUint256(collateralPayout, (await weth.decimals()).toNumber()))
          .toString(),
        ownerWethBalanceAfter.toString(),
      )
      assert.equal(
        marginPoolWethBalanceBefore
          .minus(createScaledUint256(collateralPayout, (await weth.decimals()).toNumber()))
          .toString(),
        marginPoolWethBalanceAfter.toString(),
      )
      assert.equal(ownerOtokenBalanceBefore.toString(), ownerOtokenBalanceAfter.toString())
      assert.equal(marginPoolOtokenSupplyBefore.toString(), marginPoolOtokenSupplyAfter.toString())

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

    it('Buyer: exercise ITM put option after expiry', async () => {
      // owner sells their put option
      shortCall.transfer(buyer, createScaledUint256(optionsAmount, 18), {from: accountOwner1})
      // oracle orice decreases
      const strikePriceChange = 50
      const expirySpotPrice = shortStrike - strikePriceChange

      // Keep track of balances before
      const ownerWethBalanceBefore = new BigNumber(await weth.balanceOf(buyer))
      const marginPoolWethBalanceBefore = new BigNumber(await weth.balanceOf(marginPool.address))
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
      await controllerProxy.operate(actionArgs, {from: buyer})

      // keep track of balances after
      const ownerWethBalanceAfter = new BigNumber(await weth.balanceOf(buyer))
      const marginPoolWethBalanceAfter = new BigNumber(await weth.balanceOf(marginPool.address))
      const ownerOtokenBalanceAfter = new BigNumber(await shortCall.balanceOf(buyer))
      const marginPoolOtokenSupplyAfter = new BigNumber(await shortCall.totalSupply())

      const payout = (strikePriceChange * optionsAmount) / expirySpotPrice

      // check balances before and after changed as expected
      assert.equal(
        ownerWethBalanceBefore.plus(createScaledUint256(payout, (await weth.decimals()).toNumber())).toString(),
        ownerWethBalanceAfter.toString(),
      )
      assert.equal(
        marginPoolWethBalanceBefore.minus(createScaledUint256(payout, (await weth.decimals()).toNumber())).toString(),
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
    })
  })
})
