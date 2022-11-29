import {
  OtokenFactoryInstance,
  MockOtokenInstance,
  MockAddressBookInstance,
  MockWhitelistModuleInstance,
  MockERC20Instance,
} from '../../build/types/truffle-types'
import BigNumber from 'bignumber.js'
import { assert } from 'chai'
import { createValidExpiry, createTokenAmount } from '../utils'
const { expectEvent, expectRevert, time } = require('@openzeppelin/test-helpers')
const OTokenFactory = artifacts.require('OtokenFactory.sol')
const MockAddressBook = artifacts.require('MockAddressBook.sol')
const MockWhitelist = artifacts.require('MockWhitelistModule.sol')
const MockERC20 = artifacts.require('MockERC20.sol')
const MockOtoken = artifacts.require('MockOtoken.sol')
const ZERO_ADDR = '0x0000000000000000000000000000000000000000'

contract('OTokenFactory', ([user1, user2, controller]) => {
  let firstOtoken: MockOtokenInstance
  let addressBook: MockAddressBookInstance
  let otokenFactory: OtokenFactoryInstance

  // Paramter used for otoken init(). (Use random addresses as usdc and eth)
  let usdc: MockERC20Instance
  let weth: MockERC20Instance
  let shitcoin: MockERC20Instance

  const strikePrice = createTokenAmount(200)
  const isPut = true
  let expiry: number

  before('Deploy otoken logic and Factory contract', async () => {
    expiry = createValidExpiry(Number(await time.latest()), 100)
    usdc = await MockERC20.new('USDC', 'USDC', 6)
    weth = await MockERC20.new('WETH', 'WETH', 18)
    shitcoin = await MockERC20.new('Shit coin', 'STC', 18)

    const logic = await MockOtoken.new()

    // Deploy and whitelist ETH:USDC product
    const mockWhitelist: MockWhitelistModuleInstance = await MockWhitelist.new()
    await mockWhitelist.whitelistProduct(weth.address, usdc.address, usdc.address, isPut)
    await mockWhitelist.whitelistProduct(usdc.address, weth.address, weth.address, isPut)
    // Deploy addressbook
    addressBook = await MockAddressBook.new()
    await addressBook.setOtokenImpl(logic.address)
    await addressBook.setWhitelist(mockWhitelist.address)
    await addressBook.setController(controller)

    otokenFactory = await OTokenFactory.new(addressBook.address)
  })

  describe('Get otoken address', () => {
    it('Should have no otoken records at the begining', async () => {
      const counter = await otokenFactory.getOtokensLength()
      assert.equal(counter.toString(), '0', 'Should have no otoken records')
    })

    it('Should return address(0) if token is not deployed', async () => {
      const existAddress = await otokenFactory.getOtoken(
        weth.address,
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
        weth.address,
        usdc.address,
        usdc.address,
        strikePrice,
        expiry,
        isPut,
      )
      assert.notEqual(targetAddress, ZERO_ADDR, 'getTargetOtokenAddress should never give 0 address.')
    })

    it('should get same target address with same otoken paramters', async () => {
      const targetAddress1 = await otokenFactory.getTargetOtokenAddress(
        weth.address,
        usdc.address,
        usdc.address,
        strikePrice,
        expiry,
        false,
      )
      const targetAddress2 = await otokenFactory.getTargetOtokenAddress(
        weth.address,
        usdc.address,
        usdc.address,
        strikePrice,
        expiry,
        false,
      )
      assert.equal(targetAddress1, targetAddress2)
    })

    it('should get different target address with different otoken paramters', async () => {
      const targetAddress1 = await otokenFactory.getTargetOtokenAddress(
        weth.address,
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
    it('Should revert when creating expired option', async () => {
      const lastTimeStamp = await time.latest()
      await expectRevert(
        otokenFactory.createOtoken(
          weth.address,
          usdc.address,
          usdc.address,
          strikePrice,
          lastTimeStamp.toString(),
          isPut,
          { from: user1 },
        ),
        "OtokenFactory: Can't create expired option",
      )
    })

    it('Should revert when using random timestamp.', async () => {
      const randomTime = (await time.latest()).toNumber() + time.duration.days(30).toNumber()
      await expectRevert(
        otokenFactory.createOtoken(
          weth.address,
          usdc.address,
          usdc.address,
          strikePrice,
          randomTime.toString(),
          isPut,
          {
            from: user1,
          },
        ),
        'OtokenFactory: Option has to expire 08:00 UTC',
      )
    })

    it('Should revert when timestamp > 2345/12/31', async () => {
      const tooFar = 11865398400 // 01/01/2346 @ 12:00am (UTC)
      await expectRevert(
        otokenFactory.createOtoken(weth.address, usdc.address, usdc.address, strikePrice, tooFar, isPut, {
          from: user1,
        }),
        "OtokenFactory: Can't create option with expiry > 2345/12/31",
      )
    })

    it('Should revert when creating a 0 strike put', async () => {
      await expectRevert(
        otokenFactory.createOtoken(weth.address, usdc.address, usdc.address, 0, expiry, isPut, {
          from: user1,
        }),
        "OtokenFactory: Can't create a $0 strike put option",
      )
    })

    it('Should create new contract at expected address', async () => {
      const targetAddress = await otokenFactory.getTargetOtokenAddress(
        weth.address,
        usdc.address,
        usdc.address,
        strikePrice,
        expiry,
        isPut,
      )

      const txResponse = await otokenFactory.createOtoken(
        weth.address,
        usdc.address,
        usdc.address,
        strikePrice,
        expiry,
        isPut,
        { from: user1 },
      )
      expectEvent(txResponse, 'OtokenCreated', {
        creator: user1,
        underlying: weth.address,
        strike: usdc.address,
        collateral: usdc.address,
        strikePrice: strikePrice.toString(),
        expiry: expiry.toString(),
        isPut: isPut,
        tokenAddress: targetAddress,
      })
      firstOtoken = await MockOtoken.at(targetAddress)
    })

    it('The init() function in Mocked Otoken contract should have been called', async () => {
      assert.isTrue(await firstOtoken.inited())
    })

    it('Should be able to create a new Otoken by another user', async () => {
      const _strikePrice = createTokenAmount(250)
      const targetAddress = await otokenFactory.getTargetOtokenAddress(
        weth.address,
        usdc.address,
        usdc.address,
        _strikePrice,
        expiry,
        isPut,
      )

      const txResponse = await otokenFactory.createOtoken(
        weth.address,
        usdc.address,
        usdc.address,
        _strikePrice,
        expiry,
        isPut,
        { from: user2 },
      )
      expectEvent(txResponse, 'OtokenCreated', {
        creator: user2,
        underlying: weth.address,
        strike: usdc.address,
        collateral: usdc.address,
        strikePrice: _strikePrice.toString(),
        expiry: expiry.toString(),
        isPut: isPut,
        tokenAddress: targetAddress,
      })
    })

    it('Should revert when creating non-whitelisted options', async () => {
      await expectRevert(
        otokenFactory.createOtoken(shitcoin.address, usdc.address, usdc.address, strikePrice, expiry, isPut),
        'OtokenFactory: Unsupported Product',
      )
    })

    it('Should revert when creating duplicated option', async () => {
      await expectRevert(
        otokenFactory.createOtoken(weth.address, usdc.address, usdc.address, strikePrice, expiry, isPut),
        'OtokenFactory: Option already created',
      )
    })
  })

  describe('Get otoken address after creation', () => {
    it('Should have two otoken records', async () => {
      const counter = await otokenFactory.getOtokensLength()
      assert.equal(counter.toString(), '2')

      const firstToken = await otokenFactory.otokens(0)
      assert.equal(firstToken, firstOtoken.address)
    })

    it('should get same address if calling getTargetOTokenAddress with existing option paramters', async () => {
      const addr = await otokenFactory.getTargetOtokenAddress(
        weth.address,
        usdc.address,
        usdc.address,
        strikePrice,
        expiry,
        isPut,
      )
      assert.equal(addr, firstOtoken.address)
    })

    it('Should return correct token address', async () => {
      const existAddress = await otokenFactory.getOtoken(
        weth.address,
        usdc.address,
        usdc.address,
        strikePrice,
        expiry,
        isPut,
      )
      assert.equal(existAddress, firstOtoken.address)
    })
  })

  describe('Wrong setup: wrong implementation contract', () => {
    it('Should revert on token creation', async () => {
      // Set the otoken Impl contract to a wrong address
      await addressBook.setOtokenImpl(otokenFactory.address)
      // Try to create a 250 strike (use the 200 strike will throw "Option Created" error first.)
      const newStrikePrice = 250
      await expectRevert(
        otokenFactory.createOtoken(weth.address, usdc.address, usdc.address, newStrikePrice, expiry, isPut),
        'Create2: Failed on deploy',
      )
    })
  })
})
