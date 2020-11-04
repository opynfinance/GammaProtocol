// mainnet fork test
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
  CTokenProxyInstance,
  OracleInstance,
  ComptrollerInstance,
} from '../../build/types/truffle-types'
import {createTokenAmount, createValidExpiry} from '../utils'
const {time} = require('@openzeppelin/test-helpers')

const ERC20 = artifacts.require('MockERC20')
const WETH = artifacts.require('WETH9')
const Controller = artifacts.require('Controller')
const Comptroller = artifacts.require('Comptroller')
const CTokenProxy = artifacts.require('CTokenProxy')
const AddressBook = artifacts.require('AddressBook.sol')
const Oracle = artifacts.require('Oracle.sol')
const Otoken = artifacts.require('Otoken.sol')
const CTokenInterface = artifacts.require('CTokenInterface')
const MarginCalculator = artifacts.require('MarginCalculator.sol')
const Whitelist = artifacts.require('Whitelist.sol')
const MarginPool = artifacts.require('MarginPool.sol')
const MarginVault = artifacts.require('MarginVault.sol')
const OTokenFactory = artifacts.require('OtokenFactory.sol')

const USDCPricer = artifacts.require('USDCPricer.sol')
const CompoundPricer = artifacts.require('CompoundPricer.sol')

// unlock this address to get its USDC
const usdcWhale = '0xbe0eb53f46cd790cd13851d5eff43d12404d33e8'

const USDCAddress = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
const cUSDCAddress = '0x39aa39c021dfbae8fac545936693ac917d5e7563'
const WETHAddress = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
const ComptrollerAddress = '0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b'
const COMPAddress = '0xc00e94cb662c3520282e6f5717214004a7f26888'
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
  // let exchange: IZeroXExchangeInstance
  let usdc: MockERC20Instance
  let comp: MockERC20Instance
  let weth: WETH9Instance
  let cusdc: CTokenInterfaceInstance

  let comptroller: ComptrollerInstance

  let cTokenProxyOperator: CTokenProxyInstance

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

  let ethUsdPut: OtokenInstance
  let ethCusdcPut: OtokenInstance

  let usdcPricer: USDCPricerInstance
  let cusdcPricer: CompoundPricerInstance

  before('setup contracts', async () => {
    const now = (await time.latest()).toNumber()
    expiry = createValidExpiry(now, 300)

    usdc = await ERC20.at(USDCAddress)
    comp = await ERC20.at(COMPAddress)
    weth = await WETH.at(WETHAddress)
    cusdc = await CTokenInterface.at(cUSDCAddress)
    comptroller = await Comptroller.at(ComptrollerAddress)

    // initiate addressbook first.
    addressBook = await AddressBook.new()
    calculator = await MarginCalculator.new(addressBook.address)

    marginPool = await MarginPool.new(addressBook.address)
    const lib = await MarginVault.new()
    await Controller.link('MarginVault', lib.address)
    controllerImplementation = await Controller.new(addressBook.address)
    oracle = await Oracle.new(addressBook.address)

    usdcPricer = await USDCPricer.new(usdc.address, oracle.address)
    await oracle.setAssetPricer(usdc.address, usdcPricer.address)
    cusdcPricer = await CompoundPricer.new(cusdc.address, usdc.address, usdcPricer.address, oracle.address)
    await oracle.setAssetPricer(cusdc.address, cusdcPricer.address)

    whitelist = await Whitelist.new(addressBook.address)

    await whitelist.whitelistCollateral(USDCAddress)
    await whitelist.whitelistCollateral(cUSDCAddress)

    // whitelist eth-usdc and eth-cusdc puts.
    whitelist.whitelistProduct(weth.address, usdc.address, usdc.address, true)
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
    cTokenProxyOperator = await CTokenProxy.new(controllerProxyAddress, marginPool.address)

    // deploy usd collateral optoin
    await otokenFactory.createOtoken(weth.address, usdc.address, usdc.address, createTokenAmount(300), expiry, true)
    const usdcPutAddr = await otokenFactory.getOtoken(
      weth.address,
      usdc.address,
      usdc.address,
      createTokenAmount(300),
      expiry,
      true,
    )
    ethUsdPut = await Otoken.at(usdcPutAddr)

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

    // transfer USDC to user
    await usdc.transfer(user, createTokenAmount(200000, 6), {from: usdcWhale})
  })

  it('mint 100 usdc collateral option', async () => {
    const oTokenAmount = createTokenAmount(100)
    const collateralAmount = createTokenAmount(30000, 6)

    await usdc.approve(marginPool.address, collateralAmount)

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
        asset: ethUsdPut.address,
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
        amount: collateralAmount,
        index: '0',
        data: ZERO_ADDR,
      },
    ]
    // gasUsed 250755
    const receipt = await controllerProxy.operate(actionArgsAccountOwner2, {from: user})
    const gasUsed = receipt.receipt.gasUsed
    // eslint-disable-next-line
    console.log(`Gas cost for minting normal put option: ${gasUsed}`)
  })

  it('mint 100 cusdc collateral option', async () => {
    const usdcAmount = createTokenAmount(30001, 6)

    const oTokenAmount = createTokenAmount(100)

    // add operator
    await controllerProxy.setOperator(cTokenProxyOperator.address, true)
    // approve operator to move usdc
    await usdc.approve(cTokenProxyOperator.address, usdcAmount)

    const actionArg = [
      {
        actionType: ActionType.OpenVault,
        owner: user,
        secondAddress: ZERO_ADDR,
        asset: ZERO_ADDR,
        vaultId: 2,
        amount: '0',
        index: '0',
        data: ZERO_ADDR,
      },
      {
        actionType: ActionType.MintShortOption,
        owner: user,
        secondAddress: user, // mint to user's wallet
        asset: ethCusdcPut.address,
        vaultId: 2,
        amount: oTokenAmount,
        index: '0',
        data: ZERO_ADDR,
      },
      {
        actionType: ActionType.DepositCollateral,
        owner: user,
        secondAddress: cTokenProxyOperator.address,
        asset: cusdc.address,
        vaultId: 2,
        amount: 0, // the operator will overwrite this
        index: '0',
        data: ZERO_ADDR,
      },
    ]
    const receipt = await cTokenProxyOperator.operate(actionArg, USDCAddress, cUSDCAddress, usdcAmount, {from: user})
    const gasUsed = receipt.receipt.gasUsed
    // eslint-disable-next-line
    console.log(`Gas cost for minting cToken collateral option: ${gasUsed}`) // gasUsed 492645
  })

  it('should be able to claim some COMP in or marginPool', async () => {
    await time.increase(60 * 60 * 24 * 50)

    const poolCompBalanceBefore = await comp.balanceOf(marginPool.address)

    await comptroller.claimComp(marginPool.address)
    const poolCompBalanceAfter = await comp.balanceOf(marginPool.address)

    assert.isTrue(poolCompBalanceAfter.gt(poolCompBalanceBefore))
  })
})
