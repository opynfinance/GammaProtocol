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
  MockCTokenInstance,
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
const MockCtoken = artifacts.require('MockCToken.sol')

//unlock this address to get its USDC
const usdcWhale = '0xbe0eb53f46cd790cd13851d5eff43d12404d33e8'

const WETHAddress = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
const USDCAddress = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
const cUSDCAddress = '0x39aa39c021dfbae8fac545936693ac917d5e7563'
const cETHAddress = '0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5'
const ZERO_ADDR = '0x0000000000000000000000000000000000000000'
const MAX_UINT256 = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'

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
  // let exchange: IZeroXExchangeInstance
  let usdc: MockERC20Instance
  //let comp: MockERC20Instance
  let weth: WETH9Instance
  let cusdc: CERC20InterfaceInstance
  let ceth: CETHInterfaceInstance

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

  let usdcPricer: USDCPricerInstance
  let wethPricer: ChainLinkPricerInstance
  let cusdcPricer: CompoundPricerInstance
  let cethPricer: CompoundPricerInstance

  let wethAggregator: MockChainlinkAggregatorInstance

  before('setup contracts', async () => {
    const now = (await time.latest()).toNumber()
    expiry = createValidExpiry(now, 300) // 300 days from now

    usdc = await ERC20.at(USDCAddress)
    weth = await WETH.at(WETHAddress)
    cusdc = await CERC20Interface.at(cUSDCAddress)
    ceth = await CETHInterface.at(cETHAddress)

    // initiate addressbook first.
    addressBook = await AddressBook.new()
    calculator = await MarginCalculator.new(addressBook.address)

    marginPool = await MarginPool.new(addressBook.address)
    const lib = await MarginVault.new()
    await Controller.link('MarginVault', lib.address)
    controllerImplementation = await Controller.new(addressBook.address)
    oracle = await Oracle.new(addressBook.address)

    wethAggregator = await MockChainlinkAggregator.new()

    usdcPricer = await USDCPricer.new(usdc.address, oracle.address)
    await oracle.setAssetPricer(usdc.address, usdcPricer.address)
    wethPricer = await ChainlinkPricer.new(weth.address, wethAggregator.address, oracle.address)
    await oracle.setAssetPricer(weth.address, wethPricer.address)
    cusdcPricer = await CompoundPricer.new(cusdc.address, usdc.address, usdcPricer.address, oracle.address)
    await oracle.setAssetPricer(cusdc.address, cusdcPricer.address)
    cethPricer = await CompoundPricer.new(ceth.address, weth.address, wethPricer.address, oracle.address)
    await oracle.setAssetPricer(weth.address, cethPricer.address)

    const lockingPeriod = time.duration.minutes(15).toNumber()
    const disputePeriod = time.duration.minutes(15).toNumber()

    await oracle.setLockingPeriod(wethPricer.address, lockingPeriod)
    await oracle.setDisputePeriod(wethPricer.address, disputePeriod)
    await oracle.setLockingPeriod(usdcPricer.address, lockingPeriod)
    await oracle.setDisputePeriod(usdcPricer.address, disputePeriod)
    await oracle.setLockingPeriod(cethPricer.address, lockingPeriod)
    await oracle.setDisputePeriod(cethPricer.address, disputePeriod)
    await oracle.setLockingPeriod(cusdcPricer.address, lockingPeriod)
    await oracle.setDisputePeriod(cusdcPricer.address, disputePeriod)

    whitelist = await Whitelist.new(addressBook.address)

    await whitelist.whitelistCollateral(USDCAddress)
    await whitelist.whitelistCollateral(cUSDCAddress)

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
    cethProxyOperator = await CETHProxy.new(controllerProxyAddress, marginPool.address)

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

    //transfer USDC to user
    await usdc.transfer(user, createTokenAmount(20000000, 6), {from: usdcWhale})

    // set up cUSDC/cETH fx rates
    const cusdcPrice = 0.02
    const cethPrice = 0.02
    const scaledCusdcPrice = createTokenAmount(cusdcPrice, 16) // 1 cToken = 0.02 USD
    const scaledCethPrice = createTokenAmount(cethPrice, 16) // 1 cToken = 0.05 USD

    const usdPrice = createTokenAmount(1)
    await usdcPricer.setPrice(usdPrice)
    await cusdc.setExchangeRate(scaledCusdcPrice)

    cusdcCollateralAmount = new BigNumber(usdcCollateralAmount).div(cusdcPrice)
    const scaledCollateralAmount = createTokenAmount(cusdcCollateralAmount.toNumber(), cusdcDecimals)
    cusdc.mint(accountOwner1, scaledCollateralAmount)
    cusdc.approve(marginPool.address, scaledCollateralAmount, {from: accountOwner1})

    const vaultCounterBefore = new BigNumber(await controllerProxy.getAccountVaultCounter(accountOwner1))
    vaultCounter = vaultCounterBefore.plus(1).toNumber()
  })

  describe('Mint actions', () => {
    it('mint 100 ethusdc-cusdc 300 strike put option by depositing 30000 USDC', async () => {
      const oTokenAmount = createTokenAmount(100)
      const collateralAmount = createTokenAmount(30000, 6)

      const ownerCusdcBalanceBefore = new BigNumber(await cusdc.balanceOf(user))
      const marginPoolCusdcBalanceBefore = new BigNumber(await cusdc.balanceOf(marginPool.address))
      const ownerUsdcBalanceBefore = new BigNumber(await usdc.balanceOf(user))
      const marginPoolUsdcBalanceBefore = new BigNumber(await usdc.balanceOf(marginPool.address))
      const ownerUsdcBalanceBefore = new BigNumber(await usdc.balanceOf(user))
      const marginPoolUsdcBalanceBefore = new BigNumber(await usdc.balanceOf(marginPool.address))

      await usdc.approve(cerc20ProxyOperator.address, collateralAmount)

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
        collateralAmount,
        {from: user},
      )
    })
  })
})
