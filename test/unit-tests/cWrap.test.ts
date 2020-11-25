import {
  MockERC20Instance,
  ControllerInstance,
  CompoundPricerInstance,
  AddressBookInstance,
  MarginCalculatorInstance,
  MarginPoolInstance,
  WhitelistInstance,
  OtokenInstance,
  OtokenFactoryInstance,
  CERC20ProxyInstance,
  MockOracleInstance,
  ChainLinkPricerInstance,
  MockChainlinkAggregatorInstance,
  MockCUSDCInstance,
  OwnedUpgradeabilityProxyInstance,
} from '../../build/types/truffle-types'

import BigNumber from 'bignumber.js'
import {createTokenAmount, createValidExpiry} from '../utils'
const {expectRevert, time} = require('@openzeppelin/test-helpers')

const ERC20 = artifacts.require('MockERC20')
const Controller = artifacts.require('Controller.sol')
const CERC20Proxy = artifacts.require('CERC20Proxy')
const AddressBook = artifacts.require('AddressBook.sol')
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

contract('CToken Proxy test', async ([user, random]) => {
  let usdc: MockERC20Instance
  let weth: MockERC20Instance
  let cusdc: MockCUSDCInstance

  let cerc20ProxyOperator: CERC20ProxyInstance

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

  let ethCusdcPut: OtokenInstance

  let wethPricer: ChainLinkPricerInstance
  let cusdcPricer: CompoundPricerInstance

  let wethAggregator: MockChainlinkAggregatorInstance

  let vaultCounter: number
  let cusdcCollateralAmount: BigNumber

  before('setup contracts', async () => {
    const now = (await time.latest()).toNumber()
    expiry = createValidExpiry(now, 300) // 300 days from now

    weth = await ERC20.new('WETH', 'WETH', 18)
    usdc = await ERC20.new('USDC', 'USDC', 6)
    cusdc = await MockCUSDC.new('cUSDC', 'cUSDC', usdc.address, createTokenAmount(1, 16))

    // initiate addressbook first.
    addressBook = await AddressBook.new()
    calculator = await MarginCalculator.new(addressBook.address)
    marginPool = await MarginPool.new(addressBook.address)
    const lib = await MarginVault.new()
    await Controller.link('MarginVault', lib.address)
    controllerImplementation = await Controller.new(addressBook.address)

    //oracle = await Oracle.new(addressBook.address)
    oracle = await Oracle.new()

    await oracle.setStablePrice(usdc.address, createTokenAmount(1, 8))
    wethAggregator = await MockChainlinkAggregator.new()

    wethPricer = await ChainlinkPricer.new(user, weth.address, wethAggregator.address, oracle.address)
    await oracle.setAssetPricer(weth.address, wethPricer.address)
    cusdcPricer = await CompoundPricer.new(cusdc.address, usdc.address, oracle.address)
    await oracle.setAssetPricer(cusdc.address, cusdcPricer.address)

    const lockingPeriod = time.duration.minutes(15).toNumber()
    const disputePeriod = time.duration.minutes(15).toNumber()

    await oracle.setLockingPeriod(wethPricer.address, lockingPeriod)
    await oracle.setDisputePeriod(wethPricer.address, disputePeriod)
    await oracle.setLockingPeriod(cusdcPricer.address, lockingPeriod)
    await oracle.setDisputePeriod(cusdcPricer.address, disputePeriod)

    whitelist = await Whitelist.new(addressBook.address)

    await whitelist.whitelistCollateral(cusdc.address)

    // whitelist eth-usdc-ceth calls and eth-usdc-cusdc puts
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
    cerc20ProxyOperator = await CERC20Proxy.new(controllerProxyAddress, marginPool.address)

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
    await weth.mint(user, createTokenAmount(1000000, 6))
    await usdc.mint(random, createTokenAmount(1000000, 6))
    await weth.mint(random, createTokenAmount(1000000, 6))

    //set proxy as operator
    await controllerProxy.setOperator(cerc20ProxyOperator.address, true, {from: user})
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
      await wethAggregator.setLatestAnswer(ethPrice)
      await cusdc.setExchangeRate(scaledCusdcPrice)

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
      const proxyUsdcBalanceBefore = new BigNumber(await usdc.balanceOf(cerc20ProxyOperator.address))
      const proxyCusdcBalanceBefore = new BigNumber(await cusdc.balanceOf(cerc20ProxyOperator.address))

      await usdc.approve(cerc20ProxyOperator.address, underlyingAssetDeposit, {from: user})

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
          secondAddress: cerc20ProxyOperator.address,
          asset: cusdc.address,
          vaultId: vaultCounter,
          amount: 0,
          index: '0',
          data: ZERO_ADDR,
        },
      ]

      await cerc20ProxyOperator.operate(actionArgsUser, usdc.address, cusdc.address, underlyingAssetDeposit, {
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
      const proxyCusdcBalanceAfter = new BigNumber(await cusdc.balanceOf(cerc20ProxyOperator.address))
      const proxyUsdcBalanceAfter = new BigNumber(await usdc.balanceOf(cerc20ProxyOperator.address))

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
      await wethAggregator.setLatestAnswer(ethPrice)
      await cusdc.setExchangeRate(scaledCusdcPrice)

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
      const proxyUsdcBalanceBefore2 = new BigNumber(await usdc.balanceOf(cerc20ProxyOperator.address))
      const proxyCusdcBalanceBefore2 = new BigNumber(await cusdc.balanceOf(cerc20ProxyOperator.address))

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
          secondAddress: cerc20ProxyOperator.address,
          asset: cusdc.address,
          vaultId: vaultCounter,
          amount: scaledCusdcCollateralAmount,
          index: '0',
          data: ZERO_ADDR,
        },
      ]

      await cerc20ProxyOperator.operate(actionArgsUser2, usdc.address, cusdc.address, 0, {
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
      const proxyCusdcBalanceAfter2 = new BigNumber(await cusdc.balanceOf(cerc20ProxyOperator.address))
      const proxyUsdcBalanceAfter2 = new BigNumber(await usdc.balanceOf(cerc20ProxyOperator.address))

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
      await wethAggregator.setLatestAnswer(ethPrice)
      await cusdc.setExchangeRate(scaledCusdcPrice)

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
      const proxyUsdcBalanceBefore = new BigNumber(await usdc.balanceOf(cerc20ProxyOperator.address))
      const proxyCusdcBalanceBefore = new BigNumber(await cusdc.balanceOf(cerc20ProxyOperator.address))

      await usdc.approve(cerc20ProxyOperator.address, underlyingAssetDeposit, {from: user})

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

      await cerc20ProxyOperator.operate(actionArgsUser, usdc.address, cusdc.address, underlyingAssetDeposit, {
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
      const proxyCusdcBalanceAfter = new BigNumber(await cusdc.balanceOf(cerc20ProxyOperator.address))
      const proxyUsdcBalanceAfter = new BigNumber(await usdc.balanceOf(cerc20ProxyOperator.address))

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
      await wethAggregator.setLatestAnswer(ethPrice)
      await cusdc.setExchangeRate(scaledCusdcPrice)

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
      const proxyUsdcBalanceBefore = new BigNumber(await usdc.balanceOf(cerc20ProxyOperator.address))
      const proxyCusdcBalanceBefore = new BigNumber(await cusdc.balanceOf(cerc20ProxyOperator.address))

      await usdc.approve(cerc20ProxyOperator.address, underlyingAssetDeposit, {from: user})

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
        cerc20ProxyOperator.operate(actionArgsUser, usdc.address, cusdc.address, 0, {
          from: random,
        }),
        'CERC20Proxy: msg.sender is not owner or operator',
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
      await wethAggregator.setLatestAnswer(ethPrice)
      await cusdc.setExchangeRate(scaledCusdcPrice)

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
      const proxyUsdcBalanceBefore = new BigNumber(await usdc.balanceOf(cerc20ProxyOperator.address))
      const proxyCusdcBalanceBefore = new BigNumber(await cusdc.balanceOf(cerc20ProxyOperator.address))

      await usdc.approve(cerc20ProxyOperator.address, underlyingAssetDeposit, {from: random})

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
        cerc20ProxyOperator.operate(actionArgsUser, usdc.address, cusdc.address, underlyingAssetDeposit, {
          from: random,
        }),
        'CERC20Proxy: msg.sender is not owner or operator',
      )
    })
  })
})
