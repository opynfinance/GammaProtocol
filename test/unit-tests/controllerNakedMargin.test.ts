import {
  MarginCalculatorInstance,
  MockERC20Instance,
  MockOracleInstance,
  MockWhitelistModuleInstance,
  MarginPoolInstance,
  ControllerInstance,
  AddressBookInstance,
  OwnedUpgradeabilityProxyInstance,
} from '../../build/types/truffle-types'
import BigNumber from 'bignumber.js'
import {
  createScaledNumber as scaleNum,
  createScaledBigNumber as scaleBigNum,
  createScaledNumber,
  createTokenAmount,
} from '../utils'

const {expectRevert, time} = require('@openzeppelin/test-helpers')

const CallTester = artifacts.require('CallTester.sol')
const MockERC20 = artifacts.require('MockERC20.sol')
const MockOtoken = artifacts.require('MockOtoken.sol')
const MockOracle = artifacts.require('MockOracle.sol')
const OwnedUpgradeabilityProxy = artifacts.require('OwnedUpgradeabilityProxy.sol')
const MarginCalculator = artifacts.require('MarginCalculator.sol')
const MockWhitelistModule = artifacts.require('MockWhitelistModule.sol')
const AddressBook = artifacts.require('AddressBook.sol')
const MarginPool = artifacts.require('MarginPool.sol')
const Controller = artifacts.require('Controller.sol')
const MarginVault = artifacts.require('MarginVault.sol')

// address(0)
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
  InvalidAction,
}

