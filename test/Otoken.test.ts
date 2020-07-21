/* eslint-disable */
import {OtokenInstance, MockERC20Instance} from '../build/types/truffle-types'
import BigNumber from 'bignumber.js'

// const {expectEvent, expectRevert, time} = require('@openzeppelin/test-helpers')
const {time} = require('@openzeppelin/test-helpers')

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
    // address book
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
    it('should be able to initialize the otoken and emit event', async () => {
      await otoken.init(ETH_ADDR, usdc.address, usdc.address, strikePrice, expiry, isPut, {from: deployer})
    })

    it('should initilized the token with a valid name / symbol', async () => {
      const name = await otoken.name()
      const symbol = await otoken.symbol()
      assert.equal(name, `ETHUSDC $200Put ${expiryStringRedable}`)
      assert.equal(symbol, `ETHUSDC/${expiryStringRedable}/200P/USDC`)
    })

    it('should set the parameters correctly.',  () => {})

    it('should revert when init is called twice', async () => {})
  })
})
