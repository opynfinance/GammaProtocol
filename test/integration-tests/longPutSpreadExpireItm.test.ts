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
import {createVault, createScaledUint256} from '../utils'
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

contract('Long Put Spread Option flow', ([admin, accountOwner1, accountOperator1, buyer, accountOwner2]) => {
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
  let dai: MockERC20Instance
  let weth: MockERC20Instance

  let shortPut: OtokenInstance
  let longPut: OtokenInstance
  const shortStrike = 200
  const longStrike = 300

  const optionsAmount = 10
  const collateralAmount = Math.abs(shortStrike - longStrike) * optionsAmount

  let vaultCounter: number

  before('set up contracts', async () => {
    const now = (await time.latest()).toNumber()
    const multiplier = (now - 28800) / 86400
    expiry = (Number(multiplier.toFixed(0)) + 1) * 86400 + time.duration.days(30).toNumber() + 28800

    // setup usdc and weth
    // TODO: make usdc 6 decimals
    usdc = await MockERC20.new('USDC', 'USDC', 18)
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
      createScaledUint256(longStrike, 18),
      expiry,
      true,
    )

    await otokenFactory.createOtoken(
      weth.address,
      usdc.address,
      usdc.address,
      createScaledUint256(shortStrike, 18),
      expiry,
      true,
    )

    const longPutAddress = await otokenFactory.getOtoken(
      weth.address,
      usdc.address,
      usdc.address,
      createScaledUint256(longStrike, 18),
      expiry,
      true,
    )

    longPut = await Otoken.at(longPutAddress)

    const shortPutAddress = await otokenFactory.getOtoken(
      weth.address,
      usdc.address,
      usdc.address,
      createScaledUint256(shortStrike, 18),
      expiry,
      true,
    )

    shortPut = await Otoken.at(shortPutAddress)

    // mint usdc to user
    usdc.mint(accountOwner1, createScaledUint256(2 * collateralAmount, (await usdc.decimals()).toNumber()))
    usdc.mint(accountOwner2, createScaledUint256(longStrike * optionsAmount, (await usdc.decimals()).toNumber()))
    usdc.mint(buyer, createScaledUint256(longStrike * optionsAmount, (await usdc.decimals()).toNumber()))

    // have the user approve all the usdc transfers
    usdc.approve(marginPool.address, '10000000000000000000000', {from: accountOwner1})
    usdc.approve(marginPool.address, '10000000000000000000000000000000000000000', {from: accountOwner2})
    usdc.approve(marginPool.address, '10000000000000000000000000000', {from: buyer})

    const vaultCounterBefore = new BigNumber(await controllerProxy.getAccountVaultCounter(accountOwner1))
    vaultCounter = vaultCounterBefore.toNumber() + 1
  })

  describe('Integration test: Sell a long put spread and close it after expires ITM', () => {
    it('Someone else mints the long option and sends it to the seller', async () => {
      const collateralToMintLong = longStrike * optionsAmount

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
          asset: longPut.address,
          vaultId: vaultCounter,
          amount: createScaledUint256(optionsAmount, 18),
          index: '0',
          data: ZERO_ADDR,
        },
        {
          actionType: ActionType.DepositCollateral,
          owner: accountOwner2,
          sender: accountOwner2,
          asset: usdc.address,
          vaultId: vaultCounter,
          amount: createScaledUint256(collateralToMintLong, (await usdc.decimals()).toNumber()),
          index: '0',
          data: ZERO_ADDR,
        },
      ]

      await controllerProxy.operate(actionArgsBuyer, {from: accountOwner2})

      // buyer sells their long put option to owner
      longPut.transfer(accountOwner1, createScaledUint256(optionsAmount, 18), {from: accountOwner2})

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
          asset: shortPut.address,
          vaultId: vaultCounter,
          amount: createScaledUint256(optionsAmount, 18),
          index: '0',
          data: ZERO_ADDR,
        },
        {
          actionType: ActionType.DepositLongOption,
          owner: accountOwner1,
          sender: accountOwner1,
          asset: longPut.address,
          vaultId: vaultCounter,
          amount: createScaledUint256(optionsAmount, 18),
          index: '0',
          data: ZERO_ADDR,
        },
      ]

      await longPut.approve(marginPool.address, '1000000000000000000000', {from: accountOwner1})
      await controllerProxy.operate(actionArgsSeller, {from: accountOwner1})
    })

    it('Seller: close an ITM position after expiry', async () => {
      // Keep track of balances before
      const ownerUsdcBalanceBefore = new BigNumber(await usdc.balanceOf(accountOwner1))
      const marginPoolUsdcBalanceBefore = new BigNumber(await usdc.balanceOf(marginPool.address))
      const ownerOtokenBalanceBefore = new BigNumber(await shortPut.balanceOf(accountOwner1))
      const marginPoolOtokenSupplyBefore = new BigNumber(await shortPut.totalSupply())

      // Check that we start at a valid state
      let vaultBefore = await controllerProxy.getVault(accountOwner1, vaultCounter)
      const vaultStateBefore = await calculator.getExcessCollateral(vaultBefore)
      assert.equal(vaultStateBefore[0].toString(), '0')
      assert.equal(vaultStateBefore[1], true)

      // Set the oracle price
      if ((await time.latest()) < expiry) {
        await time.increaseTo(expiry + 2)
      }
      const expirySpotPrice = 150
      await oracle.setExpiryPriceFinalizedAllPeiodOver(
        weth.address,
        expiry,
        createScaledUint256(expirySpotPrice, 18),
        true,
      )
      await oracle.setExpiryPriceFinalizedAllPeiodOver(usdc.address, expiry, createScaledUint256(1, 18), true)

      const collateralPayout = Math.min(
        (longStrike - shortStrike) * optionsAmount,
        (longStrike - expirySpotPrice) * optionsAmount,
      )

      // Check that after expiry, the vault excess balance has updated as expected
      vaultBefore = await controllerProxy.getVault(accountOwner1, vaultCounter)
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
      const ownerUsdcBalanceAfter = new BigNumber(await usdc.balanceOf(accountOwner1))
      const marginPoolUsdcBalanceAfter = new BigNumber(await usdc.balanceOf(marginPool.address))

      const ownerOtokenBalanceAfter = new BigNumber(await shortPut.balanceOf(accountOwner1))
      const marginPoolOtokenSupplyAfter = new BigNumber(await shortPut.totalSupply())

      // check balances before and after changed as expected
      assert.equal(
        ownerUsdcBalanceBefore
          .plus(createScaledUint256(collateralPayout, (await usdc.decimals()).toNumber()))
          .toString(),
        ownerUsdcBalanceAfter.toString(),
      )
      assert.equal(
        marginPoolUsdcBalanceBefore
          .minus(createScaledUint256(collateralPayout, (await usdc.decimals()).toNumber()))
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

    it('Buyer: exercise ITM put option after expiry', async () => {
      // owner sells their put option
      shortPut.transfer(buyer, createScaledUint256(optionsAmount, 18), {from: accountOwner1})
      // oracle orice decreases
      const expirySpotPrice = 150
      const strikePriceChange = Math.max(shortStrike - expirySpotPrice, 0)

      // Keep track of balances before
      const ownerUsdcBalanceBefore = new BigNumber(await usdc.balanceOf(buyer))
      const marginPoolUsdcBalanceBefore = new BigNumber(await usdc.balanceOf(marginPool.address))
      const ownerOtokenBalanceBefore = new BigNumber(await shortPut.balanceOf(buyer))
      const marginPoolOtokenSupplyBefore = new BigNumber(await shortPut.totalSupply())

      const actionArgs = [
        {
          actionType: ActionType.Exercise,
          owner: buyer,
          sender: buyer,
          asset: shortPut.address,
          vaultId: '0',
          amount: createScaledUint256(optionsAmount, 18),
          index: '0',
          data: ZERO_ADDR,
        },
      ]

      await shortPut.approve(marginPool.address, createScaledUint256(optionsAmount, 18), {from: buyer})
      await controllerProxy.operate(actionArgs, {from: buyer})

      // keep track of balances after
      const ownerUsdcBalanceAfter = new BigNumber(await usdc.balanceOf(buyer))
      const marginPoolUsdcBalanceAfter = new BigNumber(await usdc.balanceOf(marginPool.address))
      const ownerOtokenBalanceAfter = new BigNumber(await shortPut.balanceOf(buyer))
      const marginPoolOtokenSupplyAfter = new BigNumber(await shortPut.totalSupply())

      const payout = strikePriceChange * optionsAmount

      // check balances before and after changed as expected
      assert.equal(
        ownerUsdcBalanceBefore.plus(createScaledUint256(payout, (await usdc.decimals()).toNumber())).toString(),
        ownerUsdcBalanceAfter.toString(),
      )
      assert.equal(
        marginPoolUsdcBalanceBefore.minus(createScaledUint256(payout, (await usdc.decimals()).toNumber())).toString(),
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
