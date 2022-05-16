import {
  MarginCalculatorInstance,
  MockOracleInstance,
  MockWhitelistModuleInstance,
  MarginPoolInstance,
  ControllerInstance,
  AddressBookInstance,
  OwnedUpgradeabilityProxyInstance,
  WETH9Instance,
  FlashUnwrapInstance,
} from '../../build/types/truffle-types'
import BigNumber from 'bignumber.js'
const { expectRevert } = require('@openzeppelin/test-helpers')
const MockOracle = artifacts.require('MockOracle.sol')
const OwnedUpgradeabilityProxy = artifacts.require('OwnedUpgradeabilityProxy.sol')
const MarginCalculator = artifacts.require('MarginCalculator.sol')
const MockWhitelistModule = artifacts.require('MockWhitelistModule.sol')
const AddressBook = artifacts.require('AddressBook.sol')
const MarginPool = artifacts.require('MarginPool.sol')
const Controller = artifacts.require('Controller.sol')
const MarginVault = artifacts.require('MarginVault.sol')
const WETH9 = artifacts.require('WETH9.sol')
const FlashUnwrap = artifacts.require('FlashUnwrap.sol')

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
}

contract('FlashUnwrap', ([owner, accountOwner1]) => {
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
  // WETH token
  let weth: WETH9Instance
  // ETH wrapper contract
  let flashUnwrap: FlashUnwrapInstance

  before('Deployment', async () => {
    // addressbook deployment
    addressBook = await AddressBook.new()
    // deploy Oracle module
    oracle = await MockOracle.new(addressBook.address, { from: owner })
    // calculator deployment
    calculator = await MarginCalculator.new(oracle.address, addressBook.address)
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
    await addressBook.setController(controllerImplementation.address, { from: owner })

    // check controller deployment
    const controllerProxyAddress = await addressBook.getController()
    controllerProxy = await Controller.at(controllerProxyAddress)
    const proxy: OwnedUpgradeabilityProxyInstance = await OwnedUpgradeabilityProxy.at(controllerProxyAddress)

    assert.equal(await proxy.proxyOwner(), addressBook.address, 'Proxy owner address mismatch')
    assert.equal(await controllerProxy.owner(), owner, 'Controller owner address mismatch')
    assert.equal(await controllerProxy.systemPartiallyPaused(), false, 'system is partially paused')

    // deploy WETH token
    weth = await WETH9.new()
    // deploy flash wrapper
    flashUnwrap = await FlashUnwrap.new(weth.address)
  })

  describe('Unwrap ETH', () => {
    before(async () => {
      await weth.deposit({ value: web3.utils.toWei('5', 'ether'), from: accountOwner1 })

      assert.equal(await weth.balanceOf(accountOwner1), web3.utils.toWei('5', 'ether'), 'WETH balance mismatch')

      await whitelist.whitelistCallee(flashUnwrap.address, { from: owner })
    })

    it('should swap WETH to receiver address', async () => {
      const amountToUnwrap = web3.utils.toWei('3', 'ether')
      const data = web3.eth.abi.encodeParameter(
        {
          CallFunctionData: {
            amount: 'uint256',
          },
        },
        {
          amount: amountToUnwrap,
        },
      )

      const actionArgs = [
        {
          actionType: ActionType.Call,
          owner: ZERO_ADDR,
          secondAddress: flashUnwrap.address,
          asset: ZERO_ADDR,
          vaultId: '0',
          amount: '0',
          index: '0',
          data: data,
        },
      ]

      const senderWethBalanceBefore = new BigNumber(await weth.balanceOf(accountOwner1))
      const contractWethBalanceBefore = new BigNumber(await weth.balanceOf(flashUnwrap.address))

      await weth.approve(flashUnwrap.address, amountToUnwrap, { from: accountOwner1 })
      await controllerProxy.operate(actionArgs, { from: accountOwner1 })

      const senderWethBalanceAfter = new BigNumber(await weth.balanceOf(accountOwner1))
      const contractWethBalanceAfter = new BigNumber(await weth.balanceOf(flashUnwrap.address))

      assert.equal(
        contractWethBalanceBefore.toString(),
        contractWethBalanceAfter.toString(),
        'Flash swap contract WETH balance mismatch',
      )
      assert.equal(
        senderWethBalanceBefore.minus(senderWethBalanceAfter).toString(),
        amountToUnwrap.toString(),
        'sender WETH balance mismatch',
      )
    })

    it('should revert sending data with different length than the required one', async () => {
      const amountToUnwrap = web3.utils.toWei('3', 'ether')
      const data = web3.eth.abi.encodeParameter(
        {
          CallFunctionData: {
            amount: 'uint256',
            other: 'uint256',
          },
        },
        {
          amount: amountToUnwrap,
          other: 100,
        },
      )

      const actionArgs = [
        {
          actionType: ActionType.Call,
          owner: ZERO_ADDR,
          secondAddress: flashUnwrap.address,
          asset: ZERO_ADDR,
          vaultId: '0',
          amount: '0',
          index: '0',
          data: data,
        },
      ]

      await weth.approve(flashUnwrap.address, amountToUnwrap, { from: accountOwner1 })
      await expectRevert(
        controllerProxy.operate(actionArgs, { from: accountOwner1 }),
        'FlashUnwrap: cannot parse CallFunctionData',
      )
    })
  })
})
