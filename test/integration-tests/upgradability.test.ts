import {
  MockPricerInstance,
  MockERC20Instance,
  MarginCalculatorInstance,
  AddressBookInstance,
  OracleInstance,
  OtokenInstance,
  ControllerInstance,
  WhitelistInstance,
  MarginPoolInstance,
  OtokenFactoryInstance,
} from '../../build/types/truffle-types'
import {createTokenAmount, getExpiry} from '../utils'
import {assert} from 'chai'
import BigNumber from 'bignumber.js'

const {time, expectRevert} = require('@openzeppelin/test-helpers')
const AddressBook = artifacts.require('AddressBook.sol')
const Oracle = artifacts.require('Oracle.sol')
const Otoken = artifacts.require('Otoken.sol')
const MockERC20 = artifacts.require('MockERC20.sol')
const MarginCalculator = artifacts.require('MarginCalculator.sol')
const Whitelist = artifacts.require('Whitelist.sol')
const MarginPool = artifacts.require('MarginPool.sol')
const Controller = artifacts.require('Controller.sol')
const MarginAccount = artifacts.require('MarginAccount.sol')
const OTokenFactory = artifacts.require('OtokenFactory.sol')
const MockPricer = artifacts.require('MockPricer.sol')
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

contract('Naked Put Option flow', ([accountOwner1]) => {
  let expiry: number
  let lockingPeriod: number
  let disputePeriod: number

  let addressBook: AddressBookInstance
  let calculator: MarginCalculatorInstance
  let controllerImplementation: ControllerInstance
  let controllerProxy: ControllerInstance
  let marginPool: MarginPoolInstance
  let whitelist: WhitelistInstance
  let otokenImplementation: OtokenInstance
  let otokenFactory: OtokenFactoryInstance
  let wethPricer: MockPricerInstance
  let usdcPricer: MockPricerInstance

  // oracle modulce mock
  let oracle: OracleInstance

  let usdc: MockERC20Instance
  let weth: MockERC20Instance

  let ethPut: OtokenInstance
  const strikePrice = 300

  const optionsAmount = 10
  const collateralAmount = optionsAmount * strikePrice
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
    // setup controller module
    await Controller.link('MarginAccount', lib.address)
    controllerImplementation = await Controller.new(addressBook.address)
    // setup mock Oracle module
    oracle = await Oracle.new(addressBook.address)
    // setup whitelist module
    whitelist = await Whitelist.new(addressBook.address)
    await whitelist.whitelistCollateral(usdc.address)
    await whitelist.whitelistProduct(weth.address, usdc.address, usdc.address, true)
    await whitelist.whitelistProduct(weth.address, usdc.address, weth.address, false)
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
      createTokenAmount(strikePrice, 18),
      expiry,
      true,
    )
    const ethPutAddress = await otokenFactory.getOtoken(
      weth.address,
      usdc.address,
      usdc.address,
      createTokenAmount(strikePrice, 18),
      expiry,
      true,
    )

    ethPut = await Otoken.at(ethPutAddress)

    // deply mock pricer (to get live price and set expiry price)
    lockingPeriod = time.duration.minutes(15).toNumber() // 15min
    disputePeriod = time.duration.minutes(15).toNumber() // 15min
    wethPricer = await MockPricer.new(weth.address, oracle.address)
    await oracle.setAssetPricer(weth.address, wethPricer.address)
    await oracle.setLockingPeriod(wethPricer.address, lockingPeriod)
    await oracle.setDisputePeriod(wethPricer.address, disputePeriod)
    usdcPricer = await MockPricer.new(usdc.address, oracle.address)
    await oracle.setAssetPricer(usdc.address, usdcPricer.address)
    await oracle.setLockingPeriod(usdcPricer.address, lockingPeriod)
    await oracle.setDisputePeriod(usdcPricer.address, disputePeriod)

    // mint usdc to user
    const accountOwner1Usdc = createTokenAmount(2 * collateralAmount, (await usdc.decimals()).toNumber())
    usdc.mint(accountOwner1, accountOwner1Usdc)

    // have the user approve all the usdc transfers
    const amountToApprove = new BigNumber(accountOwner1Usdc).times(100).toString()
    usdc.approve(marginPool.address, amountToApprove, {from: accountOwner1})
  })

  describe('Integration Test: Ensure that all the components work together before an upgrade', async () => {
    it('test that a position can be opened and all components work well together', async () => {
      const vaultCounterBefore = new BigNumber(await controllerProxy.getAccountVaultCounter(accountOwner1))
      vaultCounter = vaultCounterBefore.toNumber() + 1

      const scaledOptionsAmount = createTokenAmount(optionsAmount, 18)
      const scaledCollateralAmount = createTokenAmount(collateralAmount, (await usdc.decimals()).toNumber())

      const ownerUsdcBalanceBefore = new BigNumber(await usdc.balanceOf(accountOwner1))

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
      ]

      await controllerProxy.operate(actionArgs, {from: accountOwner1})

      const ownerUsdcBalanceAfter = new BigNumber(await usdc.balanceOf(accountOwner1))
      assert.equal(ownerUsdcBalanceBefore.minus(scaledCollateralAmount).toString(), ownerUsdcBalanceAfter.toString())
    })

    it('test that the position can be closed after expiry', async () => {
      const scaledCollateralAmount = createTokenAmount(collateralAmount, (await usdc.decimals()).toNumber())

      const ownerUsdcBalanceBefore = new BigNumber(await usdc.balanceOf(accountOwner1))
      if ((await time.latest()) < expiry) {
        await time.increaseTo(expiry + lockingPeriod + 10)
      }
      const expirySpotPrice = 400
      const scaledETHPrice = createTokenAmount(expirySpotPrice, 18)
      const scaledUSDCPrice = createTokenAmount(1, 18)
      await wethPricer.setExpiryPriceToOralce(expiry, scaledETHPrice)
      await usdcPricer.setExpiryPriceToOralce(expiry, scaledUSDCPrice)

      await time.increase(disputePeriod + 10)

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

      const ownerUsdcBalanceAfter = new BigNumber(await usdc.balanceOf(accountOwner1))
      assert.equal(ownerUsdcBalanceBefore.plus(scaledCollateralAmount).toString(), ownerUsdcBalanceAfter.toString())
    })
  })

  describe('Integration test: Calculator migratability', async () => {
    let scaledOptionsAmount: string
    let scaledCollateralAmount: string
    let vaultCounter: number

    before('setup the contracts', async () => {
      const vaultCounterBefore = new BigNumber(await controllerProxy.getAccountVaultCounter(accountOwner1))
      vaultCounter = vaultCounterBefore.toNumber() + 1
      scaledOptionsAmount = createTokenAmount(optionsAmount, 18)
      scaledCollateralAmount = createTokenAmount(collateralAmount, (await usdc.decimals()).toNumber())
    })

    it('should migrate to new calculator', async () => {
      const oldCalculatorStoredAddress = await addressBook.getMarginCalculator()
      const oldCalculator = calculator
      assert.equal(
        oldCalculatorStoredAddress,
        oldCalculator.address,
        'wrong margin calculator address stored in the address book',
      )

      calculator = await MarginCalculator.new(addressBook.address)
      addressBook.setMarginCalculator(calculator.address)

      const newCalculatorStoredAddress = await addressBook.getMarginCalculator()
      assert.equal(
        newCalculatorStoredAddress,
        calculator.address,
        'wrong margin calculator address stored in the address book',
      )
      await controllerProxy.refreshConfiguration()
    })

    it('should be able to create new options markets', async () => {
      // Create new option
      expiry = await getExpiry()
      await otokenFactory.createOtoken(
        weth.address,
        usdc.address,
        usdc.address,
        createTokenAmount(strikePrice, 18),
        expiry,
        true,
      )
      const ethPutAddress = await otokenFactory.getOtoken(
        weth.address,
        usdc.address,
        usdc.address,
        createTokenAmount(strikePrice, 18),
        expiry,
        true,
      )

      ethPut = await Otoken.at(ethPutAddress)
    })

    it('should still be able to open a new position using the new calculator', async () => {
      const ownerUsdcBalanceBefore = new BigNumber(await usdc.balanceOf(accountOwner1))

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
      ]

      await controllerProxy.operate(actionArgs, {from: accountOwner1})

      const ownerUsdcBalanceAfter = new BigNumber(await usdc.balanceOf(accountOwner1))
      assert.equal(ownerUsdcBalanceBefore.minus(scaledCollateralAmount).toString(), ownerUsdcBalanceAfter.toString())
    })

    it('should be able to close positions using the new calcuator', async () => {
      const ownerUsdcBalanceBefore = new BigNumber(await usdc.balanceOf(accountOwner1))
      if ((await time.latest()) < expiry) {
        await time.increaseTo(expiry + lockingPeriod + 10)
      }
      const expirySpotPrice = 400
      const scaledETHPrice = createTokenAmount(expirySpotPrice, 18)
      const scaledUSDCPrice = createTokenAmount(1, 18)
      await wethPricer.setExpiryPriceToOralce(expiry, scaledETHPrice)
      await usdcPricer.setExpiryPriceToOralce(expiry, scaledUSDCPrice)

      await time.increase(disputePeriod + 10)

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

      const ownerUsdcBalanceAfter = new BigNumber(await usdc.balanceOf(accountOwner1))
      assert.equal(ownerUsdcBalanceBefore.plus(scaledCollateralAmount).toString(), ownerUsdcBalanceAfter.toString())
    })
  })

  describe('Integration test: Margin Pool migratability', async () => {
    let scaledOptionsAmount: string
    let scaledCollateralAmount: string
    let vaultCounter: number

    before('setup the contracts', async () => {
      const vaultCounterBefore = new BigNumber(await controllerProxy.getAccountVaultCounter(accountOwner1))
      vaultCounter = vaultCounterBefore.toNumber() + 1
      scaledOptionsAmount = createTokenAmount(optionsAmount, 18)
      scaledCollateralAmount = createTokenAmount(collateralAmount, (await usdc.decimals()).toNumber())
    })

    it('should migrate to new margin pool', async () => {
      const oldMarginPoolStoredAddress = await addressBook.getMarginPool()
      const oldMarginPool = marginPool
      assert.equal(
        oldMarginPoolStoredAddress,
        oldMarginPool.address,
        'wrong margin pool address stored in the address book',
      )

      marginPool = await MarginPool.new(addressBook.address)
      addressBook.setMarginPool(marginPool.address)

      const newMarginPoolStoredAddress = await addressBook.getMarginPool()
      assert.equal(
        newMarginPoolStoredAddress,
        marginPool.address,
        'wrong margin pool address update made to the address book',
      )
      await controllerProxy.refreshConfiguration()
    })

    it('should be able to create new options markets', async () => {
      // Create new option
      expiry = await getExpiry()
      await otokenFactory.createOtoken(
        weth.address,
        usdc.address,
        usdc.address,
        createTokenAmount(strikePrice, 18),
        expiry,
        true,
      )
      const ethPutAddress = await otokenFactory.getOtoken(
        weth.address,
        usdc.address,
        usdc.address,
        createTokenAmount(strikePrice, 18),
        expiry,
        true,
      )

      ethPut = await Otoken.at(ethPutAddress)
    })

    it('should still be able to open a new position using the new margin pool', async () => {
      const ownerUsdcBalanceBefore = new BigNumber(await usdc.balanceOf(accountOwner1))
      const marginPoolUsdcBalanceBefore = new BigNumber(await usdc.balanceOf(marginPool.address))

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
      ]
      await usdc.approve(marginPool.address, scaledCollateralAmount, {from: accountOwner1})
      await controllerProxy.operate(actionArgs, {from: accountOwner1})

      const ownerUsdcBalanceAfter = new BigNumber(await usdc.balanceOf(accountOwner1))
      const marginPoolUsdcBalanceAfter = new BigNumber(await usdc.balanceOf(marginPool.address))
      assert.equal(ownerUsdcBalanceBefore.minus(scaledCollateralAmount).toString(), ownerUsdcBalanceAfter.toString())
      assert.equal(
        marginPoolUsdcBalanceBefore.plus(scaledCollateralAmount).toString(),
        marginPoolUsdcBalanceAfter.toString(),
      )
    })

    it('should be able to close positions using the new margin pool', async () => {
      const ownerUsdcBalanceBefore = new BigNumber(await usdc.balanceOf(accountOwner1))
      const marginPoolUsdcBalanceBefore = new BigNumber(await usdc.balanceOf(marginPool.address))

      if ((await time.latest()) < expiry) {
        await time.increaseTo(expiry + lockingPeriod + 10)
      }
      const expirySpotPrice = 400
      const scaledETHPrice = createTokenAmount(expirySpotPrice, 18)
      const scaledUSDCPrice = createTokenAmount(1, 18)
      await wethPricer.setExpiryPriceToOralce(expiry, scaledETHPrice)
      await usdcPricer.setExpiryPriceToOralce(expiry, scaledUSDCPrice)

      await time.increase(disputePeriod + 10)

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

      const ownerUsdcBalanceAfter = new BigNumber(await usdc.balanceOf(accountOwner1))
      const marginPoolUsdcBalanceAfter = new BigNumber(await usdc.balanceOf(marginPool.address))
      assert.equal(ownerUsdcBalanceBefore.plus(scaledCollateralAmount).toString(), ownerUsdcBalanceAfter.toString())
      assert.equal(
        marginPoolUsdcBalanceBefore.minus(scaledCollateralAmount).toString(),
        marginPoolUsdcBalanceAfter.toString(),
      )
    })
  })

  describe('Integration test: Whitelist Module migratability', async () => {
    let scaledOptionsAmount: string
    let scaledCollateralAmount: string
    let vaultCounter: number

    before('setup the contracts', async () => {
      const vaultCounterBefore = new BigNumber(await controllerProxy.getAccountVaultCounter(accountOwner1))
      vaultCounter = vaultCounterBefore.toNumber() + 1
      scaledOptionsAmount = createTokenAmount(optionsAmount, 18)
      scaledCollateralAmount = createTokenAmount(collateralAmount, (await usdc.decimals()).toNumber())
    })

    it('should migrate to new whitelist module', async () => {
      const oldWhitelistStoredAddress = await addressBook.getWhitelist()
      const oldWhitelist = whitelist
      assert.equal(
        oldWhitelistStoredAddress,
        oldWhitelist.address,
        'wrong whitelist module address stored in the address book',
      )

      whitelist = await Whitelist.new(addressBook.address)
      addressBook.setWhitelist(whitelist.address)

      const newWhitelistStoredAddress = await addressBook.getWhitelist()
      assert.equal(
        newWhitelistStoredAddress,
        whitelist.address,
        'wrong whitelist module address update made to the address book',
      )
      await controllerProxy.refreshConfiguration()
    })

    it('should not be able to create new options markets until whitelist module has whitelisted the product', async () => {
      // Create new option
      expiry = await getExpiry()
      await expectRevert(
        otokenFactory.createOtoken(
          weth.address,
          usdc.address,
          usdc.address,
          createTokenAmount(strikePrice, 18),
          expiry,
          true,
        ),
        'OtokenFactory: Unsupported Product',
      )
    })

    it('should be able to create new options markets', async () => {
      await whitelist.whitelistCollateral(usdc.address)
      await whitelist.whitelistProduct(weth.address, usdc.address, usdc.address, true)
      await whitelist.whitelistProduct(weth.address, usdc.address, weth.address, false)

      // Create new option
      expiry = await getExpiry()
      await otokenFactory.createOtoken(
        weth.address,
        usdc.address,
        usdc.address,
        createTokenAmount(strikePrice, 18),
        expiry,
        true,
      )
      const ethPutAddress = await otokenFactory.getOtoken(
        weth.address,
        usdc.address,
        usdc.address,
        createTokenAmount(strikePrice, 18),
        expiry,
        true,
      )

      ethPut = await Otoken.at(ethPutAddress)
    })

    it('should still be able to open a new position using the new whitelist module', async () => {
      const ownerUsdcBalanceBefore = new BigNumber(await usdc.balanceOf(accountOwner1))

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
      ]
      await usdc.approve(marginPool.address, scaledCollateralAmount, {from: accountOwner1})
      await controllerProxy.operate(actionArgs, {from: accountOwner1})

      const ownerUsdcBalanceAfter = new BigNumber(await usdc.balanceOf(accountOwner1))
      assert.equal(ownerUsdcBalanceBefore.minus(scaledCollateralAmount).toString(), ownerUsdcBalanceAfter.toString())
    })

    it('should be able to close positions using the new whitelist module', async () => {
      const ownerUsdcBalanceBefore = new BigNumber(await usdc.balanceOf(accountOwner1))

      if ((await time.latest()) < expiry) {
        await time.increaseTo(expiry + lockingPeriod + 10)
      }
      const expirySpotPrice = 400
      const scaledETHPrice = createTokenAmount(expirySpotPrice, 18)
      const scaledUSDCPrice = createTokenAmount(1, 18)
      await wethPricer.setExpiryPriceToOralce(expiry, scaledETHPrice)
      await usdcPricer.setExpiryPriceToOralce(expiry, scaledUSDCPrice)

      await time.increase(disputePeriod + 10)

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

      const ownerUsdcBalanceAfter = new BigNumber(await usdc.balanceOf(accountOwner1))
      assert.equal(ownerUsdcBalanceBefore.plus(scaledCollateralAmount).toString(), ownerUsdcBalanceAfter.toString())
    })
  })

  describe('Integration test: Factory Module migratability', async () => {
    let scaledOptionsAmount: string
    let scaledCollateralAmount: string
    let vaultCounter: number

    before('setup the contracts', async () => {
      const vaultCounterBefore = new BigNumber(await controllerProxy.getAccountVaultCounter(accountOwner1))
      vaultCounter = vaultCounterBefore.toNumber() + 1
      scaledOptionsAmount = createTokenAmount(optionsAmount, 18)
      scaledCollateralAmount = createTokenAmount(collateralAmount, (await usdc.decimals()).toNumber())
    })

    it('should migrate to new otokenFactory module', async () => {
      const oldOtokenFactoryStoredAddress = await addressBook.getOtokenFactory()
      const oldOtokenFactory = otokenFactory
      assert.equal(
        oldOtokenFactoryStoredAddress,
        oldOtokenFactory.address,
        'wrong otokenFactory module address stored in the address book',
      )

      otokenFactory = await OTokenFactory.new(addressBook.address)
      addressBook.setOtokenFactory(otokenFactory.address)

      const newOtokenFactoryStoredAddress = await addressBook.getOtokenFactory()
      assert.equal(
        newOtokenFactoryStoredAddress,
        otokenFactory.address,
        'wrong otokenFactory module address update made to the address book',
      )
      await controllerProxy.refreshConfiguration()
    })

    it('should be able to create new options markets', async () => {
      // Create new option
      expiry = await getExpiry()
      await otokenFactory.createOtoken(
        weth.address,
        usdc.address,
        usdc.address,
        createTokenAmount(strikePrice, 18),
        expiry,
        true,
      )
      const ethPutAddress = await otokenFactory.getOtoken(
        weth.address,
        usdc.address,
        usdc.address,
        createTokenAmount(strikePrice, 18),
        expiry,
        true,
      )

      ethPut = await Otoken.at(ethPutAddress)
    })

    it('should still be able to open a new position using the new otokenFactory module', async () => {
      const ownerUsdcBalanceBefore = new BigNumber(await usdc.balanceOf(accountOwner1))

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
      ]
      await usdc.approve(marginPool.address, scaledCollateralAmount, {from: accountOwner1})
      await controllerProxy.operate(actionArgs, {from: accountOwner1})

      const ownerUsdcBalanceAfter = new BigNumber(await usdc.balanceOf(accountOwner1))
      assert.equal(ownerUsdcBalanceBefore.minus(scaledCollateralAmount).toString(), ownerUsdcBalanceAfter.toString())
    })

    it('should be able to close positions using the new otokenFactory module', async () => {
      const ownerUsdcBalanceBefore = new BigNumber(await usdc.balanceOf(accountOwner1))

      if ((await time.latest()) < expiry) {
        await time.increaseTo(expiry + lockingPeriod + 10)
      }
      const expirySpotPrice = 400
      const scaledETHPrice = createTokenAmount(expirySpotPrice, 18)
      const scaledUSDCPrice = createTokenAmount(1, 18)
      await wethPricer.setExpiryPriceToOralce(expiry, scaledETHPrice)
      await usdcPricer.setExpiryPriceToOralce(expiry, scaledUSDCPrice)

      await time.increase(disputePeriod + 10)

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

      const ownerUsdcBalanceAfter = new BigNumber(await usdc.balanceOf(accountOwner1))
      assert.equal(ownerUsdcBalanceBefore.plus(scaledCollateralAmount).toString(), ownerUsdcBalanceAfter.toString())
    })
  })
})
