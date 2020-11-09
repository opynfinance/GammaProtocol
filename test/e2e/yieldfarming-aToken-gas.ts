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
  OracleInstance,
  ATokenProxyInstance,
  ATokenPricerInstance,
} from '../../build/types/truffle-types'
import {createTokenAmount, createValidExpiry} from '../utils'
const {time} = require('@openzeppelin/test-helpers')

const ERC20 = artifacts.require('MockERC20')
const WETH = artifacts.require('WETH9')
const Controller = artifacts.require('Controller')
const ATokenProxy = artifacts.require('ATokenProxy')
const AddressBook = artifacts.require('AddressBook.sol')
const Oracle = artifacts.require('Oracle.sol')
const Otoken = artifacts.require('Otoken.sol')
const ATokenInterface = artifacts.require('ATokenInterface')
const MarginCalculator = artifacts.require('MarginCalculator.sol')
const Whitelist = artifacts.require('Whitelist.sol')
const MarginPool = artifacts.require('MarginPool.sol')
const MarginVault = artifacts.require('MarginVault.sol')
const OTokenFactory = artifacts.require('OtokenFactory.sol')

const USDCPricer = artifacts.require('USDCPricer')
const ATokenPricer = artifacts.require('ATokenPricer')

// unlock this address to get its USDC
const usdcWhale = '0xbe0eb53f46cd790cd13851d5eff43d12404d33e8'

const USDCAddress = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
const aUSDCAddress = '0x9bA00D6856a4eDF4665BcA2C2309936572473B7E'
const WETHAddress = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
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

contract('AToken Proxy test', async ([user]) => {
  // let exchange: IZeroXExchangeInstance
  let usdc: MockERC20Instance
  let weth: WETH9Instance
  let ausdc: MockERC20Instance

  let aTokenProxyOperator: ATokenProxyInstance

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
  let ethAusdcPut: OtokenInstance

  let usdcPricer: USDCPricerInstance
  let ausdcPricer: ATokenPricerInstance

  before('setup contracts', async () => {
    const now = (await time.latest()).toNumber()
    expiry = createValidExpiry(now, 300) // 300 days from now

    usdc = await ERC20.at(USDCAddress)
    weth = await WETH.at(WETHAddress)
    ausdc = await ATokenInterface.at(aUSDCAddress)

    // initiate addressbook first.
    addressBook = await AddressBook.new()
    calculator = await MarginCalculator.new(addressBook.address)

    marginPool = await MarginPool.new(addressBook.address)
    const lib = await MarginVault.new()
    await Controller.link('MarginVault', lib.address)
    controllerImplementation = await Controller.new(addressBook.address)

    // setup pricers
    oracle = await Oracle.new(addressBook.address)
    usdcPricer = await USDCPricer.new(usdc.address, oracle.address)
    await oracle.setAssetPricer(usdc.address, usdcPricer.address)
    ausdcPricer = await ATokenPricer.new(ausdc.address, usdc.address, usdcPricer.address, oracle.address)
    await oracle.setAssetPricer(ausdc.address, ausdcPricer.address)

    whitelist = await Whitelist.new(addressBook.address)

    await whitelist.whitelistCollateral(USDCAddress)
    await whitelist.whitelistCollateral(aUSDCAddress)

    // whitelist eth-usdc and eth-cusdc puts.
    whitelist.whitelistProduct(weth.address, usdc.address, usdc.address, true)
    whitelist.whitelistProduct(weth.address, usdc.address, ausdc.address, true)
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

    // deploy operator contract
    aTokenProxyOperator = await ATokenProxy.new(controllerProxyAddress, marginPool.address)

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
    await otokenFactory.createOtoken(weth.address, usdc.address, ausdc.address, createTokenAmount(300), expiry, true)
    const cusdcPutAddr = await otokenFactory.getOtoken(
      weth.address,
      usdc.address,
      ausdc.address,
      createTokenAmount(300),
      expiry,
      true,
    )

    ethAusdcPut = await Otoken.at(cusdcPutAddr)

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
    // gasUsed 250827
    const receipt = await controllerProxy.operate(actionArgsAccountOwner2, {from: user})
    const gasUsed = receipt.receipt.gasUsed
    // eslint-disable-next-line
    console.log(`\tGas cost for minting normal put option: ${gasUsed}`)
  })

  it('mint 20000 ausdc collateral option', async () => {
    const usdcAmount = createTokenAmount(6000000, 6)

    const oTokenAmount = createTokenAmount(20000)

    // add operator
    await controllerProxy.setOperator(aTokenProxyOperator.address, true)
    // approve operator to move usdc
    await usdc.approve(aTokenProxyOperator.address, usdcAmount)

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
        asset: ethAusdcPut.address,
        vaultId: 2,
        amount: oTokenAmount,
        index: '0',
        data: ZERO_ADDR,
      },
      {
        actionType: ActionType.DepositCollateral,
        owner: user,
        secondAddress: aTokenProxyOperator.address,
        asset: ausdc.address,
        vaultId: 2,
        amount: usdcAmount,
        index: '0',
        data: ZERO_ADDR,
      },
    ]
    const receipt = await aTokenProxyOperator.operate(actionArg, USDCAddress, aUSDCAddress, usdcAmount, {from: user})
    const gasUsed = receipt.receipt.gasUsed
    // eslint-disable-next-line
    console.log(`\tGas cost for minting aToken collateral option: ${gasUsed}`) // gasUsed 925497
  })

  it('burn and withdraw ausdc collateral option', async () => {
    // const usdcAmount = createTokenAmount(6000003, 6)
    await time.increase(60 * 60 * 24 * 100)
    const oTokenAmount = createTokenAmount(20000)

    const oToken = await ERC20.at(ethAusdcPut.address)
    const amountATokenInVault = (await controllerProxy.getVault(user, 2)).collateralAmounts[0]
    await oToken.approve(marginPool.address, MAX_UINT256, {from: user})

    const actionArg = [
      {
        actionType: ActionType.BurnShortOption,
        owner: user,
        secondAddress: user, // mint to user's wallet
        asset: ethAusdcPut.address,
        vaultId: 2,
        amount: oTokenAmount,
        index: '0',
        data: ZERO_ADDR,
      },
      {
        actionType: ActionType.WithdrawCollateral,
        owner: user,
        secondAddress: aTokenProxyOperator.address,
        asset: ausdc.address,
        vaultId: 2,
        amount: amountATokenInVault,
        index: '0',
        data: ZERO_ADDR,
      },
    ]
    const receipt = await aTokenProxyOperator.operate(actionArg, USDCAddress, aUSDCAddress, 0, {from: user})
    const gasUsed = receipt.receipt.gasUsed
    // eslint-disable-next-line
    console.log(`\tGas cost for withdraw aToken collateral option: ${gasUsed}`) // gasUsed 312533
  })
})
