import {
  MockERC20Instance,
  WETH9Instance,
  ControllerInstance,
  USDCPricerInstance,
  CompoundPricerInstance,
  AddressBookInstance,
  MarginCalculatorInstance,
  MarginPoolInstance,
  WhitelistInstance,
  OtokenInstance,
  OtokenFactoryInstance,
  CTokenInterfaceInstance,
  CETHProxyInstance,
  CERC20ProxyInstance,
  OracleInstance,
  ChainLinkPricerInstance,
  MockChainlinkAggregatorInstance,
  CETHInterfaceInstance,
  CERC20InterfaceInstance,
  MockCETHInstance,
  MockCUSDCInstance,
} from '../../build/types/truffle-types'

import BigNumber from 'bignumber.js'
import {createTokenAmount, createValidExpiry} from '../utils'
const {time} = require('@openzeppelin/test-helpers')

const ERC20 = artifacts.require('MockERC20')
const WETH = artifacts.require('WETH9')
const Controller = artifacts.require('Controller')
const CETHProxy = artifacts.require('CETHProxy')
const CERC20Proxy = artifacts.require('CERC20Proxy')
const AddressBook = artifacts.require('AddressBook.sol')
const Oracle = artifacts.require('Oracle.sol')
const Otoken = artifacts.require('Otoken.sol')
const CERC20Interface = artifacts.require('CERC20Interface')
const CETHInterface = artifacts.require('CETHInterface')
const MarginCalculator = artifacts.require('MarginCalculator.sol')
const Whitelist = artifacts.require('Whitelist.sol')
const MarginPool = artifacts.require('MarginPool.sol')
const MarginVault = artifacts.require('MarginVault.sol')
const OTokenFactory = artifacts.require('OtokenFactory.sol')
const USDCPricer = artifacts.require('USDCPricer.sol')
const CompoundPricer = artifacts.require('CompoundPricer.sol')
const MockChainlinkAggregator = artifacts.require('MockChainlinkAggregator.sol')
const ChainlinkPricer = artifacts.require('ChainLinkPricer.sol')
const MockCETH = artifacts.require('MockCETH.sol')
const MockCUSDC = artifacts.require('MockCUSDC.sol')
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
  Redeem,
  Call,
}

contract('CToken Proxy test', async ([user]) => {
  let usdc: MockERC20Instance
  let weth: MockERC20Instance
  let cusdc: MockCUSDCInstance
  let ceth: MockCETHInstance

  let cethProxyOperator: CETHProxyInstance
  let cerc20ProxyOperator: CERC20ProxyInstance

  let addressBook: AddressBookInstance
  let calculator: MarginCalculatorInstance
  let controllerProxy: ControllerInstance
  let controllerImplementation: ControllerInstance
  let marginPool: MarginPoolInstance
  let whitelist: WhitelistInstance
  let otokenImplementation: OtokenInstance
  let otokenFactory: OtokenFactoryInstance
  let oracle: OracleInstance

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

    weth = await ERC20.new('WETH', 'WETH', 18)
    usdc = await ERC20.new('USDC', 'USDC', 6)
    ceth = await MockCETH.new('cETH', 'cETH')
    cusdc = await MockCUSDC.new('cUSDC', 'cUSDC')

    // initiate addressbook first.
    addressBook = await AddressBook.new()
    calculator = await MarginCalculator.new(addressBook.address)

    marginPool = await MarginPool.new(addressBook.address)
    const lib = await MarginVault.new()
    await Controller.link('MarginVault', lib.address)
    controllerImplementation = await Controller.new(addressBook.address)

    oracle = await Oracle.new(addressBook.address)
    await oracle.setStablePrice(usdc.address, createTokenAmount(1, 8))
    wethAggregator = await MockChainlinkAggregator.new()

    wethPricer = await ChainlinkPricer.new(weth.address, wethAggregator.address, oracle.address)
    await oracle.setAssetPricer(weth.address, wethPricer.address)
    cusdcPricer = await CompoundPricer.new(cusdc.address, usdc.address, oracle.address)
    await oracle.setAssetPricer(cusdc.address, cusdcPricer.address)
    cethPricer = await CompoundPricer.new(ceth.address, weth.address, oracle.address)
    await oracle.setAssetPricer(ceth.address, cethPricer.address)

    const lockingPeriod = time.duration.minutes(15).toNumber()
    const disputePeriod = time.duration.minutes(15).toNumber()

    await oracle.setLockingPeriod(wethPricer.address, lockingPeriod)
    await oracle.setDisputePeriod(wethPricer.address, disputePeriod)
    //await oracle.setLockingPeriod(usdcPricer.address, lockingPeriod)
    //await oracle.setDisputePeriod(usdcPricer.address, disputePeriod)
    await oracle.setLockingPeriod(cethPricer.address, lockingPeriod)
    await oracle.setDisputePeriod(cethPricer.address, disputePeriod)
    await oracle.setLockingPeriod(cusdcPricer.address, lockingPeriod)
    await oracle.setDisputePeriod(cusdcPricer.address, disputePeriod)

    whitelist = await Whitelist.new(addressBook.address)

    await whitelist.whitelistCollateral(usdc.address)
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

    // deploy callee
    cerc20ProxyOperator = await CERC20Proxy.new(controllerProxyAddress, marginPool.address)
    cethProxyOperator = await CETHProxy.new(controllerProxyAddress, marginPool.address, ceth.address)

    // deploy ceth collateral option
    await otokenFactory.createOtoken(weth.address, usdc.address, ceth.address, createTokenAmount(300), expiry, false)
    const cethCallAddr = await otokenFactory.getOtoken(
      weth.address,
      usdc.address,
      ceth.address,
      createTokenAmount(300),
      expiry,
      true,
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
  })

  describe('Mint actions via proxy', () => {
    it('mint 100 ethusdc-cusdc 300 strike put option by depositing 30000 USDC', async () => {
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
      const proxyUsdcBalanceBefore = new BigNumber(await usdc.balanceOf(cerc20ProxyOperator.address))
      const proxyCusdcBalanceBefore = new BigNumber(await cusdc.balanceOf(cerc20ProxyOperator.address))

      await usdc.approve(cerc20ProxyOperator.address, underlyingAssetDeposit)

      const actionArgsAccountOwner2 = [
        {
          actionType: ActionType.OpenVault,
          owner: user,
          secondAddress: user,
          asset: ZERO_ADDR,
          vaultId: 1,
          amount: '0',
          index: '0',
          data: ZERO_ADDR,
        },
        {
          actionType: ActionType.MintShortOption,
          owner: user,
          secondAddress: user,
          asset: ethCusdcPut.address,
          vaultId: 1,
          amount: oTokenAmount,
          index: '0',
          data: ZERO_ADDR,
        },
        {
          actionType: ActionType.DepositCollateral,
          owner: user,
          secondAddress: user,
          asset: usdc.address,
          vaultId: 1,
          amount: 0,
          index: '0',
          data: ZERO_ADDR,
        },
      ]
      const receipt = await cerc20ProxyOperator.operate(
        actionArgsAccountOwner2,
        usdc.address,
        cusdc.address,
        underlyingAssetDeposit,
        {from: user},
      )

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
        userUsdcBalanceBefore.toString(),
        userUsdcBalanceAfter.plus(underlyingAssetDeposit).toString(),
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
  })
})
