import {
  WETH9Instance,
  MockOtokenInstance,
  MockERC20Instance,
  ControllerInstance,
  CompoundPricerInstance,
  AddressBookInstance,
  MarginCalculatorInstance,
  MarginPoolInstance,
  WhitelistInstance,
  OtokenInstance,
  OtokenFactoryInstance,
  CETHProxyInstance,
  CERC20ProxyInstance,
  PayableCERC20Instance,
  MockOracleInstance,
  ChainLinkPricerInstance,
  MockChainlinkAggregatorInstance,
  MockCETHInstance,
  MockCUSDCInstance,
  OwnedUpgradeabilityProxyInstance,
} from '../../build/types/truffle-types'

import BigNumber from 'bignumber.js'
import {createTokenAmount, createValidExpiry, createScaledNumber} from '../utils'
const {expectRevert, time} = require('@openzeppelin/test-helpers')

const WETH9 = artifacts.require('WETH9.sol')
const ERC20 = artifacts.require('MockERC20')
const Controller = artifacts.require('Controller.sol')
const CETHProxy = artifacts.require('CETHProxy')
const CERC20Proxy = artifacts.require('CERC20Proxy')
const MockOtoken = artifacts.require('MockOtoken')
const PayableCERC20 = artifacts.require('PayableCERC20')
const AddressBook = artifacts.require('AddressBook.sol')
const MockOracle = artifacts.require('MockOracle.sol')
const Oracle = artifacts.require('Oracle.sol')
const Otoken = artifacts.require('Otoken.sol')
const MarginCalculator = artifacts.require('MarginCalculator.sol')
const Whitelist = artifacts.require('Whitelist.sol')
const MarginPool = artifacts.require('MarginPool.sol')
const MarginVault = artifacts.require('MarginVault.sol')
const OTokenFactory = artifacts.require('OtokenFactory.sol')
const CompoundPricer = artifacts.require('CompoundPricer.sol')
const MockChainlinkAggregator = artifacts.require('MockChainlinkAggregator.sol')
const ChainlinkPricer = artifacts.require('ChainLinkPricer.sol')
const MockCETH = artifacts.require('MockCETH.sol')
const MockCUSDC = artifacts.require('MockCUSDC.sol')
const ZERO_ADDR = '0x0000000000000000000000000000000000000000'
const OwnedUpgradeabilityProxy = artifacts.require('OwnedUpgradeabilityProxy.sol')

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

