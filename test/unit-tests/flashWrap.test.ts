import {
  MarginCalculatorInstance,
  MockOracleInstance,
  MockWhitelistModuleInstance,
  MarginPoolInstance,
  ControllerInstance,
  AddressBookInstance,
  OwnedUpgradeabilityProxyInstance,
  WETH9Instance,
  FlashWrapInstance,
} from '../../build/types/truffle-types'
import BigNumber from 'bignumber.js'

const MockOracle = artifacts.require('MockOracle.sol')
const OwnedUpgradeabilityProxy = artifacts.require('OwnedUpgradeabilityProxy.sol')
const MarginCalculator = artifacts.require('MarginCalculator.sol')
const MockWhitelistModule = artifacts.require('MockWhitelistModule.sol')
const AddressBook = artifacts.require('AddressBook.sol')
const MarginPool = artifacts.require('MarginPool.sol')
const Controller = artifacts.require('Controller.sol')
const MarginAccount = artifacts.require('MarginAccount.sol')
const WETH9 = artifacts.require('WETH9.sol')
const FlashWrap = artifacts.require('FlashWrap.sol')

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
  Exercise,
  Call,
}

contract('Controller', ([owner, accountOwner1, accountOwner2, accountOperator1, holder1, terminator, random]) => {
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
  let flashWrap: FlashWrapInstance

  before('Deployment', async () => {
    // addressbook deployment
    addressBook = await AddressBook.new()
    // deploy Oracle module
    oracle = await MockOracle.new(addressBook.address, {from: owner})
    // calculator deployment
    calculator = await MarginCalculator.new(addressBook.address)
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
    const lib = await MarginAccount.new()
    await Controller.link('MarginAccount', lib.address)
    controllerImplementation = await Controller.new()

    // set controller address in AddressBook
    await addressBook.setController(controllerImplementation.address, {from: owner})

    // check controller deployment
    const controllerProxyAddress = await addressBook.getController()
    controllerProxy = await Controller.at(controllerProxyAddress)
    const proxy: OwnedUpgradeabilityProxyInstance = await OwnedUpgradeabilityProxy.at(controllerProxyAddress)

    assert.equal(await proxy.proxyOwner(), addressBook.address, 'Proxy owner address mismatch')
    assert.equal(await controllerProxy.owner(), owner, 'Controller owner address mismatch')
    assert.equal(await controllerProxy.systemPaused(), false, 'System is paused')

    // deploy WETH token
    weth = await WETH9.new()
    // deploy flash wrapper
    flashWrap = await FlashWrap.new(weth.address)
  })

  describe('Wrap ETH', () => {
    it('should wrap ETH to WETH', async () => {
      const amountToWrap = new BigNumber(web3.utils.toWei('2', 'ether'))
      const actionArgs = [
        {
          actionType: ActionType.Call,
          owner: ZERO_ADDR,
          sender: flashWrap.address,
          asset: ZERO_ADDR,
          vaultId: '0',
          amount: amountToWrap.toString(),
          index: '0',
          data: ZERO_ADDR,
        },
      ]

      const senderWethBalanceBefore = new BigNumber(await weth.balanceOf(accountOwner1))
      const contractWethBalanceBefore = new BigNumber(await weth.balanceOf(flashWrap.address))

      await controllerProxy.operate(actionArgs, {from: accountOwner1, value: web3.utils.toWei('2', 'ether')})

      const senderWethBalanceAfter = new BigNumber(await weth.balanceOf(accountOwner1))
      const contractWethBalanceAfter = new BigNumber(await weth.balanceOf(flashWrap.address))

      assert.equal(
        contractWethBalanceBefore.toString(),
        contractWethBalanceAfter.toString(),
        'Flash swap contract WETH balance mismatch',
      )
      assert.equal(
        senderWethBalanceAfter.minus(senderWethBalanceBefore).toString(),
        amountToWrap.toString(),
        'sender WETH balance mismatch',
      )
    })
  })
})
