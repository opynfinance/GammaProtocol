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
  let oToken: MockOtokenInstance
  let addressBook: MockAddressBookInstance
  let oTokenFactory: OtokenFactoryInstance

  // Paramter used for oToken init(). (Use random addresses as usdc and eth)
  let usdc: MockERC20Instance
  let shitcoin: MockERC20Instance
  const ethAddress = ZERO_ADDR
  const strikePrice = new BigNumber(200).times(new BigNumber(10).exponentiatedBy(18))
  const isPut = true
  let expiry: number

  before('Deploy oToken logic and Factory contract', async () => {
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

    oTokenFactory = await OTokenFactory.new(addressBook.address)
    expiry = (await time.latest()).toNumber() + time.duration.days(30).toNumber()
  })

  describe('Get oToken address', () => {
    it('Should have no otoken records at the begining', async () => {
      const otokens = await oTokenFactory.getOtokens()
      assert.equal(otokens.length, 0, 'Should have no otoken records')
    })

    it('Should return address(0) if token is not deployed', async () => {
      const existAddress = await oTokenFactory.getOtoken(
        ethAddress,
        usdc.address,
        usdc.address,
        strikePrice,
        expiry,
        isPut,
      )
      assert.equal(existAddress, ZERO_ADDR, 'getOtoken check failed on undeployed tokens.')
    })

    it('should get deterministic address with new oToken paramters', async () => {
      const targetAddress = await oTokenFactory.getTargetOtokenAddress(
        ethAddress,
        usdc.address,
        usdc.address,
        strikePrice,
        expiry,
        isPut,
      )
      assert.notEqual(targetAddress, ZERO_ADDR, 'getTargetOtokenAddress should never give 0 address.')
    })

    it('should get different target address with different oToken paramters', async () => {
      const targetAddress1 = await oTokenFactory.getTargetOtokenAddress(
        ethAddress,
        usdc.address,
        usdc.address,
        strikePrice,
        expiry,
        isPut,
      )
      const targetAddress2 = await oTokenFactory.getTargetOtokenAddress(
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

  describe('Create new oToken', () => {
    it('Should create new contract at expected address', async () => {
      const targetAddress = await oTokenFactory.getTargetOtokenAddress(
        ethAddress,
        usdc.address,
        usdc.address,
        strikePrice,
        expiry,
        isPut,
      )

      const txResponse = await oTokenFactory.createOtoken(
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
      oToken = await MockOtoken.at(targetAddress)
    })

    it('Should have correct paramter', async () => {
      assert.equal(await oToken.underlyingAsset(), ethAddress)
      assert.equal(await oToken.strikeAsset(), usdc.address)
      assert.equal(await oToken.collateralAsset(), usdc.address)
      assert.equal(await oToken.isPut(), isPut)
      assert.equal((await oToken.strikePrice()).toString(), strikePrice.toString())
      assert.equal((await oToken.expiry()).toString(), expiry.toString())
    })

    it('Should revert when creating non-whitelisted options', async () => {
      await expectRevert(
        oTokenFactory.createOtoken(shitcoin.address, usdc.address, usdc.address, strikePrice, expiry, isPut),
        'OtokenFactory: Unsupported Product',
      )
    })

    it('Should revert when calling init on already inited oToken', async () => {
      await expectRevert(oToken.init(usdc.address, usdc.address, usdc.address, strikePrice, expiry, isPut), 'revert')
    })

    it('Should revert when creating duplicated option', async () => {
      await expectRevert(
        oTokenFactory.createOtoken(ethAddress, usdc.address, usdc.address, strikePrice, expiry, isPut),
        'OtokenFactory: Option created',
      )
    })
  })

  describe('Get oToken address after creation', () => {
    it('Should have one otoken record', async () => {
      const otokens = await oTokenFactory.getOtokens()
      assert.equal(otokens.length, 1)

      assert(otokens.includes(oToken.address))
    })

    it('should get same address if calling getTargetOTokenAddress with existing option paramters', async () => {
      const addr = await oTokenFactory.getTargetOtokenAddress(
        ethAddress,
        usdc.address,
        usdc.address,
        strikePrice,
        expiry,
        isPut,
      )
      assert.equal(addr, oToken.address)
    })

    it('Should return correct token address', async () => {
      const existAddress = await oTokenFactory.getOtoken(
        ethAddress,
        usdc.address,
        usdc.address,
        strikePrice,
        expiry,
        isPut,
      )
      assert.equal(existAddress, oToken.address)
    })
  })

  describe('Wrong setup: wrong implementation contract', () => {
    it('Should revert on token creation', async () => {
      // Set the oToken Impl contract to a wrong address
      await addressBook.setOtokenImpl(oTokenFactory.address)
      // Try to create a 250 strike (use the 200 strike will throw "Option Created" error first.)
      const newStrikePrice = new BigNumber(250)
      await expectRevert(
        oTokenFactory.createOtoken(ethAddress, usdc.address, usdc.address, newStrikePrice, expiry, isPut),
        'revert',
      )
    })
  })
})
