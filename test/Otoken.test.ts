import {OtokenInstance, MockERC20Instance} from '../build/types/truffle-types'
import BigNumber from 'bignumber.js'

const {expectRevert, time} = require('@openzeppelin/test-helpers')

const Otoken = artifacts.require('Otoken.sol')
const MockERC20 = artifacts.require('MockERC20.sol')
const ZERO_ADDR = '0x0000000000000000000000000000000000000000'
const ETH_ADDR = ZERO_ADDR

contract('Otoken', ([deployer, mockAddressBook]) => {
  let otoken: OtokenInstance
  let usdc: MockERC20Instance

  // let expiry: number;
  const strikePrice = new BigNumber(200).times(new BigNumber(10).exponentiatedBy(18))
  let expiry: number
  let expiryStringRedable: string
  const isPut = true

  before('Deployment', async () => {
    // Need another mock contract for addressbook when we add ERC20 operations.
    otoken = await Otoken.new(mockAddressBook)
    usdc = await MockERC20.new('USDC', 'USDC')
    expiry = (await time.latest()).add(time.duration.days(30)).toNumber()
    expiryStringRedable = new Date(expiry * 1000)
      .toISOString()
      .split('T')[0]
      .replace('-', '')
      .replace('-', '')
  })

  describe('Otoken Initialization', () => {
    it('should be able to initialize with put parameter', async () => {
      await otoken.init(ETH_ADDR, usdc.address, usdc.address, strikePrice, expiry, isPut, {from: deployer})
    })

    it('should initilized the put option with valid name / symbol', async () => {
      const name = await otoken.name()
      const symbol = await otoken.symbol()
      assert.equal(name, `ETHUSDC/${expiryStringRedable}/200P/USDC`)
      assert.equal(symbol, `$200 ETHP ${expiryStringRedable}`)
    })

    it('should set the right name for calls', async () => {
      const call = await Otoken.new(mockAddressBook)
      await call.init(ETH_ADDR, usdc.address, usdc.address, strikePrice, expiry, false, {from: deployer})
      const name = await call.name()
      const symbol = await call.symbol()
      assert.equal(name, `ETHUSDC/${expiryStringRedable}/200C/USDC`)
      assert.equal(symbol, `$200 ETHC ${expiryStringRedable}`)
    })

    it('should display strikePrice as $0 in name and symbol when strikePrice < 10^18', async () => {
      const testOtoken = await Otoken.new(mockAddressBook)
      await testOtoken.init(ETH_ADDR, usdc.address, usdc.address, 0, expiry, isPut, {from: deployer})
      const name = await testOtoken.name()
      const symbol = await testOtoken.symbol()
      assert.equal(name, `ETHUSDC/${expiryStringRedable}/0P/USDC`)
      assert.equal(symbol, `$0 ETHP ${expiryStringRedable}`)
    })

    it('should get the correct parameters.', async () => {
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

    it('should revert when init is called twice', async () => {
      await expectRevert(
        otoken.init(ETH_ADDR, usdc.address, usdc.address, strikePrice, expiry, isPut),
        'Contract instance has already been initialized.',
      )
    })
  })
})
