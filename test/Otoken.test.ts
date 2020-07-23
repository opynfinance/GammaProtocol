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
      assert.equal(await otoken.underlyingAsset(), ETH_ADDR)
      assert.equal(await otoken.strikeAsset(), usdc.address)
      assert.equal(await otoken.collateralAsset(), usdc.address)
      assert.equal((await otoken.strikePrice()).toString(), strikePrice.toString())
      assert.equal(await otoken.isPut(), isPut)
      assert.equal((await otoken.expiry()).toNumber(), expiry)
    })

    it('should initilized the put option with valid name / symbol', async () => {
      assert.equal(await otoken.name(), `ETHUSDC 25-September-2020 200Put USDC Collateral`)
      assert.equal(await otoken.symbol(), `oETHUSDC-25SEP20-200P`)
      assert.equal((await otoken.decimals()).toNumber(), 18)
    })

    it('should revert when init is called again with the same parameters', async () => {
      await expectRevert(
        otoken.init(ETH_ADDR, usdc.address, usdc.address, strikePrice, expiry, isPut),
        'Contract instance has already been initialized.',
      )
    })

    it('should revert when init is called again with different parameters', async () => {
      await expectRevert(
        otoken.init(usdc.address, ETH_ADDR, ETH_ADDR, strikePrice, expiry, false),
        'Contract instance has already been initialized.',
      )
    })

    it('should set the right name for calls', async () => {
      const call = await Otoken.new(mockAddressBook)
      await call.init(ETH_ADDR, usdc.address, usdc.address, strikePrice, expiry, false, {from: deployer})
      assert.equal(await call.name(), `ETHUSDC 25-September-2020 200Call USDC Collateral`)
      assert.equal(await call.symbol(), `oETHUSDC-25SEP20-200C`)
    })

    it('should set the right name for non-eth options', async () => {
      const weth = await MockERC20.new('WETH', 'WETH')
      const put = await Otoken.new(mockAddressBook)
      await put.init(weth.address, usdc.address, usdc.address, strikePrice, expiry, isPut, {from: deployer})
      assert.equal(await put.name(), `WETHUSDC 25-September-2020 200Put USDC Collateral`)
      assert.equal(await put.symbol(), `oWETHUSDC-25SEP20-200P`)
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
      const otoken = await Otoken.new(mockAddressBook)
      await otoken.init(ETH_ADDR, usdc.address, usdc.address, strikePrice, 0, isPut, {from: deployer})
      assert.equal(await otoken.name(), `ETHUSDC 01-January-1970 200Put USDC Collateral`)
      assert.equal(await otoken.symbol(), `oETHUSDC-01JAN70-200P`)
    })

    it('should set the right name for options expiry on 2345/12/31', async () => {
      /** This is the largest timestamp that the factoy will allow (the largest bokkypoobah covers) **/
      const otoken = await Otoken.new(mockAddressBook)
      const _expiry = '11865394800' // Mon, 31 Dec 2345
      await otoken.init(ETH_ADDR, usdc.address, usdc.address, strikePrice, _expiry, isPut, {from: deployer})
      assert.equal(await otoken.name(), `ETHUSDC 31-December-2345 200Put USDC Collateral`)
      assert.equal(await otoken.symbol(), `oETHUSDC-31DEC45-200P`)
    })

    it('should set the right name and symbol for expiry on each month', async () => {
      // We need to go through all decision branches in _getMonth() to make a 100% test coverage.
      const January = await Otoken.new(mockAddressBook)
      await January.init(ETH_ADDR, usdc.address, usdc.address, strikePrice, 1893456000, isPut, {from: deployer})
      assert.equal(await January.name(), 'ETHUSDC 01-January-2030 200Put USDC Collateral')
      assert.equal(await January.symbol(), 'oETHUSDC-01JAN30-200P')

      const February = await Otoken.new(mockAddressBook)
      await February.init(ETH_ADDR, usdc.address, usdc.address, strikePrice, 1896134400, isPut, {from: deployer})
      assert.equal(await February.name(), 'ETHUSDC 01-February-2030 200Put USDC Collateral')
      assert.equal(await February.symbol(), 'oETHUSDC-01FEB30-200P')

      const March = await Otoken.new(mockAddressBook)
      await March.init(ETH_ADDR, usdc.address, usdc.address, strikePrice, 1898553600, isPut, {from: deployer})
      assert.equal(await March.name(), 'ETHUSDC 01-March-2030 200Put USDC Collateral')
      assert.equal(await March.symbol(), 'oETHUSDC-01MAR30-200P')

      const April = await Otoken.new(mockAddressBook)
      await April.init(ETH_ADDR, usdc.address, usdc.address, strikePrice, 1901232000, isPut, {from: deployer})
      assert.equal(await April.name(), 'ETHUSDC 01-April-2030 200Put USDC Collateral')
      assert.equal(await April.symbol(), 'oETHUSDC-01APR30-200P')

      const May = await Otoken.new(mockAddressBook)
      await May.init(ETH_ADDR, usdc.address, usdc.address, strikePrice, 1903824000, isPut, {from: deployer})
      assert.equal(await May.name(), 'ETHUSDC 01-May-2030 200Put USDC Collateral')
      assert.equal(await May.symbol(), 'oETHUSDC-01MAY30-200P')

      const June = await Otoken.new(mockAddressBook)
      await June.init(ETH_ADDR, usdc.address, usdc.address, strikePrice, 1906502400, isPut, {from: deployer})
      assert.equal(await June.name(), 'ETHUSDC 01-June-2030 200Put USDC Collateral')
      assert.equal(await June.symbol(), 'oETHUSDC-01JUN30-200P')

      const July = await Otoken.new(mockAddressBook)
      await July.init(ETH_ADDR, usdc.address, usdc.address, strikePrice, 1909094400, isPut, {from: deployer})
      assert.equal(await July.name(), 'ETHUSDC 01-July-2030 200Put USDC Collateral')
      assert.equal(await July.symbol(), 'oETHUSDC-01JUL30-200P')

      const August = await Otoken.new(mockAddressBook)
      await August.init(ETH_ADDR, usdc.address, usdc.address, strikePrice, 1911772800, isPut, {from: deployer})
      assert.equal(await August.name(), 'ETHUSDC 01-August-2030 200Put USDC Collateral')
      assert.equal(await August.symbol(), 'oETHUSDC-01AUG30-200P')

      const September = await Otoken.new(mockAddressBook)
      await September.init(ETH_ADDR, usdc.address, usdc.address, strikePrice, 1914451200, isPut, {from: deployer})
      assert.equal(await September.name(), 'ETHUSDC 01-September-2030 200Put USDC Collateral')
      assert.equal(await September.symbol(), 'oETHUSDC-01SEP30-200P')

      const October = await Otoken.new(mockAddressBook)
      await October.init(ETH_ADDR, usdc.address, usdc.address, strikePrice, 1917043200, isPut, {from: deployer})
      assert.equal(await October.name(), 'ETHUSDC 01-October-2030 200Put USDC Collateral')
      assert.equal(await October.symbol(), 'oETHUSDC-01OCT30-200P')

      const November = await Otoken.new(mockAddressBook)
      await November.init(ETH_ADDR, usdc.address, usdc.address, strikePrice, 1919721600, isPut, {from: deployer})
      assert.equal(await November.name(), 'ETHUSDC 01-November-2030 200Put USDC Collateral')
      assert.equal(await November.symbol(), 'oETHUSDC-01NOV30-200P')

      const December = await Otoken.new(mockAddressBook)
      await December.init(ETH_ADDR, usdc.address, usdc.address, strikePrice, 1922313600, isPut, {from: deployer})
      assert.equal(await December.name(), 'ETHUSDC 01-December-2030 200Put USDC Collateral')
      assert.equal(await December.symbol(), 'oETHUSDC-01DEC30-200P')
    })

    it('should display strikePrice as $0 in name and symbol when strikePrice < 10^18', async () => {
      const testOtoken = await Otoken.new(mockAddressBook)
      await testOtoken.init(ETH_ADDR, usdc.address, usdc.address, 0, expiry, isPut, {from: deployer})
      assert.equal(await testOtoken.name(), `ETHUSDC 25-September-2020 0Put USDC Collateral`)
      assert.equal(await testOtoken.symbol(), `oETHUSDC-25SEP20-0P`)
    })
  })
})
