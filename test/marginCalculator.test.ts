import BigNumber from 'bignumber.js'
import {
  MockERC20Instance,
  MarginCalculatorInstance,
  MockAddressBookInstance,
  MockOracleInstance,
  MockOtokenInstance,
} from '../build/types/truffle-types'
const {expectRevert} = require('@openzeppelin/test-helpers')
const MockAddressBook = artifacts.require('MockAddressBook.sol')
const MockOracle = artifacts.require('MockOracle.sol')
const MockOtoken = artifacts.require('MockOtoken.sol')
const MockERC20 = artifacts.require('MockERC20.sol')
const MarginCalculator = artifacts.require('MarginCalculator.sol')
const ZERO_ADDR = '0x0000000000000000000000000000000000000000'
contract('MarginCalculator', () => {
  const expiryFarAway = 1898553600

  let calculator: MarginCalculatorInstance
  let addressBook: MockAddressBookInstance
  let oracle: MockOracleInstance
  let eth250Put: MockOtokenInstance
  let eth250Call: MockOtokenInstance
  let usdc: MockERC20Instance
  let weth: MockERC20Instance

  before('set up contracts', async () => {
    // initiate addressbook first.
    addressBook = await MockAddressBook.new()
    // setup calculator
    calculator = await MarginCalculator.new()
    await calculator.init(addressBook.address)
    // setup oracle
    oracle = await MockOracle.new(addressBook.address)
    await addressBook.setOracle(oracle.address)
    // setup usdc and weth
    usdc = await MockERC20.new('USDC', 'USDC')
    weth = await MockERC20.new('WETH', 'WETH')
    // setup otoken
    eth250Put = await MockOtoken.new()
    const strikePrice250 = new BigNumber(250).times(1e18).toString()
    await eth250Put.init(weth.address, usdc.address, usdc.address, strikePrice250, expiryFarAway, true)

    eth250Call = await MockOtoken.new()
    await eth250Call.init(weth.address, usdc.address, usdc.address, strikePrice250, expiryFarAway, false)
  })

  describe('Get cash value tests', () => {
    it('Should return 0 when entering address(0)', async () => {
      const cashedValue = await calculator.getExpiredCashValue(ZERO_ADDR)
      assert.equal(cashedValue.toString(), '0')
    })

    it('Should return cash value for put as strike price - eth price when strike > eth price', async () => {
      const ethPirce = new BigNumber(200).times(1e18).toString()
      await oracle.setMockedStatus(ethPirce, true)
      const cashedValue = await calculator.getExpiredCashValue(eth250Put.address)
      assert.equal(cashedValue.toString(), new BigNumber(50).times(1e18).toString())
    })

    it('Should return cash value for call as 0 when strike price when strike > eth price', async () => {
      const ethPirce = new BigNumber(200).times(1e18).toString()
      await oracle.setMockedStatus(ethPirce, true)
      const cashedValue = await calculator.getExpiredCashValue(eth250Call.address)
      assert.equal(cashedValue.toString(), '0')
    })

    it('Should return cash value for put as 0 when strike  < eth price', async () => {
      const ethPirce = new BigNumber(300).times(1e18).toString()
      await oracle.setMockedStatus(ethPirce, true)
      const cashedValue = await calculator.getExpiredCashValue(eth250Put.address)
      assert.equal(cashedValue.toString(), '0')
    })

    it('Should return cash value for call as underlying - strike when strike < eth price', async () => {
      const ethPirce = new BigNumber(300).times(1e18).toString()
      await oracle.setMockedStatus(ethPirce, true)
      const cashedValue = await calculator.getExpiredCashValue(eth250Call.address)
      assert.equal(cashedValue.toString(), new BigNumber(50).times(1e18).toString())
    })

    it('Should revert if price is not finalized.', async () => {
      const ethPirce = new BigNumber(200).times(1e18).toString()
      await oracle.setMockedStatus(ethPirce, false)
      await expectRevert(
        calculator.getExpiredCashValue(eth250Call.address),
        'MarginCalculator: Oracle price not finalized yet.',
      )
    })
  })
})
