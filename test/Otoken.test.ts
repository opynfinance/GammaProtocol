import {OtokenInstance, MockERC20Instance} from '../build/types/truffle-types'
import BigNumber from 'bignumber.js'

const {expectRevert} = require('@openzeppelin/test-helpers')

const Otoken = artifacts.require('Otoken.sol')
const MockERC20 = artifacts.require('MockERC20.sol')
const ZERO_ADDR = '0x0000000000000000000000000000000000000000'
const ETH_ADDR = ZERO_ADDR

contract('Otoken', ([deployer, mockAddressBook, random]) => {
  let otoken: OtokenInstance
  let usdc: MockERC20Instance

  // let expiry: number;
  const strikePrice = new BigNumber(200).times(new BigNumber(10).exponentiatedBy(18))
  const expiry = 1601020800 // 2020/09/25 0800 UTC
  const isPut = true

  before('Deployment', async () => {
    // Need another mock contract for addressbook when we add ERC20 operations.
    otoken = await Otoken.new(mockAddressBook)
    usdc = await MockERC20.new('USDC', 'USDC')
  })

  describe('Otoken Initialization', () => {
    it('should be able to initialize with put parameter correctly', async () => {
      await otoken.init(ETH_ADDR, usdc.address, usdc.address, strikePrice, expiry, isPut, {from: deployer})
      const _underlying = await otoken.underlyingAsset()
      const _strike = await otoken.strikeAsset()
      const _collateral = await otoken.collateralAsset()
      const _strikePrice = (await otoken.strikePrice()).toString()
      const _isPut = await otoken.isPut()
      const _expiry = (await otoken.expiry()).toNumber()
      assert.equal(_underlying, ETH_ADDR)
      assert.equal(_strike, usdc.address)
      assert.equal(_collateral, usdc.address)
      assert.equal(_strikePrice, strikePrice.toString())
      assert.equal(_isPut, isPut)
      assert.equal(_expiry, expiry)
    })

    it('should initilized the put option with valid name / symbol', async () => {
      const name = await otoken.name()
      const symbol = await otoken.symbol()
      assert.equal(name, `ETHUSDC 25-September-2020 200Put USDC Collateral`)
      assert.equal(symbol, `oETHUSDC-25SEP20-200P`)
    })

    it('should revert when init is called twice on the parameters', async () => {
      await expectRevert(
        otoken.init(ETH_ADDR, usdc.address, usdc.address, strikePrice, expiry, isPut),
        'Contract instance has already been initialized.',
      )
    })

    it('should set the right name for calls', async () => {
      const call = await Otoken.new(mockAddressBook)
      await call.init(ETH_ADDR, usdc.address, usdc.address, strikePrice, expiry, false, {from: deployer})
      const name = await call.name()
      const symbol = await call.symbol()
      assert.equal(name, `ETHUSDC 25-September-2020 200Call USDC Collateral`)
      assert.equal(symbol, `oETHUSDC-25SEP20-200C`)
    })

    it('should set the right name for non-eth options', async () => {
      const weth = await MockERC20.new('WETH', 'WETH')
      const put = await Otoken.new(mockAddressBook)
      await put.init(weth.address, usdc.address, usdc.address, strikePrice, expiry, isPut, {from: deployer})
      const name = await put.name()
      const symbol = await put.symbol()
      assert.equal(name, `WETHUSDC 25-September-2020 200Put USDC Collateral`)
      assert.equal(symbol, `oWETHUSDC-25SEP20-200P`)
    })

    it('should revert when init asset with non-erc20 address', async () => {
      /* This behavior should've been banned by factory) */
      const put = await Otoken.new(mockAddressBook)
      await expectRevert(
        put.init(random, usdc.address, usdc.address, strikePrice, expiry, isPut, {from: deployer}),
        'revert',
      )
    })

    it('should set the right name for options with 0 expiry (should be banned by factory)', async () => {
      /* This behavior should've been banned by factory) */
      const perpetual = await Otoken.new(mockAddressBook)
      await perpetual.init(ETH_ADDR, usdc.address, usdc.address, strikePrice, 0, isPut, {from: deployer})
      const name = await perpetual.name()
      const symbol = await perpetual.symbol()
      assert.equal(name, `ETHUSDC 01-January-1970 200Put USDC Collateral`)
      assert.equal(symbol, `oETHUSDC-01JAN70-200P`)
    })

    it('should set the right name for options expiry on 2345/12/31', async () => {
      /** This is the largest timestamp that bokkypoobah tested **/
      const perpetual = await Otoken.new(mockAddressBook)
      const _expiry = '11865394800' // Mon, 31 Dec 2345
      await perpetual.init(ETH_ADDR, usdc.address, usdc.address, strikePrice, _expiry, isPut, {from: deployer})
      const name = await perpetual.name()
      const symbol = await perpetual.symbol()
      assert.equal(name, `ETHUSDC 31-December-2345 200Put USDC Collateral`)
      assert.equal(symbol, `oETHUSDC-31DEC45-200P`)
    })

    it('should revert when trying to init option with expiry > 2345/12/31)', async () => {
      const _expiry = '11865398400' // Tue, 1 JAN 2346
      const otoken = await Otoken.new(mockAddressBook)

      await expectRevert(
        otoken.init(ETH_ADDR, usdc.address, usdc.address, strikePrice, _expiry, isPut, {from: deployer}),
        "Otoken: Can't init with expiry > 2345/12/31.",
      )
    })

    it('should display strikePrice as $0 in name and symbol when strikePrice < 10^18', async () => {
      const testOtoken = await Otoken.new(mockAddressBook)
      await testOtoken.init(ETH_ADDR, usdc.address, usdc.address, 0, expiry, isPut, {from: deployer})
      const name = await testOtoken.name()
      const symbol = await testOtoken.symbol()
      assert.equal(name, `ETHUSDC 25-September-2020 0Put USDC Collateral`)
      assert.equal(symbol, `oETHUSDC-25SEP20-0P`)
    })
  })
})