contract('CToken Proxy test', async ([user, random, holder1, factoryMock]) => {
  let usdc: MockERC20Instance
  let weth: WETH9Instance
  let cusdc: MockCUSDCInstance
  let ceth: MockCETHInstance

  let cethProxyOperator: CETHProxyInstance
  let payableCerc20ProxyOperator: PayableCERC20Instance

  let addressBook: AddressBookInstance
  let calculator: MarginCalculatorInstance
  let controllerProxy: ControllerInstance
  let controllerImplementation: ControllerInstance
  let marginPool: MarginPoolInstance
  let whitelist: WhitelistInstance
  let otokenImplementation: OtokenInstance
  let otokenFactory: OtokenFactoryInstance
  //  let oracle: OracleInstance
  let oracle: MockOracleInstance
  let expiry: number

  let ethCethCall: OtokenInstance
  let ethCusdcPut: OtokenInstance

  let wethPricer: ChainLinkPricerInstance
  let cusdcPricer: CompoundPricerInstance
  let cethPricer: CompoundPricerInstance

  let wethAggregator: MockChainlinkAggregatorInstance

  let vaultCounter: number
  let cusdcCollateralAmount: BigNumber
  let cethCollateralAmount: BigNumber

  before('setup contracts', async () => {
    const now = (await time.latest()).toNumber()
    expiry = createValidExpiry(now, 300) // 300 days from now

    weth = await WETH9.new()
    usdc = await ERC20.new('USDC', 'USDC', 6)
    ceth = await MockCETH.new('cETH', 'cETH')
    cusdc = await MockCUSDC.new('cUSDC', 'cUSDC', usdc.address, createTokenAmount(1, 16))

    // initiate addressbook first.
    addressBook = await AddressBook.new()
    calculator = await MarginCalculator.new(addressBook.address)
    marginPool = await MarginPool.new(addressBook.address)
    const lib = await MarginVault.new()
    await Controller.link('MarginVault', lib.address)
    controllerImplementation = await Controller.new(addressBook.address)

    //oracle = await Oracle.new(addressBook.address)
    oracle = await MockOracle.new()

    await oracle.setRealTimePrice(usdc.address, createTokenAmount(1, 8))

    // wethAggregator = await MockChainlinkAggregator.new()

    // wethPricer = await ChainlinkPricer.new(user, weth.address, wethAggregator.address, oracle.address)
    // await oracle.setAssetPricer(weth.address, wethPricer.address)
    // cusdcPricer = await CompoundPricer.new(cusdc.address, usdc.address, oracle.address)
    // await oracle.setAssetPricer(cusdc.address, cusdcPricer.address)
    // cethPricer = await CompoundPricer.new(ceth.address, weth.address, oracle.address)
    // await oracle.setAssetPricer(ceth.address, cethPricer.address)

    // const lockingPeriod = time.duration.minutes(15).toNumber()
    // const disputePeriod = time.duration.minutes(15).toNumber()

    // await oracle.setLockingPeriod(wethPricer.address, lockingPeriod)
    // await oracle.setDisputePeriod(wethPricer.address, disputePeriod)
    // //await oracle.setLockingPeriod(usdcPricer.address, lockingPeriod)
    // //await oracle.setDisputePeriod(usdcPricer.address, disputePeriod)
    // await oracle.setLockingPeriod(cethPricer.address, lockingPeriod)
    // await oracle.setDisputePeriod(cethPricer.address, disputePeriod)
    // await oracle.setLockingPeriod(cusdcPricer.address, lockingPeriod)
    // await oracle.setDisputePeriod(cusdcPricer.address, disputePeriod)

    whitelist = await Whitelist.new(addressBook.address)

    await whitelist.whitelistCollateral(cusdc.address)
    await whitelist.whitelistCollateral(ceth.address)

    // whitelist eth-usdc-ceth calls and eth-usdc-cusdc puts
    whitelist.whitelistProduct(weth.address, usdc.address, ceth.address, false)
    whitelist.whitelistProduct(weth.address, usdc.address, cusdc.address, true)
    // setup otoken
    otokenImplementation = await Otoken.new()
    otokenFactory = await OTokenFactory.new(addressBook.address)

    await addressBook.setOracle(oracle.address)
    await addressBook.setMarginCalculator(calculator.address)
    await addressBook.setWhitelist(whitelist.address)
    await addressBook.setMarginPool(marginPool.address)
    await addressBook.setOtokenFactory(otokenFactory.address)
    await addressBook.setOtokenImpl(otokenImplementation.address)
    await addressBook.setController(controllerImplementation.address)

    const controllerProxyAddress = await addressBook.getController()
    controllerProxy = await Controller.at(controllerProxyAddress)
    const proxy: OwnedUpgradeabilityProxyInstance = await OwnedUpgradeabilityProxy.at(controllerProxyAddress)

    // deploy proxy
    payableCerc20ProxyOperator = await PayableCERC20.new(
      controllerProxyAddress,
      marginPool.address,
      cusdc.address,
      weth.address,
    )
    cethProxyOperator = await CETHProxy.new(controllerProxyAddress, marginPool.address, ceth.address)

    //deploy ceth collateral option
    await otokenFactory.createOtoken(weth.address, usdc.address, ceth.address, createTokenAmount(300), expiry, false)
    const cethCallAddr = await otokenFactory.getOtoken(
      weth.address,
      usdc.address,
      ceth.address,
      createTokenAmount(300),
      expiry,
      false,
    )
    ethCethCall = await Otoken.at(cethCallAddr)

    // deploy cusdc collateral option
    await otokenFactory.createOtoken(weth.address, usdc.address, cusdc.address, createTokenAmount(300), expiry, true)
    const cusdcPutAddr = await otokenFactory.getOtoken(
      weth.address,
      usdc.address,
      cusdc.address,
      createTokenAmount(300),
      expiry,
      true,
    )
    ethCusdcPut = await Otoken.at(cusdcPutAddr)

    //mint usdc and weth for user
    await usdc.mint(user, createTokenAmount(1000000, 6))
    // await weth.mint(user, createTokenAmount(1000000, 6))
    await usdc.mint(random, createTokenAmount(1000000, 6))
    // await weth.mint(random, createTokenAmount(1000000, 6))

    //set proxy as operator
    await controllerProxy.setOperator(payableCerc20ProxyOperator.address, true, {from: user})
    await controllerProxy.setOperator(cethProxyOperator.address, true, {from: user})
  })

  describe('Operate actions via proxy', () => {
    it('mint 100 ethusdc-cusdc 300 strike put option by depositing 30000 USDC which is wrapped to cUSDC', async () => {
      // determine initial fx rates for assets
      const cusdcPrice = 0.02
      const cethPrice = 0.03
      const scaledCusdcPrice = createTokenAmount(cusdcPrice, 16) // 1 cToken = 0.02 USD
      const scaledCethPrice = createTokenAmount(cethPrice, 28) // 1 cToken = 0.05 USD
      const usdPrice = createTokenAmount(1, 8)
      const ethPrice = createTokenAmount(300, 8)

      //set initial prices for eth, cusdc, ceth
      await oracle.setRealTimePrice(weth.address, ethPrice)
      await oracle.setStablePrice(usdc.address, usdPrice)
      await cusdc.setExchangeRate(scaledCusdcPrice)
      await ceth.setExchangeRate(scaledCethPrice)
      await oracle.setRealTimePrice(cusdc.address, createTokenAmount(cusdcPrice, 8))

      const strike = 300
      const amount = 100

      const optionCollateralValue = strike * amount
      const oTokenAmount = createTokenAmount(amount)
      const underlyingAssetDeposit = createTokenAmount(optionCollateralValue, 6)

      const vaultCounterBefore = new BigNumber(await controllerProxy.getAccountVaultCounter(user))
      vaultCounter = vaultCounterBefore.plus(1).toNumber()

      cusdcCollateralAmount = new BigNumber(optionCollateralValue).div(cusdcPrice)
      const scaledCusdcCollateralAmount = createTokenAmount(cusdcCollateralAmount.toNumber())

      //user
      const userOptionBalanceBefore = new BigNumber(await ethCusdcPut.balanceOf(user))
      const userCusdcBalanceBefore = new BigNumber(await cusdc.balanceOf(user))
      const userUsdcBalanceBefore = new BigNumber(await usdc.balanceOf(user))
      //margin pool
      const marginPoolUsdcBalanceBefore = new BigNumber(await usdc.balanceOf(marginPool.address))
      const marginPoolCusdcBalanceBefore = new BigNumber(await cusdc.balanceOf(marginPool.address))
      //proxy
      const proxyUsdcBalanceBefore = new BigNumber(await usdc.balanceOf(payableCerc20ProxyOperator.address))
      const proxyCusdcBalanceBefore = new BigNumber(await cusdc.balanceOf(payableCerc20ProxyOperator.address))

      await usdc.approve(payableCerc20ProxyOperator.address, underlyingAssetDeposit, {from: user})

      const actionArgsUser = [
        {
          actionType: ActionType.OpenVault,
          owner: user,
          secondAddress: user,
          asset: ZERO_ADDR,
          vaultId: vaultCounter,
          amount: '0',
          index: '0',
          data: ZERO_ADDR,
        },
        {
          actionType: ActionType.MintShortOption,
          owner: user,
          secondAddress: user,
          asset: ethCusdcPut.address,
          vaultId: vaultCounter,
          amount: oTokenAmount,
          index: '0',
          data: ZERO_ADDR,
        },
        {
          actionType: ActionType.DepositCollateral,
          owner: user,
          secondAddress: payableCerc20ProxyOperator.address,
          asset: cusdc.address,
          vaultId: vaultCounter,
          amount: 0,
          index: '0',
          data: ZERO_ADDR,
        },
      ]

      await payableCerc20ProxyOperator.operate(actionArgsUser, user, underlyingAssetDeposit, {
        from: user,
      })

      //user
      const userOptionBalanceAfter = new BigNumber(await ethCusdcPut.balanceOf(user))
      const userCusdcBalanceAfter = new BigNumber(await cusdc.balanceOf(user))
      const userUsdcBalanceAfter = new BigNumber(await usdc.balanceOf(user))
      //margin pool
      const marginPoolCusdcBalanceAfter = new BigNumber(await cusdc.balanceOf(marginPool.address))
      const marginPoolUsdcBalanceAfter = new BigNumber(await usdc.balanceOf(marginPool.address))
      //proxy
      const proxyCusdcBalanceAfter = new BigNumber(await cusdc.balanceOf(payableCerc20ProxyOperator.address))
      const proxyUsdcBalanceAfter = new BigNumber(await usdc.balanceOf(payableCerc20ProxyOperator.address))

      //user
      assert.equal(
        userOptionBalanceBefore.plus(oTokenAmount).toString(),
        userOptionBalanceAfter.toString(),
        'User oToken balance is incorrect',
      )
      assert.equal(
        userCusdcBalanceBefore.toString(),
        userCusdcBalanceAfter.toString(),
        'User cUSDC balance is incorrect',
      )
      assert.equal(
        userUsdcBalanceBefore.minus(underlyingAssetDeposit).toString(),
        userUsdcBalanceAfter.toString(),
        'User USDC balance is incorrect',
      )

      //margin pool
      assert.equal(
        marginPoolCusdcBalanceBefore.plus(scaledCusdcCollateralAmount).toString(),
        marginPoolCusdcBalanceAfter.toString(),
        'Margin Pool cUSDC balance is incorrect',
      )
      assert.equal(
        marginPoolUsdcBalanceBefore.toString(),
        marginPoolUsdcBalanceAfter.toString(),
        'Margin Pool USDC balance is incorrect',
      )
      //proxy
      assert.equal(
        proxyCusdcBalanceBefore.toString(),
        proxyCusdcBalanceAfter.toString(),
        'Proxy cUSDC balance is incorrect',
      )
      assert.equal(
        proxyUsdcBalanceBefore.toString(),
        proxyUsdcBalanceAfter.toString(),
        'Proxy USDC balance is incorrect',
      )
    })

    it('mint as before but burn and withdraw collateral by unwrapping', async () => {
      // determine initial fx rates for assets
      const cusdcPrice = 0.02
      const cethPrice = 0.03
      const scaledCusdcPrice = createTokenAmount(cusdcPrice, 16) // 1 cToken = 0.02 USD
      const scaledCethPrice = createTokenAmount(cethPrice, 28) // 1 cToken = 0.05 USD
      const usdPrice = createTokenAmount(1, 8)
      const ethPrice = createTokenAmount(300, 8)

      //set initial prices for eth, cusdc, ceth
      // await wethAggregator.setLatestAnswer(ethPrice)
      await oracle.setRealTimePrice(weth.address, ethPrice)
      await cusdc.setExchangeRate(scaledCusdcPrice)
      await ceth.setExchangeRate(scaledCethPrice)

      const strike = 300
      const amount = 100

      const optionCollateralValue = strike * amount
      const oTokenAmount = createTokenAmount(amount)
      const underlyingAssetDeposit = createTokenAmount(optionCollateralValue, 6)

      const vaultCounterBefore = new BigNumber(await controllerProxy.getAccountVaultCounter(user))
      vaultCounter = vaultCounterBefore.toNumber() //use the same vault

      cusdcCollateralAmount = new BigNumber(optionCollateralValue).div(cusdcPrice)
      const scaledCusdcCollateralAmount = createTokenAmount(cusdcCollateralAmount.toNumber())

      const userOptionBalanceBefore2 = new BigNumber(await ethCusdcPut.balanceOf(user))
      const userCusdcBalanceBefore2 = new BigNumber(await cusdc.balanceOf(user))
      const userUsdcBalanceBefore2 = new BigNumber(await usdc.balanceOf(user))
      //margin pool
      const marginPoolUsdcBalanceBefore2 = new BigNumber(await usdc.balanceOf(marginPool.address))
      const marginPoolCusdcBalanceBefore2 = new BigNumber(await cusdc.balanceOf(marginPool.address))
      //proxy
      const proxyUsdcBalanceBefore2 = new BigNumber(await usdc.balanceOf(payableCerc20ProxyOperator.address))
      const proxyCusdcBalanceBefore2 = new BigNumber(await cusdc.balanceOf(payableCerc20ProxyOperator.address))

      const actionArgsUser2 = [
        {
          actionType: ActionType.BurnShortOption,
          owner: user,
          secondAddress: user,
          asset: ethCusdcPut.address,
          vaultId: vaultCounter,
          amount: oTokenAmount,
          index: '0',
          data: ZERO_ADDR,
        },
        {
          actionType: ActionType.WithdrawCollateral,
          owner: user,
          secondAddress: payableCerc20ProxyOperator.address,
          asset: cusdc.address,
          vaultId: vaultCounter,
          amount: scaledCusdcCollateralAmount,
          index: '0',
          data: ZERO_ADDR,
        },
      ]

      await payableCerc20ProxyOperator.operate(actionArgsUser2, user, 0, {
        from: user,
      })

      //user
      const userOptionBalanceAfter2 = new BigNumber(await ethCusdcPut.balanceOf(user))
      const userCusdcBalanceAfter2 = new BigNumber(await cusdc.balanceOf(user))
      const userUsdcBalanceAfter2 = new BigNumber(await usdc.balanceOf(user))
      //margin pool
      const marginPoolCusdcBalanceAfter2 = new BigNumber(await cusdc.balanceOf(marginPool.address))
      const marginPoolUsdcBalanceAfter2 = new BigNumber(await usdc.balanceOf(marginPool.address))
      //proxy
      const proxyCusdcBalanceAfter2 = new BigNumber(await cusdc.balanceOf(payableCerc20ProxyOperator.address))
      const proxyUsdcBalanceAfter2 = new BigNumber(await usdc.balanceOf(payableCerc20ProxyOperator.address))

      //user
      assert.equal(
        userOptionBalanceBefore2.minus(oTokenAmount).toString(),
        userOptionBalanceAfter2.toString(),
        'User oToken balance is incorrect',
      )
      assert.equal(
        userCusdcBalanceBefore2.toString(),
        userCusdcBalanceAfter2.toString(),
        'User cUSDC balance is incorrect',
      )
      assert.equal(
        userUsdcBalanceBefore2.plus(underlyingAssetDeposit).toString(),
        userUsdcBalanceAfter2.toString(),
        'User USDC balance is incorrect',
      )

      //margin pool
      assert.equal(
        marginPoolCusdcBalanceBefore2.minus(scaledCusdcCollateralAmount).toString(),
        marginPoolCusdcBalanceAfter2.toString(),
        'Margin Pool cUSDC balance is incorrect',
      )
      assert.equal(
        marginPoolUsdcBalanceBefore2.toString(),
        marginPoolUsdcBalanceAfter2.toString(),
        'Margin Pool USDC balance is incorrect',
      )
      //proxy
      assert.equal(
        proxyCusdcBalanceBefore2.toString(),
        proxyCusdcBalanceAfter2.toString(),
        'Proxy cUSDC balance is incorrect',
      )
      assert.equal(
        proxyUsdcBalanceBefore2.toString(),
        proxyUsdcBalanceAfter2.toString(),
        'Proxy USDC balance is incorrect',
      )
    })

    it('should send back USDC sent to the proxy with no corresponding DepositArg after wrapping and unwrapping', async () => {
      // determine initial fx rates for assets
      const cusdcPrice = 0.02
      const cethPrice = 0.03
      const scaledCusdcPrice = createTokenAmount(cusdcPrice, 16) // 1 cToken = 0.02 USD
      const scaledCethPrice = createTokenAmount(cethPrice, 28) // 1 cToken = 0.05 USD
      const usdPrice = createTokenAmount(1, 8)
      const ethPrice = createTokenAmount(300, 8)

      //set initial prices for eth, cusdc, ceth
      // await wethAggregator.setLatestAnswer(ethPrice)
      await oracle.setRealTimePrice(weth.address, ethPrice)
      await cusdc.setExchangeRate(scaledCusdcPrice)
      await ceth.setExchangeRate(scaledCethPrice)

      const strike = 300
      const amount = 100

      const optionCollateralValue = strike * amount
      const oTokenAmount = createTokenAmount(amount)
      const underlyingAssetDeposit = createTokenAmount(optionCollateralValue, 6)

      const vaultCounterBefore = new BigNumber(await controllerProxy.getAccountVaultCounter(user))
      vaultCounter = vaultCounterBefore.plus(1).toNumber()

      cusdcCollateralAmount = new BigNumber(optionCollateralValue).div(cusdcPrice)
      const scaledCusdcCollateralAmount = createTokenAmount(cusdcCollateralAmount.toNumber())

      //user
      const userOptionBalanceBefore = new BigNumber(await ethCusdcPut.balanceOf(user))
      const userCusdcBalanceBefore = new BigNumber(await cusdc.balanceOf(user))
      const userUsdcBalanceBefore = new BigNumber(await usdc.balanceOf(user))
      //margin pool
      const marginPoolUsdcBalanceBefore = new BigNumber(await usdc.balanceOf(marginPool.address))
      const marginPoolCusdcBalanceBefore = new BigNumber(await cusdc.balanceOf(marginPool.address))
      //proxy
      const proxyUsdcBalanceBefore = new BigNumber(await usdc.balanceOf(payableCerc20ProxyOperator.address))
      const proxyCusdcBalanceBefore = new BigNumber(await cusdc.balanceOf(payableCerc20ProxyOperator.address))

      await usdc.approve(payableCerc20ProxyOperator.address, underlyingAssetDeposit, {from: user})

      const actionArgsUser = [
        {
          actionType: ActionType.OpenVault,
          owner: user,
          secondAddress: user,
          asset: ZERO_ADDR,
          vaultId: vaultCounter,
          amount: '0',
          index: '0',
          data: ZERO_ADDR,
        },
      ]

      await payableCerc20ProxyOperator.operate(actionArgsUser, user, underlyingAssetDeposit, {
        from: user,
      })

      //user
      const userOptionBalanceAfter = new BigNumber(await ethCusdcPut.balanceOf(user))
      const userCusdcBalanceAfter = new BigNumber(await cusdc.balanceOf(user))
      const userUsdcBalanceAfter = new BigNumber(await usdc.balanceOf(user))
      //margin pool
      const marginPoolCusdcBalanceAfter = new BigNumber(await cusdc.balanceOf(marginPool.address))
      const marginPoolUsdcBalanceAfter = new BigNumber(await usdc.balanceOf(marginPool.address))
      //proxy
      const proxyCusdcBalanceAfter = new BigNumber(await cusdc.balanceOf(payableCerc20ProxyOperator.address))
      const proxyUsdcBalanceAfter = new BigNumber(await usdc.balanceOf(payableCerc20ProxyOperator.address))

      //user
      assert.equal(
        userOptionBalanceBefore.toString(),
        userOptionBalanceAfter.toString(),
        'User oToken balance is incorrect',
      )
      assert.equal(
        userCusdcBalanceBefore.toString(),
        userCusdcBalanceAfter.toString(),
        'User cUSDC balance is incorrect',
      )
      assert.equal(userUsdcBalanceBefore.toString(), userUsdcBalanceAfter.toString(), 'User USDC balance is incorrect')

      //margin pool
      assert.equal(
        marginPoolCusdcBalanceBefore.toString(),
        marginPoolCusdcBalanceAfter.toString(),
        'Margin Pool cUSDC balance is incorrect',
      )
      assert.equal(
        marginPoolUsdcBalanceBefore.toString(),
        marginPoolUsdcBalanceAfter.toString(),
        'Margin Pool USDC balance is incorrect',
      )
      //proxy
      assert.equal(
        proxyCusdcBalanceBefore.toString(),
        proxyCusdcBalanceAfter.toString(),
        'Proxy cUSDC balance is incorrect',
      )
      assert.equal(
        proxyUsdcBalanceBefore.toString(),
        proxyUsdcBalanceAfter.toString(),
        'Proxy USDC balance is incorrect',
      )
    })

    it('should not allow a non-operator to act on a vault even if no funds transfered', async () => {
      // determine initial fx rates for assets
      const cusdcPrice = 0.02
      const cethPrice = 0.03
      const scaledCusdcPrice = createTokenAmount(cusdcPrice, 16) // 1 cToken = 0.02 USD
      const scaledCethPrice = createTokenAmount(cethPrice, 28) // 1 cToken = 0.05 USD
      const usdPrice = createTokenAmount(1, 8)
      const ethPrice = createTokenAmount(300, 8)

      //set initial prices for eth, cusdc, ceth
      // await wethAggregator.setLatestAnswer(ethPrice)
      await oracle.setRealTimePrice(weth.address, ethPrice)
      await cusdc.setExchangeRate(scaledCusdcPrice)
      await ceth.setExchangeRate(scaledCethPrice)

      const strike = 300
      const amount = 100

      const optionCollateralValue = strike * amount
      const oTokenAmount = createTokenAmount(amount)
      const underlyingAssetDeposit = createTokenAmount(optionCollateralValue, 6)

      const vaultCounterBefore = new BigNumber(await controllerProxy.getAccountVaultCounter(user))
      vaultCounter = vaultCounterBefore.plus(1).toNumber()

      cusdcCollateralAmount = new BigNumber(optionCollateralValue).div(cusdcPrice)
      const scaledCusdcCollateralAmount = createTokenAmount(cusdcCollateralAmount.toNumber())

      //user
      const userOptionBalanceBefore = new BigNumber(await ethCusdcPut.balanceOf(user))
      const userCusdcBalanceBefore = new BigNumber(await cusdc.balanceOf(user))
      const userUsdcBalanceBefore = new BigNumber(await usdc.balanceOf(user))
      //margin pool
      const marginPoolUsdcBalanceBefore = new BigNumber(await usdc.balanceOf(marginPool.address))
      const marginPoolCusdcBalanceBefore = new BigNumber(await cusdc.balanceOf(marginPool.address))
      //proxy
      const proxyUsdcBalanceBefore = new BigNumber(await usdc.balanceOf(payableCerc20ProxyOperator.address))
      const proxyCusdcBalanceBefore = new BigNumber(await cusdc.balanceOf(payableCerc20ProxyOperator.address))

      await usdc.approve(payableCerc20ProxyOperator.address, underlyingAssetDeposit, {from: user})

      const actionArgsUser = [
        {
          actionType: ActionType.OpenVault,
          owner: user,
          secondAddress: user,
          asset: ZERO_ADDR,
          vaultId: vaultCounter,
          amount: '0',
          index: '0',
          data: ZERO_ADDR,
        },
      ]

      await expectRevert(
        payableCerc20ProxyOperator.operate(actionArgsUser, random, 0, {
          from: random,
        }),
        'PayableCERC20: msg.sender is not owner or operator',
      )
    })

    it('should not allow a non-operator to act on a vault even if funds transfered', async () => {
      // determine initial fx rates for assets
      const cusdcPrice = 0.02
      const cethPrice = 0.03
      const scaledCusdcPrice = createTokenAmount(cusdcPrice, 16) // 1 cToken = 0.02 USD
      const scaledCethPrice = createTokenAmount(cethPrice, 28) // 1 cToken = 0.05 USD
      const usdPrice = createTokenAmount(1, 8)
      const ethPrice = createTokenAmount(300, 8)

      //set initial prices for eth, cusdc, ceth
      // await wethAggregator.setLatestAnswer(ethPrice)
      await oracle.setRealTimePrice(weth.address, ethPrice)
      await cusdc.setExchangeRate(scaledCusdcPrice)
      await ceth.setExchangeRate(scaledCethPrice)

      const strike = 300
      const amount = 100

      const optionCollateralValue = strike * amount
      const oTokenAmount = createTokenAmount(amount)
      const underlyingAssetDeposit = createTokenAmount(optionCollateralValue, 6)

      const vaultCounterBefore = new BigNumber(await controllerProxy.getAccountVaultCounter(user))
      vaultCounter = vaultCounterBefore.plus(1).toNumber()

      cusdcCollateralAmount = new BigNumber(optionCollateralValue).div(cusdcPrice)
      const scaledCusdcCollateralAmount = createTokenAmount(cusdcCollateralAmount.toNumber())

      //user
      const userOptionBalanceBefore = new BigNumber(await ethCusdcPut.balanceOf(user))
      const userCusdcBalanceBefore = new BigNumber(await cusdc.balanceOf(user))
      const userUsdcBalanceBefore = new BigNumber(await usdc.balanceOf(user))
      //margin pool
      const marginPoolUsdcBalanceBefore = new BigNumber(await usdc.balanceOf(marginPool.address))
      const marginPoolCusdcBalanceBefore = new BigNumber(await cusdc.balanceOf(marginPool.address))
      //proxy
      const proxyUsdcBalanceBefore = new BigNumber(await usdc.balanceOf(payableCerc20ProxyOperator.address))
      const proxyCusdcBalanceBefore = new BigNumber(await cusdc.balanceOf(payableCerc20ProxyOperator.address))

      await usdc.approve(payableCerc20ProxyOperator.address, underlyingAssetDeposit, {from: random})

      const actionArgsUser = [
        {
          actionType: ActionType.OpenVault,
          owner: user,
          secondAddress: user,
          asset: ZERO_ADDR,
          vaultId: vaultCounter,
          amount: '0',
          index: '0',
          data: ZERO_ADDR,
        },
      ]

      await expectRevert(
        payableCerc20ProxyOperator.operate(actionArgsUser, random, underlyingAssetDeposit, {
          from: random,
        }),
        'PayableCERC20: msg.sender is not owner or operator',
      )
    })
  })

  describe('Wrap ETH and execute actions', () => {
    it('should deposit a whitelisted collateral asset from account owner', async () => {
      // whitelist weth
      await whitelist.whitelistCollateral(weth.address)

      const vaultCounter = new BigNumber(await controllerProxy.getAccountVaultCounter(user)).plus(1)
      const collateralToDeposit = new BigNumber('5')

      const actionArgs = [
        {
          actionType: ActionType.OpenVault,
          owner: user,
          secondAddress: user,
          asset: ZERO_ADDR,
          vaultId: vaultCounter.toNumber(),
          amount: '0',
          index: '0',
          data: ZERO_ADDR,
        },
        {
          actionType: ActionType.DepositCollateral,
          owner: user,
          secondAddress: payableCerc20ProxyOperator.address,
          asset: weth.address,
          vaultId: vaultCounter.toNumber(),
          amount: collateralToDeposit.toNumber(),
          index: '0',
          data: ZERO_ADDR,
        },
      ]

      const marginPoolBalanceBefore = new BigNumber(await weth.balanceOf(marginPool.address))

      await payableCerc20ProxyOperator.operate(actionArgs, user, '0', {
        from: user,
        value: collateralToDeposit.toString(),
      })

      const marginPoolBalanceAfter = new BigNumber(await weth.balanceOf(marginPool.address))
      const vaultAfter = await controllerProxy.getVault(user, vaultCounter)

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
      const vaultCounter = new BigNumber(await controllerProxy.getAccountVaultCounter(user)).plus(1)
      const collateralToDeposit = new BigNumber('5')
      const ethToSend = new BigNumber('7')

      const actionArgs = [
        {
          actionType: ActionType.OpenVault,
          owner: user,
          secondAddress: user,
          asset: ZERO_ADDR,
          vaultId: vaultCounter.toNumber(),
          amount: '0',
          index: '0',
          data: ZERO_ADDR,
        },
        {
          actionType: ActionType.DepositCollateral,
          owner: user,
          secondAddress: payableCerc20ProxyOperator.address,
          asset: weth.address,
          vaultId: vaultCounter.toNumber(),
          amount: collateralToDeposit.toNumber(),
          index: '0',
          data: ZERO_ADDR,
        },
      ]

      const marginPoolBalanceBefore = new BigNumber(await weth.balanceOf(marginPool.address))

      await payableCerc20ProxyOperator.operate(actionArgs, user, '0', {
        from: user,
        value: ethToSend.toString(),
      })

      const marginPoolBalanceAfter = new BigNumber(await weth.balanceOf(marginPool.address))
      const vaultAfter = await controllerProxy.getVault(user, vaultCounter)

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
      const vaultCounter = new BigNumber(await controllerProxy.getAccountVaultCounter(user)).plus(1)
      const collateralToDeposit = new BigNumber('5')
      const ethToSend = new BigNumber('7')

      const actionArgs = [
        {
          actionType: ActionType.OpenVault,
          owner: user,
          secondAddress: user,
          asset: ZERO_ADDR,
          vaultId: vaultCounter.toNumber(),
          amount: '0',
          index: '0',
          data: ZERO_ADDR,
        },
        {
          actionType: ActionType.DepositCollateral,
          owner: user,
          secondAddress: payableCerc20ProxyOperator.address,
          asset: weth.address,
          vaultId: vaultCounter.toNumber(),
          amount: collateralToDeposit.toNumber(),
          index: '0',
          data: ZERO_ADDR,
        },
      ]
      await expectRevert(
        payableCerc20ProxyOperator.operate(actionArgs, ZERO_ADDR, '0', {
          from: user,
          value: ethToSend.toString(),
        }),
        'PayableCERC20: cannot send ETH to address zero',
      )
    })

    it('should revert calling fallback function unless caller is WETH token address', async () => {
      const ethToSend = new BigNumber('7')

      await expectRevert(
        web3.eth.sendTransaction({
          from: user,
          to: payableCerc20ProxyOperator.address,
          value: ethToSend.toString(),
        }),
        'PayableCERC20: Cannot receive ETH',
      )
    })

    it('should revert calling operate on a vault from a random address other than owner or operator', async () => {
      const vaultCounterBefore = new BigNumber(await controllerProxy.getAccountVaultCounter(user))
      const actionArgs = [
        {
          actionType: ActionType.OpenVault,
          owner: user,
          secondAddress: user,
          asset: ZERO_ADDR,
          vaultId: vaultCounterBefore.plus(1).toNumber(),
          amount: '0',
          index: '0',
          data: ZERO_ADDR,
        },
      ]

      await expectRevert(
        payableCerc20ProxyOperator.operate(actionArgs, ZERO_ADDR, '0', {
          from: random,
        }),
        'PayableCERC20: msg.sender is not owner or operator',
      )
    })
  })

  describe('Operate without ETH', () => {
    it('should normally execute operate', async () => {
      const vaultCounterBefore = new BigNumber(await controllerProxy.getAccountVaultCounter(user))
      const actionArgs = [
        {
          actionType: ActionType.OpenVault,
          owner: user,
          secondAddress: user,
          asset: ZERO_ADDR,
          vaultId: vaultCounterBefore.plus(1).toNumber(),
          amount: '0',
          index: '0',
          data: ZERO_ADDR,
        },
      ]

      await payableCerc20ProxyOperator.operate(actionArgs, ZERO_ADDR, '0', {
        from: user,
      })

      const vaultCounterAfter = new BigNumber(await controllerProxy.getAccountVaultCounter(user))
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
      // change factory address
      await addressBook.setOtokenFactory(factoryMock)
      // whitelist short otoken to be used in the protocol
      await whitelist.whitelistOtoken(shortOtoken.address, {from: factoryMock})
      // whitelist collateral
      await whitelist.whitelistCollateral(usdc.address, {from: user})
      // open new vault, mintnaked short, sell it to holder 1
      const vaultCounter = new BigNumber(await controllerProxy.getAccountVaultCounter(user)).plus(1)
      const collateralToDeposit = createTokenAmount(strikePrice, 6)
      const amountToMint = createTokenAmount(1)
      const actionArgs = [
        {
          actionType: ActionType.OpenVault,
          owner: user,
          secondAddress: user,
          asset: ZERO_ADDR,
          vaultId: vaultCounter.toNumber(),
          amount: '0',
          index: '0',
          data: ZERO_ADDR,
        },
        {
          actionType: ActionType.MintShortOption,
          owner: user,
          secondAddress: user,
          asset: shortOtoken.address,
          vaultId: vaultCounter.toNumber(),
          amount: amountToMint.toString(),
          index: '0',
          data: ZERO_ADDR,
        },
        {
          actionType: ActionType.DepositCollateral,
          owner: user,
          secondAddress: user,
          asset: usdc.address,
          vaultId: vaultCounter.toNumber(),
          amount: collateralToDeposit,
          index: '0',
          data: ZERO_ADDR,
        },
      ]
      await usdc.approve(marginPool.address, collateralToDeposit, {from: user})
      await payableCerc20ProxyOperator.operate(actionArgs, user, '0', {from: user})
      // transfer minted short otoken to hodler`
      await shortOtoken.transfer(holder1, amountToMint.toString(), {from: user})
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

      await shortOtoken.approve(payableCerc20ProxyOperator.address, amountToRedeem.toString(), {from: holder1})
      await payableCerc20ProxyOperator.operate(actionArgs, holder1, '0', {from: holder1})
    })
  })
  describe('Redeem ETH collateralized vault and cUSDC collateralized vault at once', () => {
    let shortOtoken: MockOtokenInstance
    // let strikePriceAtExpiry: BigNumber
    // let underlyingPriceAtExpiry: BigNumber
    // let cusdcPriceAtExpiry: BigNumber
    // let strikePrice: BigNumber

    before(async () => {
      const amountToMint = createTokenAmount(1)

      // determine initial fx rates for assets
      const cusdcPrice = 0.02
      const cethPrice = 0.03
      const scaledCusdcPrice = createTokenAmount(cusdcPrice, 16) // 1 cToken = 0.02 USD
      const scaledCethPrice = createTokenAmount(cethPrice, 28) // 1 cToken = 0.05 USD
      const usdPrice = createTokenAmount(1, 8)
      const ethPrice = createTokenAmount(300, 8)

      //set initial prices for eth, cusdc, ceth
      await oracle.setRealTimePrice(weth.address, ethPrice)
      await oracle.setStablePrice(usdc.address, usdPrice)
      await cusdc.setExchangeRate(scaledCusdcPrice)
      await ceth.setExchangeRate(scaledCethPrice)
      await oracle.setRealTimePrice(cusdc.address, createTokenAmount(cusdcPrice, 8))

      const strike = 300
      const amount = 100

      const optionCollateralValue = strike * amount
      const oTokenAmount = createTokenAmount(amount)
      const underlyingAssetDeposit = createTokenAmount(optionCollateralValue, 6)

      const vaultCounterBefore = new BigNumber(await controllerProxy.getAccountVaultCounter(user))
      vaultCounter = vaultCounterBefore.plus(1).toNumber()

      cusdcCollateralAmount = new BigNumber(optionCollateralValue).div(cusdcPrice)
      const scaledCusdcCollateralAmount = createTokenAmount(cusdcCollateralAmount.toNumber())

      await usdc.approve(payableCerc20ProxyOperator.address, underlyingAssetDeposit, {from: user})

      const actionArgsUser = [
        {
          actionType: ActionType.OpenVault,
          owner: user,
          secondAddress: user,
          asset: ZERO_ADDR,
          vaultId: vaultCounter,
          amount: '0',
          index: '0',
          data: ZERO_ADDR,
        },
        {
          actionType: ActionType.MintShortOption,
          owner: user,
          secondAddress: user,
          asset: ethCusdcPut.address,
          vaultId: vaultCounter,
          amount: oTokenAmount,
          index: '0',
          data: ZERO_ADDR,
        },
        {
          actionType: ActionType.DepositCollateral,
          owner: user,
          secondAddress: payableCerc20ProxyOperator.address,
          asset: cusdc.address,
          vaultId: vaultCounter,
          amount: 0,
          index: '0',
          data: ZERO_ADDR,
        },
      ]

      await payableCerc20ProxyOperator.operate(actionArgsUser, user, underlyingAssetDeposit, {
        from: user,
      })

      await ethCusdcPut.transfer(holder1, amountToMint.toString(), {from: user})

      //const expiryTime = new BigNumber(60 * 60 * 24) // after 1 day
      //const expiry = new BigNumber(await time.latest()).plus(expiryTime)
      const strikePrice = 200
      // const underlyingPriceAtExpiry = createScaledNumber(250)
      // const strikePriceAtExpiry = createScaledNumber(1)
      // const cusdcPriceAtExpiry = createScaledNumber(0.02)

      const underlyingPriceAtExpiry = createTokenAmount(250)
      const strikePriceAtExpiry = createTokenAmount(1)
      const cusdcPriceAtExpiry = createTokenAmount(0.02)

      shortOtoken = await MockOtoken.new()
      // init otoken
      await shortOtoken.init(
        addressBook.address,
        weth.address,
        usdc.address,
        weth.address,
        createScaledNumber(strikePrice),
        expiry,
        false,
      )
      // change factory address
      await addressBook.setOtokenFactory(factoryMock)
      // whitelist short otoken to be used in the protocol
      await whitelist.whitelistOtoken(shortOtoken.address, {from: factoryMock})
      // whitelist collateral
      await whitelist.whitelistCollateral(usdc.address, {from: user})
      // open new vault, mintnaked short, sell it to holder 1
      const vaultCounterBefore2ndMint = new BigNumber(await controllerProxy.getAccountVaultCounter(user))
      vaultCounter = vaultCounterBefore2ndMint.plus(1).toNumber()
      const collateralToDeposit = createTokenAmount(1, 18)
      const actionArgs = [
        {
          actionType: ActionType.OpenVault,
          owner: user,
          secondAddress: user,
          asset: ZERO_ADDR,
          vaultId: vaultCounter,
          amount: '0',
          index: '0',
          data: ZERO_ADDR,
        },
        {
          actionType: ActionType.MintShortOption,
          owner: user,
          secondAddress: user,
          asset: shortOtoken.address,
          vaultId: vaultCounter,
          amount: amountToMint,
          index: '0',
          data: ZERO_ADDR,
        },
        {
          actionType: ActionType.DepositCollateral,
          owner: user,
          secondAddress: payableCerc20ProxyOperator.address,
          asset: weth.address,
          vaultId: vaultCounter,
          amount: collateralToDeposit,
          index: '0',
          data: ZERO_ADDR,
        },
      ]
      await payableCerc20ProxyOperator.operate(actionArgs, user, '0', {from: user, value: collateralToDeposit})
      // transfer minted short otoken to hodler`
      await shortOtoken.transfer(holder1, amountToMint.toString(), {from: user})
      // increase time with one hour in seconds
      await time.increase(60 * 60 * 24 * 367)
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
      await oracle.setExpiryPriceFinalizedAllPeiodOver(
        await ethCusdcPut.collateralAsset(),
        new BigNumber(await shortOtoken.expiryTimestamp()),
        cusdcPriceAtExpiry,
        true,
      )
    })
    it('redeem ETH collateral options and cUSDC collateral options', async () => {
      const strikePrice = new BigNumber(200)
      // const underlyingPriceAtExpiry = createScaledNumber(250)
      // const strikePriceAtExpiry = createScaledNumber(1)
      // const cusdcPriceAtExpiry = createScaledNumber(0.02)
      const underlyingPriceAtExpiry = new BigNumber(createTokenAmount(250))
      const strikePriceAtExpiry = new BigNumber(createTokenAmount(1))
      const cusdcPriceAtExpiry = new BigNumber(createTokenAmount(0.02))

      const amountToRedeem = new BigNumber(createTokenAmount(1))
      const proceedsPerCall = underlyingPriceAtExpiry.minus(strikePrice)
      const proceedsPerPut = strikePrice.minus(underlyingPriceAtExpiry)
      const callProceeds = proceedsPerCall.times(amountToRedeem)
      const putProceeds = proceedsPerPut.times(amountToRedeem)

      const expectedCusdc = createTokenAmount(putProceeds.div(cusdcPriceAtExpiry), 8)
      const expectedEth = createTokenAmount(callProceeds, 18)
      const expectedUsdc = createTokenAmount(putProceeds, 6)

      //holder1
      const userPutBalanceBefore = new BigNumber(await ethCusdcPut.balanceOf(holder1))
      const userCallBalanceBefore = new BigNumber(await shortOtoken.balanceOf(holder1))
      const userCusdcBalanceBefore = new BigNumber(await cusdc.balanceOf(holder1))
      const userUsdcBalanceBefore = new BigNumber(await usdc.balanceOf(holder1))
      const userWethBalanceBefore = new BigNumber(await weth.balanceOf(holder1))
      const userEthBalanceBefore = new BigNumber(await web3.eth.getBalance(holder1))

      //margin pool
      const marginPoolUsdcBalanceBefore = new BigNumber(await usdc.balanceOf(marginPool.address))
      const marginPoolCusdcBalanceBefore = new BigNumber(await cusdc.balanceOf(marginPool.address))
      const marginPoolWethBalanceBefore = new BigNumber(await weth.balanceOf(marginPool.address))
      const marginPoolEthBalanceBefore = new BigNumber(await web3.eth.getBalance(marginPool.address))

      //proxy
      const proxyUsdcBalanceBefore = new BigNumber(await usdc.balanceOf(payableCerc20ProxyOperator.address))
      const proxyCusdcBalanceBefore = new BigNumber(await cusdc.balanceOf(payableCerc20ProxyOperator.address))
      const proxyWethBalanceBefore = new BigNumber(await weth.balanceOf(payableCerc20ProxyOperator.address))
      const proxyEthBalanceBefore = new BigNumber(await web3.eth.getBalance(payableCerc20ProxyOperator.address))

      const actionArgs = [
        {
          actionType: ActionType.Redeem,
          owner: ZERO_ADDR,
          secondAddress: payableCerc20ProxyOperator.address,
          asset: shortOtoken.address,
          vaultId: '0',
          amount: amountToRedeem.toString(),
          index: '0',
          data: ZERO_ADDR,
        },
        {
          actionType: ActionType.Redeem,
          owner: ZERO_ADDR,
          secondAddress: payableCerc20ProxyOperator.address,
          asset: ethCusdcPut.address,
          vaultId: '0',
          amount: amountToRedeem.toString(),
          index: '0',
          data: ZERO_ADDR,
        },
      ]
      assert.equal(await controllerProxy.hasExpired(shortOtoken.address), true, 'Short call is not expired yet')
      assert.equal(await controllerProxy.hasExpired(ethCusdcPut.address), true, 'Short put is not expired yet')

      await shortOtoken.approve(payableCerc20ProxyOperator.address, amountToRedeem, {from: holder1})
      await ethCusdcPut.approve(payableCerc20ProxyOperator.address, amountToRedeem, {from: holder1})
      await payableCerc20ProxyOperator.operate(actionArgs, holder1, '0', {from: holder1})

      //holder1
      const userPutBalanceAfter = new BigNumber(await ethCusdcPut.balanceOf(holder1))
      const userCallBalanceAfter = new BigNumber(await shortOtoken.balanceOf(holder1))
      const userCusdcBalanceAfter = new BigNumber(await cusdc.balanceOf(holder1))
      const userUsdcBalanceAfter = new BigNumber(await usdc.balanceOf(holder1))
      const userWethBalanceAfter = new BigNumber(await weth.balanceOf(holder1))
      const userEthBalanceAfter = new BigNumber(await web3.eth.getBalance(holder1))
      //margin pool
      const marginPoolCusdcBalanceAfter = new BigNumber(await cusdc.balanceOf(marginPool.address))
      const marginPoolUsdcBalanceAfter = new BigNumber(await usdc.balanceOf(marginPool.address))
      const marginPoolWethBalanceAfter = new BigNumber(await weth.balanceOf(marginPool.address))
      const marginPoolEthBalanceAfter = new BigNumber(await web3.eth.getBalance(marginPool.address))

      //proxy
      const proxyCusdcBalanceAfter = new BigNumber(await cusdc.balanceOf(payableCerc20ProxyOperator.address))
      const proxyUsdcBalanceAfter = new BigNumber(await usdc.balanceOf(payableCerc20ProxyOperator.address))
      const proxyWethBalanceAfter = new BigNumber(await weth.balanceOf(payableCerc20ProxyOperator.address))
      const proxyEthBalanceAfter = new BigNumber(await web3.eth.getBalance(payableCerc20ProxyOperator.address))

      //user
      assert.equal(
        userPutBalanceBefore.minus(amountToRedeem).toString(),
        userPutBalanceAfter.toString(),
        'User put option balance is incorrect',
      )
      assert.equal(
        userCallBalanceBefore.minus(amountToRedeem).toString(),
        userCallBalanceAfter.toString(),
        'User call option balance is incorrect',
      )

      assert.equal(
        userCusdcBalanceBefore.toString(),
        userCusdcBalanceAfter.toString(),
        'User cUSDC balance is incorrect',
      )

      console.log(userUsdcBalanceBefore.toString())
      console.log(userUsdcBalanceAfter.toString())

      assert.equal(
        userUsdcBalanceBefore.plus(expectedUsdc).toString(),
        userUsdcBalanceAfter.toString(),
        'User USDC balance is incorrect',
      )

      assert.equal(userWethBalanceBefore.toString(), userWethBalanceAfter.toString(), 'User USDC balance is incorrect')

      assert.equal(
        userEthBalanceBefore.plus(expectedEth).toString(),
        userEthBalanceAfter.toString(),
        'User USDC balance is incorrect',
      )

      //margin pool
      assert.equal(
        marginPoolCusdcBalanceBefore.minus(expectedCusdc).toString(),
        marginPoolCusdcBalanceAfter.toString(),
        'Margin Pool cUSDC balance is incorrect',
      )
      assert.equal(
        marginPoolUsdcBalanceBefore.toString(),
        marginPoolUsdcBalanceAfter.toString(),
        'Margin Pool USDC balance is incorrect',
      )

      assert.equal(
        marginPoolWethBalanceBefore.minus(expectedEth).toString(),
        marginPoolWethBalanceAfter.toString(),
        'Margin Pool USDC balance is incorrect',
      )

      assert.equal(
        marginPoolEthBalanceBefore.toString(),
        marginPoolEthBalanceAfter.toString(),
        'Margin Pool USDC balance is incorrect',
      )

      //proxy
      assert.equal(
        proxyCusdcBalanceBefore.toString(),
        proxyCusdcBalanceAfter.toString(),
        'Proxy cUSDC balance is incorrect',
      )
      assert.equal(
        proxyUsdcBalanceBefore.toString(),
        proxyUsdcBalanceAfter.toString(),
        'Proxy USDC balance is incorrect',
      )

      assert.equal(
        proxyCusdcBalanceBefore.toString(),
        proxyCusdcBalanceAfter.toString(),
        'Proxy cUSDC balance is incorrect',
      )
      assert.equal(
        proxyUsdcBalanceBefore.toString(),
        proxyUsdcBalanceAfter.toString(),
        'Proxy USDC balance is incorrect',
      )
    })
  })
})
