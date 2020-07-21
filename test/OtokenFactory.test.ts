import {
  OtokenFactoryInstance,
  MockOtokenInstance,
  MockAddressBookInstance,
  MockWhitelistModuleInstance,
  MockERC20Instance,
} from '../build/types/truffle-types'
import BigNumber from 'bignumber.js'
import {assert} from 'chai'
const {expectEvent, expectRevert, time} = require('@openzeppelin/test-helpers')
const OTokenFactory = artifacts.require('OtokenFactory.sol')
const MockAddressBook = artifacts.require('MockAddressBook.sol')
const MockWhitelist = artifacts.require('MockWhitelistModule.sol')
const MockERC20 = artifacts.require('MockERC20.sol')
const MockOtoken = artifacts.require('MockOtoken.sol')
const ZERO_ADDR = '0x0000000000000000000000000000000000000000'

contract('OTokenFactory', accounts => {
  let otoken: MockOtokenInstance
  let addressBook: MockAddressBookInstance
  let otokenFactory: OtokenFactoryInstance

  // Paramter used for otoken init(). (Use random addresses as usdc and eth)
  let usdc: MockERC20Instance
  let shitcoin: MockERC20Instance
  const ethAddress = ZERO_ADDR
  const strikePrice = new BigNumber(200).times(new BigNumber(10).exponentiatedBy(18))
  const isPut = true
  let expiry: number

  before('Deploy otoken logic and Factory contract', async () => {
    usdc = await MockERC20.new('USDC', 'USDC')
    shitcoin = await MockERC20.new('Shit coin', 'STC')

    const logic = await MockOtoken.new()

    // Deploy and whitelist ETH:USDC product
    const mockWhitelist: MockWhitelistModuleInstance = await MockWhitelist.new()
    await mockWhitelist.whitelistProduct(ethAddress, usdc.address, usdc.address)
    // Deploy addressbook
    addressBook = await MockAddressBook.new()
    await addressBook.setOtokenImpl(logic.address)
    await addressBook.setWhitelist(mockWhitelist.address)

    otokenFactory = await OTokenFactory.new(addressBook.address)
    expiry = (await time.latest()).toNumber() + time.duration.days(30).toNumber()
  })

  describe('Get otoken address', () => {
    it('Should have no otoken records at the begining', async () => {
      const otokens = await otokenFactory.getOtokens()
      assert.equal(otokens.length, 0, 'Should have no otoken records')
    })

    it('Should return address(0) if token is not deployed', async () => {
      const existAddress = await otokenFactory.getOtoken(
        ethAddress,
        usdc.address,
        usdc.address,
        strikePrice,
        expiry,
        isPut,
      )
      assert.equal(existAddress, ZERO_ADDR, 'getOtoken check failed on undeployed tokens.')
    })

    it('should get deterministic address with new otoken paramters', async () => {
      const targetAddress = await otokenFactory.getTargetOtokenAddress(
        ethAddress,
        usdc.address,
        usdc.address,
        strikePrice,
        expiry,
        isPut,
      )
      assert.notEqual(targetAddress, ZERO_ADDR, 'getTargetOtokenAddress should never give 0 address.')
    })

    it('should get different target address with different otoken paramters', async () => {
      const targetAddress1 = await otokenFactory.getTargetOtokenAddress(
        ethAddress,
        usdc.address,
        usdc.address,
        strikePrice,
        expiry,
        isPut,
      )
      const targetAddress2 = await otokenFactory.getTargetOtokenAddress(
        ZERO_ADDR,
        ZERO_ADDR,
        ZERO_ADDR,
        strikePrice,
        expiry,
        isPut,
      )
      assert.notEqual(targetAddress1, targetAddress2)
    })
  })

  describe('Create new otoken', () => {
    it('Should create new contract at expected address', async () => {
      const targetAddress = await otokenFactory.getTargetOtokenAddress(
        ethAddress,
        usdc.address,
        usdc.address,
        strikePrice,
        expiry,
        isPut,
      )

      const txResponse = await otokenFactory.createOtoken(
        ethAddress,
        usdc.address,
        usdc.address,
        strikePrice,
        expiry,
        isPut,
        {from: accounts[0]},
      )
      expectEvent(txResponse, 'OtokenCreated', {
        creator: accounts[0],
        underlying: ethAddress,
        strike: usdc.address,
        collateral: usdc.address,
        strikePrice: strikePrice.toString(),
        expiry: expiry.toString(),
        isPut: isPut,
        tokenAddress: targetAddress,
      })
      otoken = await MockOtoken.at(targetAddress)
    })

    it('Should have correct paramter', async () => {
      assert.equal(await otoken.underlyingAsset(), ethAddress)
      assert.equal(await otoken.strikeAsset(), usdc.address)
      assert.equal(await otoken.collateralAsset(), usdc.address)
      assert.equal(await otoken.isPut(), isPut)
      assert.equal((await otoken.strikePrice()).toString(), strikePrice.toString())
      assert.equal((await otoken.expiry()).toString(), expiry.toString())
    })

    it('Should revert when creating non-whitelisted options', async () => {
      await expectRevert(
        otokenFactory.createOtoken(shitcoin.address, usdc.address, usdc.address, strikePrice, expiry, isPut),
        'OtokenFactory: Unsupported Product',
      )
    })

    it('Should revert when calling init on already inited otoken', async () => {
      await expectRevert(otoken.init(usdc.address, usdc.address, usdc.address, strikePrice, expiry, isPut), 'revert')
    })

    it('Should revert when creating duplicated option', async () => {
      await expectRevert(
        otokenFactory.createOtoken(ethAddress, usdc.address, usdc.address, strikePrice, expiry, isPut),
        'OtokenFactory: Option created',
      )
    })
  })

  describe('Get otoken address after creation', () => {
    it('Should have one otoken record', async () => {
      const otokens = await otokenFactory.getOtokens()
      assert.equal(otokens.length, 1)

      assert(otokens.includes(otoken.address))
    })

    it('should get same address if calling getTargetOTokenAddress with existing option paramters', async () => {
      const addr = await otokenFactory.getTargetOtokenAddress(
        ethAddress,
        usdc.address,
        usdc.address,
        strikePrice,
        expiry,
        isPut,
      )
      assert.equal(addr, otoken.address)
    })

    it('Should return correct token address', async () => {
      const existAddress = await otokenFactory.getOtoken(
        ethAddress,
        usdc.address,
        usdc.address,
        strikePrice,
        expiry,
        isPut,
      )
      assert.equal(existAddress, otoken.address)
    })
  })

  describe('Wrong setup: wrong implementation contract', () => {
    it('Should revert on token creation', async () => {
      // Set the otoken Impl contract to a wrong address
      await addressBook.setOtokenImpl(otokenFactory.address)
      // Try to create a 250 strike (use the 200 strike will throw "Option Created" error first.)
      const newStrikePrice = new BigNumber(250)
      await expectRevert(
        otokenFactory.createOtoken(ethAddress, usdc.address, usdc.address, newStrikePrice, expiry, isPut),
        'revert',
      )
    })
  })
})
