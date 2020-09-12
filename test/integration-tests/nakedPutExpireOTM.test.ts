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

contract('Naked Put Option flow', ([admin, accountOwner1, accountOperator1, buyer]) => {
  const reverter = new Reverter(web3)

  let expiry: number

  let addressBook: AddressBookInstance
  let calculator: MarginCalculatorInstance
  let controllerImplementation: ControllerInstance
  let controllerProxy: ControllerInstance
  let marginPool: MarginPoolInstance
  let whitelist: WhitelistInstance
  let otokenImplementation: OtokenInstance
  let otokenFactory: OtokenFactoryInstance

  // oracle modulce mock
  let oracle: MockOracleInstance

  let usdc: MockERC20Instance
  let dai: MockERC20Instance
  let weth: MockERC20Instance

  let ethPut: OtokenInstance
  const strikePrice = 300

  const optionsAmount = 10
  const collateralAmount = optionsAmount * strikePrice
  let vaultCounter: number

  before('set up contracts', async () => {
    const now = (await time.latest()).toNumber()
    const multiplier = (now - 28800) / 86400
    expiry = (Number(multiplier.toFixed(0)) + 1) * 86400 + time.duration.days(30).toNumber() + 28800

    // setup usdc and weth
    usdc = await MockERC20.new('USDC', 'USDC', 6)
    dai = await MockERC20.new('DAI', 'DAI', 18)
    weth = await MockERC20.new('WETH', 'WETH', 18)

    // initiate addressbook first.
    addressBook = await AddressBook.new()
    // setup calculator
    calculator = await MarginCalculator.new(addressBook.address)
    // setup margin pool
    marginPool = await MarginPool.new(addressBook.address)
    // setup margin account
    const lib = await MarginAccount.new()
    // setup controller module
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
      createScaledUint256(strikePrice, 18),
      expiry,
      true,
    )
    const ethPutAddress = await otokenFactory.getOtoken(
      weth.address,
      usdc.address,
      usdc.address,
      createScaledUint256(strikePrice, 18),
      expiry,
      true,
    )

    ethPut = await Otoken.at(ethPutAddress)

    // mint usdc to user
    usdc.mint(accountOwner1, createScaledUint256(2 * collateralAmount, (await usdc.decimals()).toNumber()))

    // have the user approve all the usdc transfers
    usdc.approve(marginPool.address, '10000000000000000000000', {from: accountOwner1})

    const vaultCounterBefore = new BigNumber(await controllerProxy.getAccountVaultCounter(accountOwner1))
    vaultCounter = vaultCounterBefore.toNumber() + 1
  })

  describe('Integration test: Sell a naked put and close it after expires OTM', () => {
    it('Seller should be able to open a short put option', async () => {
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
          asset: ethPut.address,
          vaultId: vaultCounter,
          amount: createScaledUint256(optionsAmount, 18),
          index: '0',
          data: ZERO_ADDR,
        },
        {
          actionType: ActionType.DepositCollateral,
          owner: accountOwner1,
          sender: accountOwner1,
          asset: usdc.address,
          vaultId: vaultCounter,
          amount: createScaledUint256(collateralAmount, (await usdc.decimals()).toNumber()),
          index: '0',
          data: ZERO_ADDR,
        },
      ]

      await controllerProxy.operate(actionArgs, {from: accountOwner1})

      await reverter.snapshot()
    })

    it('Seller: close an OTM position after expiry', async () => {
      // Keep track of balances before
      const ownerUsdcBalanceBefore = new BigNumber(await usdc.balanceOf(accountOwner1))
      const marginPoolUsdcBalanceBefore = new BigNumber(await usdc.balanceOf(marginPool.address))
      const ownerOtokenBalanceBefore = new BigNumber(await ethPut.balanceOf(accountOwner1))
      const marginPoolOtokenSupplyBefore = new BigNumber(await ethPut.totalSupply())

      // Check that we start at a valid state
      const vaultBefore = await controllerProxy.getVault(accountOwner1, vaultCounter)
      const vaultStateBeforeExpiry = await calculator.getExcessCollateral(vaultBefore)
      assert.equal(vaultStateBeforeExpiry[0].toString(), '0')
      assert.equal(vaultStateBeforeExpiry[1], true)

      // Set the oracle price
      if ((await time.latest()) < expiry) {
        await time.increaseTo(expiry + 2)
      }
      const strikePriceChange = 100
      const expirySpotPrice = strikePrice + strikePriceChange
      await oracle.setExpiryPriceFinalizedAllPeiodOver(
        weth.address,
        expiry,
        createScaledUint256(expirySpotPrice, 18),
        true,
      )
      await oracle.setExpiryPriceFinalizedAllPeiodOver(usdc.address, expiry, createScaledUint256(1, 18), true)

      // Check that after expiry, the vault excess balance has updated as expected
      const vaultStateBeforeSettlement = await calculator.getExcessCollateral(vaultBefore)
      assert.equal(
        vaultStateBeforeSettlement[0].toString(),
        createScaledUint256(collateralAmount, (await usdc.decimals()).toNumber()),
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
      const ownerUsdcBalanceAfter = new BigNumber(await usdc.balanceOf(accountOwner1))
      const marginPoolUsdcBalanceAfter = new BigNumber(await usdc.balanceOf(marginPool.address))

      const ownerOtokenBalanceAfter = new BigNumber(await ethPut.balanceOf(accountOwner1))
      const marginPoolOtokenSupplyAfter = new BigNumber(await ethPut.totalSupply())

      // check balances before and after changed as expected
      assert.equal(
        ownerUsdcBalanceBefore
          .plus(createScaledUint256(collateralAmount, (await usdc.decimals()).toNumber()))
          .toString(),
        ownerUsdcBalanceAfter.toString(),
      )
      assert.equal(
        marginPoolUsdcBalanceBefore
          .minus(createScaledUint256(collateralAmount, (await usdc.decimals()).toNumber()))
          .toString(),
        marginPoolUsdcBalanceAfter.toString(),
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

    it('Buyer: exercise OTM put option after expiry', async () => {
      // owner sells their put option
      ethPut.transfer(buyer, createScaledUint256(optionsAmount, 18), {from: accountOwner1})

      // Keep track of balances before
      const ownerUsdcBalanceBefore = new BigNumber(await usdc.balanceOf(buyer))
      const marginPoolUsdcBalanceBefore = new BigNumber(await usdc.balanceOf(marginPool.address))
      const ownerOtokenBalanceBefore = new BigNumber(await ethPut.balanceOf(buyer))
      const marginPoolOtokenSupplyBefore = new BigNumber(await ethPut.totalSupply())

      const actionArgs = [
        {
          actionType: ActionType.Exercise,
          owner: buyer,
          sender: buyer,
          asset: ethPut.address,
          vaultId: '0',
          amount: createScaledUint256(optionsAmount, 18),
          index: '0',
          data: ZERO_ADDR,
        },
      ]

      await ethPut.approve(marginPool.address, createScaledUint256(optionsAmount, 18), {from: buyer})
      // should not be able to exercise and OTM option since the user wont get anything back
      await controllerProxy.operate(actionArgs, {from: buyer})

      // keep track of balances after
      const ownerUsdcBalanceAfter = new BigNumber(await usdc.balanceOf(buyer))
      const marginPoolUsdcBalanceAfter = new BigNumber(await usdc.balanceOf(marginPool.address))
      const ownerOtokenBalanceAfter = new BigNumber(await ethPut.balanceOf(buyer))
      const marginPoolOtokenSupplyAfter = new BigNumber(await ethPut.totalSupply())

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
})