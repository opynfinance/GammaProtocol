import {
  MockERC20Instance,
  MarginCalculatorInstance,
  AddressBookInstance,
  MockOracleInstance,
  OtokenInstance,
  ControllerInstance,
  MockWhitelistModuleInstance,
  MarginPoolInstance,
} from '../build/types/truffle-types'
import {createVault, createScaledNumber} from './utils'
import {assert} from 'chai'
import BigNumber from 'bignumber.js'

const {expectRevert, time} = require('@openzeppelin/test-helpers')
const AddressBook = artifacts.require('AddressBook.sol')
const MockOracle = artifacts.require('MockOracle.sol')
const Otoken = artifacts.require('Otoken.sol')
const MockERC20 = artifacts.require('MockERC20.sol')
const MarginCalculator = artifacts.require('MarginCalculator.sol')
const MockWhitelist = artifacts.require('MockWhitelistModule.sol')
const MarginPool = artifacts.require('MarginPool.sol')
const Controller = artifacts.require('Controller.sol')
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

contract(
  'MarginCalculator + Controller + MarginPool + AddressBook',
  ([admin, accountOwner1, accountOperator1, random]) => {
    let expiry: number

    let addressBook: AddressBookInstance
    let calculator: MarginCalculatorInstance
    let controller: ControllerInstance
    let marginPool: MarginPoolInstance

    // whitelist module mock
    let whitelist: MockWhitelistModuleInstance
    // oracle modulce mock
    let oracle: MockOracleInstance

    let usdc: MockERC20Instance
    let dai: MockERC20Instance
    let weth: MockERC20Instance

    before('set up contracts', async () => {
      const now = (await time.latest()).toNumber()
      expiry = now + time.duration.days(30).toNumber()

      // initiate addressbook first.
      addressBook = await AddressBook.new()
      // setup calculator
      calculator = await MarginCalculator.new()
      await calculator.init(addressBook.address)
      // setup margin pool
      marginPool = await MarginPool.new(addressBook.address)
      // setup controller module
      controller = await Controller.new(addressBook.address)
      // setup mock Oracle module
      oracle = await MockOracle.new(addressBook.address)
      // setup mock whitelist module
      whitelist = await MockWhitelist.new()

      // setup usdc and weth
      usdc = await MockERC20.new('USDC', 'USDC')
      dai = await MockERC20.new('DAI', 'DAI')
      weth = await MockERC20.new('WETH', 'WETH')

      // TODO: setup address book
      //   await addressBook.setOracle(oracle.address)
      //   await addressBook.setController(controller.address)
      //   await addressBook.setMarginCalculator(calculator.address)
      //   await addressBook.setWhitelist(whitelist.address)
      await addressBook.setMarginPool(marginPool.address)
    })

    describe('Integration test: Sell a naked short put and close it before expiry', () => {
      let ethPut: OtokenInstance
      const strikePrice = 300

      const collateralToDeposit = 3000
      const optionsToMint = collateralToDeposit / strikePrice

      before('setup the naked put option', async () => {
        ethPut = await Otoken.new(addressBook.address)
        await ethPut.init(weth.address, usdc.address, usdc.address, createScaledNumber(strikePrice), expiry, true)
        // mint usdc to user
        usdc.mint(accountOwner1, createScaledNumber(collateralToDeposit))
      })

      it('Seller should be able to open a short put option', async () => {
        const vaultCounterBefore = new BigNumber(await controller.getAccountVaultCounter(accountOwner1))
        const vaultCounter = vaultCounterBefore.toNumber() + 1

        // Keep track of balances before
        const ownerUsdcBalanceBefore = await usdc.balanceOf(accountOwner1)
        const marginPoolUsdcBalanceBefore = await usdc.balanceOf(marginPool.address)
        const ownerOtokenBalanceBefore = await ethPut.balanceOf(accountOwner1)
        const marginPoolOtokenSupplyBefore = await ethPut.totalSupply()

        // Check that we start at a valid state
        //   const vaultBefore = await controller.getVault(accountOwner1, vaultCounter)
        //   const isVaultStateBeforeValid = await calculator.getExcessMargin(acco)

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
            actionType: ActionType.DepositCollateral,
            owner: accountOwner1,
            sender: accountOwner1,
            asset: usdc.address,
            vaultId: vaultCounter,
            amount: createScaledNumber(collateralToDeposit),
            index: '0',
            data: ZERO_ADDR,
          },
          {
            actionType: ActionType.MintShortOption,
            owner: accountOwner1,
            sender: accountOwner1,
            asset: ethPut.address,
            vaultId: vaultCounter,
            amount: createScaledNumber(optionsToMint),
            index: '0',
            data: ZERO_ADDR,
          },
        ]

        await controller.operate(actionArgs, {from: accountOwner1})

        // keep track of balances after
        const ownerUsdcBalanceAfter = await usdc.balanceOf(accountOwner1)
        const marginPoolUsdcBalanceAfter = await usdc.balanceOf(marginPool.address)

        const ownerOtokenBalanceAfter = await ethPut.balanceOf(accountOwner1)
        const marginPoolOtokenSupplyAfter = await ethPut.totalSupply()

        // check balances before and after changed as expected
        assert.equal(
          ownerUsdcBalanceBefore.minus(createScaledNumber(collateralToDeposit)).toString(),
          ownerUsdcBalanceAfter.toString(),
        )
        assert.equal(
          marginPoolUsdcBalanceBefore.plus(createScaledNumber(collateralToDeposit)).toString(),
          marginPoolUsdcBalanceAfter.toString(),
        )
        assert.equal(
          ownerOtokenBalanceBefore.plus(createScaledNumber(optionsToMint)).toString(),
          ownerOtokenBalanceAfter.toString(),
        )
        assert.equal(
          marginPoolOtokenSupplyBefore.plus(createScaledNumber(optionsToMint)).toString(),
          marginPoolOtokenSupplyAfter.toString(),
        )
      })
    })
  },
)
