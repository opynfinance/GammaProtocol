// mainnet fork test
import {
  MockERC20Instance,
  WETH9Instance,
  ControllerInstance,
  USDCPricerInstance,
  AddressBookInstance,
  MarginCalculatorInstance,
  MarginPoolInstance,
  WhitelistInstance,
  OtokenInstance,
  OtokenFactoryInstance,
  YTokenProxyInstance,
  OracleInstance,
  YTokenInterfaceInstance,
  YTokenPricerInstance,
} from '../../build/types/truffle-types'
import BigNumber from 'bignumber.js'
import {createTokenAmount, createValidExpiry} from '../utils'
const {time} = require('@openzeppelin/test-helpers')

const ERC20 = artifacts.require('MockERC20')
const WETH = artifacts.require('WETH9')
const Controller = artifacts.require('Controller')
const YTokenProxy = artifacts.require('YTokenProxy')
const AddressBook = artifacts.require('AddressBook.sol')
const Oracle = artifacts.require('Oracle.sol')
const Otoken = artifacts.require('Otoken.sol')
const YTokenInterface = artifacts.require('YTokenInterface')
const MarginCalculator = artifacts.require('MarginCalculator.sol')
const Whitelist = artifacts.require('Whitelist.sol')
const MarginPool = artifacts.require('MarginPool.sol')
const MarginVault = artifacts.require('MarginVault.sol')
const OTokenFactory = artifacts.require('OtokenFactory.sol')

const USDCPricer = artifacts.require('USDCPricer')
const YTokenPricer = artifacts.require('YTokenPricer')

// unlock this address to get its USDC
const usdcWhale = '0xbe0eb53f46cd790cd13851d5eff43d12404d33e8'

const USDCAddress = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
const yUSDCAddress = '0xd6ad7a6750a7593e092a9b218d66c0a814a3436e'
const WETHAddress = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
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

contract('YToken Proxy test', async ([user]) => {
  // let exchange: IZeroXExchangeInstance
  let usdc: MockERC20Instance
  let weth: WETH9Instance
  let yusdc: YTokenInterfaceInstance

  let yTokenProxyOperator: YTokenProxyInstance

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
  let yusdcPricer: YTokenPricerInstance

  before('setup contracts', async () => {
    const now = (await time.latest()).toNumber()
    expiry = createValidExpiry(now, 300) // 300 days from now

    usdc = await ERC20.at(USDCAddress)
    weth = await WETH.at(WETHAddress)
    yusdc = await YTokenInterface.at(yUSDCAddress)

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
    yusdcPricer = await YTokenPricer.new(yusdc.address, usdc.address, usdcPricer.address, oracle.address)
    await oracle.setAssetPricer(yusdc.address, yusdcPricer.address)

    whitelist = await Whitelist.new(addressBook.address)

    await whitelist.whitelistCollateral(USDCAddress)
    await whitelist.whitelistCollateral(yUSDCAddress)

    // whitelist eth-usdc and eth-yusdc puts.
    whitelist.whitelistProduct(weth.address, usdc.address, usdc.address, true)
    whitelist.whitelistProduct(weth.address, usdc.address, yusdc.address, true)
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

    // deploy proxy (operator)
    yTokenProxyOperator = await YTokenProxy.new(controllerProxyAddress, marginPool.address)

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

    // deploy yusdc collateral option
    await otokenFactory.createOtoken(weth.address, usdc.address, yusdc.address, createTokenAmount(300), expiry, true)
    const yusdcPutAddr = await otokenFactory.getOtoken(
      weth.address,
      usdc.address,
      yusdc.address,
      createTokenAmount(300),
      expiry,
      true,
    )

    ethCusdcPut = await Otoken.at(yusdcPutAddr)

    // transfer USDC to user
    await usdc.transfer(user, createTokenAmount(20000000, 6), {from: usdcWhale})
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
    console.log(`\tGas cost for minting normal put option: ${gasUsed}`)
  })

  it('mint 20000 yusdc collateral option', async () => {
    const usdcAmount = createTokenAmount(6000003, 6)

    const oTokenAmount = createTokenAmount(20000)

    // add operator
    await controllerProxy.setOperator(yTokenProxyOperator.address, true)
    // approve operator to move usdc
    await usdc.approve(yTokenProxyOperator.address, usdcAmount)

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
        secondAddress: yTokenProxyOperator.address,
        asset: yusdc.address,
        vaultId: 2,
        amount: 0, // the operator will overwrite this
        index: '0',
        data: ZERO_ADDR,
      },
    ]
    const receipt = await yTokenProxyOperator.operate(actionArg, USDCAddress, yUSDCAddress, usdcAmount, {from: user})
    const gasUsed = receipt.receipt.gasUsed
    // eslint-disable-next-line
    console.log(`\tGas cost for minting yToken collateral option: ${gasUsed}`) // gasUsed 480373
  })
})