contract('Controller', ([owner, accountOwner1]) => {
  // ERC20 mock
  let usdc: MockERC20Instance
  let weth: MockERC20Instance
  let weth2: MockERC20Instance
  // Oracle module
  let oracle: MockOracleInstance
  // calculator module
  let calculator: MarginCalculatorInstance
  // margin pool module
  let marginPool: MarginPoolInstance
  // whitelist module mock
  let whitelist: MockWhitelistModuleInstance
  // addressbook module mock
  let addressBook: AddressBookInstance
  // controller module
  let controllerImplementation: ControllerInstance
  let controllerProxy: ControllerInstance

  const usdcDecimals = 6
  const wethDecimals = 18

  before('Deployment', async () => {
    // addressbook deployment
    addressBook = await AddressBook.new()
    // ERC20 deployment
    usdc = await MockERC20.new('USDC', 'USDC', usdcDecimals)
    weth = await MockERC20.new('WETH', 'WETH', wethDecimals)
    weth2 = await MockERC20.new('WETH', 'WETH', wethDecimals)
    // deploy Oracle module
    oracle = await MockOracle.new(addressBook.address, {from: owner})
    // calculator deployment
    calculator = await MarginCalculator.new(oracle.address)
    // margin pool deployment
    marginPool = await MarginPool.new(addressBook.address)
    // whitelist module
    whitelist = await MockWhitelistModule.new()
    // set margin pool in addressbook
    await addressBook.setMarginPool(marginPool.address)
    // set calculator in addressbook
    await addressBook.setMarginCalculator(calculator.address)
    // set oracle in AddressBook
    await addressBook.setOracle(oracle.address)
    // set whitelist module address
    await addressBook.setWhitelist(whitelist.address)
    // deploy Controller module
    const lib = await MarginVault.new()
    await Controller.link('MarginVault', lib.address)
    controllerImplementation = await Controller.new()

    // set controller address in AddressBook
    await addressBook.setController(controllerImplementation.address, {from: owner})

    // check controller deployment
    const controllerProxyAddress = await addressBook.getController()
    controllerProxy = await Controller.at(controllerProxyAddress)
    const proxy: OwnedUpgradeabilityProxyInstance = await OwnedUpgradeabilityProxy.at(controllerProxyAddress)

    assert.equal(await proxy.proxyOwner(), addressBook.address, 'Proxy owner address mismatch')
    assert.equal(await controllerProxy.owner(), owner, 'Controller owner address mismatch')
    assert.equal(await controllerProxy.systemPartiallyPaused(), false, 'system is partially paused')

    // make everyone rich
    await usdc.mint(accountOwner1, createTokenAmount(10000, usdcDecimals))
  })

  describe('settle naked margin vault', async () => {
    const productSpotShockValue = scaleBigNum(0.75, 27)
    // array of time to expiry
    const day = 60 * 24
    const timeToExpiry = [day * 7, day * 14, day * 28, day * 42, day * 56]
    // array of upper bound value correspond to time to expiry
    const expiryToValue = [
      scaleNum(0.1678, 27),
      scaleNum(0.237, 27),
      scaleNum(0.3326, 27),
      scaleNum(0.4032, 27),
      scaleNum(0.4603, 27),
    ]

    before('Set calculator configs, open position, and set time past expiry', async () => {
      // set product spot shock value
      await calculator.setSpotShock(weth.address, usdc.address, usdc.address, true, productSpotShockValue)

      // set time to expiry and each upper bound value
      for (let i = 0; i < expiryToValue.length; i++) {
        // set for put product
        await calculator.setTimeToExpiryValue(
          weth.address,
          usdc.address,
          usdc.address,
          true,
          timeToExpiry[i],
          expiryToValue[i],
          {from: owner},
        )
        await calculator.setProductTimeToExpiry(weth.address, usdc.address, usdc.address, true, timeToExpiry[i], {
          from: owner,
        })
      }

      const shortAmount = 1
      const shortStrike = 100
      const underlyingPrice = 150
      const scaledUnderlyingPrice = scaleBigNum(underlyingPrice, 8)
      const isPut = true
      const optionExpiry = new BigNumber(await time.latest()).plus(timeToExpiry[0])

      const shortOtoken = await MockOtoken.new()
      await shortOtoken.init(
        addressBook.address,
        weth.address,
        usdc.address,
        usdc.address,
        scaleNum(shortStrike),
        optionExpiry,
        isPut,
      )
      // whitelist otoken
      await whitelist.whitelistOtoken(shortOtoken.address)
      // whitelist collateral
      await whitelist.whitelistCollateral(usdc.address)
      // set underlying price in oracle
      await oracle.setRealTimePrice(weth.address, scaledUnderlyingPrice)

      // open position
      const vaultCounter = new BigNumber(await controllerProxy.getAccountVaultCounter(accountOwner1)).plus(1)
      const vaultType = web3.eth.abi.encodeParameter('uint256', 1)
      // const collateralAmount = createTokenAmount(shortStrike, usdcDecimals)
      const collateralAmount = await calculator.getNakedMarginRequired(
        weth.address,
        usdc.address,
        usdc.address,
        createTokenAmount(shortAmount),
        createTokenAmount(shortStrike),
        scaledUnderlyingPrice,
        optionExpiry,
        usdcDecimals,
        isPut,
      )

      const mintArgs = [
        {
          actionType: ActionType.OpenVault,
          owner: accountOwner1,
          secondAddress: accountOwner1,
          asset: ZERO_ADDR,
          vaultId: vaultCounter.toNumber(),
          amount: '0',
          index: '0',
          data: vaultType,
        },
        {
          actionType: ActionType.MintShortOption,
          owner: accountOwner1,
          secondAddress: accountOwner1,
          asset: shortOtoken.address,
          vaultId: vaultCounter.toNumber(),
          amount: createTokenAmount(shortAmount),
          index: '0',
          data: ZERO_ADDR,
        },
        {
          actionType: ActionType.DepositCollateral,
          owner: accountOwner1,
          secondAddress: accountOwner1,
          asset: usdc.address,
          vaultId: vaultCounter.toNumber(),
          amount: collateralAmount.toString(),
          index: '0',
          data: ZERO_ADDR,
        },
      ]
      await usdc.approve(marginPool.address, collateralAmount.toString(), {from: accountOwner1})
      await controllerProxy.operate(mintArgs, {from: accountOwner1})

      // go to expiry
      await time.increaseTo(optionExpiry.toNumber() + 10)
      const ethPriceAtExpiry = 70
      await oracle.setExpiryPriceFinalizedAllPeiodOver(usdc.address, optionExpiry, createScaledNumber(1), true)
      await oracle.setExpiryPriceFinalizedAllPeiodOver(
        weth.address,
        optionExpiry,
        createScaledNumber(ethPriceAtExpiry),
        true,
      )
    })

    it('should revert settling an expired undercollateralized naked margin vault', async () => {
      const vaultCounter = new BigNumber(await controllerProxy.getAccountVaultCounter(accountOwner1))

      // settle the secont vault (with only long otoken in it)
      const settleArgs = [
        {
          actionType: ActionType.SettleVault,
          owner: accountOwner1,
          secondAddress: accountOwner1,
          asset: ZERO_ADDR,
          vaultId: vaultCounter.toNumber(),
          amount: '0',
          index: '0',
          data: ZERO_ADDR,
        },
      ]

      await expectRevert(
        controllerProxy.operate(settleArgs, {from: accountOwner1}),
        'Controller: can not settle undercollateralized vault',
      )
    })
  })
})
