import {
  OtokenFactoryInstance,
  OtokenInstance,
  MockAddressBookInstance,
  MockWhitelistModuleInstance,
} from '../build/types/truffle-types'
import BigNumber from 'bignumber.js'

const {expectEvent, expectRevert, time} = require('@openzeppelin/test-helpers')
const OToken = artifacts.require('Otoken.sol')
const OTokenFactory = artifacts.require('OtokenFactory.sol')
const MockAddressBook = artifacts.require('MockAddressBook.sol')
const MockWhitelist = artifacts.require('MockWhitelistModule.sol')
const ZERO_ADDR = '0x0000000000000000000000000000000000000000'

contract('OTokenFactory', accounts => {
  let oToken: OtokenInstance
  let addressBook: MockAddressBookInstance
  let oTokenFactory: OtokenFactoryInstance

  // Paramter used for oToken init(). (Use random addresses as usdc and eth)
  const usdcAddress = accounts[5]
  const ethAddress = accounts[6]
  const shitcoinAddr = accounts[7]
  const strikePrice = new BigNumber(200)
  const isPut = true
  const name = 'Opyn ETH-USDC 200 PUT'
  const symbol = 'ETH-USDC 200 P'
  let expiry: number

  before('Deploy oToken logic and Factory contract', async () => {
    const logic = await OToken.new()

    // Deploy and whitelist ETH:USDC product
    const mockWhitelist: MockWhitelistModuleInstance = await MockWhitelist.new()
    await mockWhitelist.whitelistProduct(ethAddress, usdcAddress, usdcAddress)
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
      expect(otokens.length).to.equal(0)
    })

    it('Should return address(0) if token is not deployed', async () => {
      const existAddress = await oTokenFactory.getOtoken(
        ethAddress,
        usdcAddress,
        usdcAddress,
        strikePrice,
        expiry,
        isPut,
      )
      expect(existAddress).to.equal(ZERO_ADDR)
    })

    it('should get deterministic address with new oToken paramters', async () => {
      const targetAddress = await oTokenFactory.getTargetOtokenAddress(
        ethAddress,
        usdcAddress,
        usdcAddress,
        strikePrice,
        expiry,
        isPut,
        name,
        symbol,
      )
      expect(targetAddress).not.equal(ZERO_ADDR)
    })

    it('should get different target address with different oToken paramters', async () => {
      const targetAddress1 = await oTokenFactory.getTargetOtokenAddress(
        ethAddress,
        usdcAddress,
        usdcAddress,
        strikePrice,
        expiry,
        isPut,
        name,
        symbol,
      )
      const targetAddress2 = await oTokenFactory.getTargetOtokenAddress(
        ZERO_ADDR,
        ZERO_ADDR,
        ZERO_ADDR,
        strikePrice,
        expiry,
        isPut,
        name,
        symbol,
      )
      expect(targetAddress1).not.equal(targetAddress2)
    })
  })

  describe('Create new oToken', () => {
    it('Should create new contract at expected address', async () => {
      const targetAddress = await oTokenFactory.getTargetOtokenAddress(
        ethAddress,
        usdcAddress,
        usdcAddress,
        strikePrice,
        expiry,
        isPut,
        name,
        symbol,
      )

      const txResponse = await oTokenFactory.createOtoken(
        ethAddress,
        usdcAddress,
        usdcAddress,
        strikePrice,
        expiry,
        isPut,
        name,
        symbol,
        {from: accounts[0]},
      )
      expectEvent(txResponse, 'OtokenCreated', {
        creator: accounts[0],
        underlying: ethAddress,
        strike: usdcAddress,
        collateral: usdcAddress,
        strikePrice: strikePrice.toString(),
        expiry: expiry.toString(),
        isPut: isPut,
        tokenAddress: targetAddress,
      })
      oToken = await OToken.at(targetAddress)
    })

    it('Should have correct paramter', async () => {
      expect(await oToken.underlyingAsset()).to.be.equal(ethAddress)
      expect(await oToken.strikeAsset()).to.be.equal(usdcAddress)
      expect(await oToken.collateralAsset()).to.be.equal(usdcAddress)
      expect(await oToken.isPut()).to.be.equal(isPut)
      expect((await oToken.strikePrice()).toString()).to.be.equal(strikePrice.toString())
      expect((await oToken.expiry()).toString()).to.be.equal(expiry.toString())
    })

    it('Should revert when creating non-whitelisted options', async () => {
      await expectRevert(
        oTokenFactory.createOtoken(shitcoinAddr, usdcAddress, usdcAddress, strikePrice, expiry, isPut, name, symbol),
        'OptionFactory: Unsupported Product',
      )
    })

    it('Should revert when calling init on already inited oToken', async () => {
      await expectRevert(
        oToken.init(usdcAddress, usdcAddress, usdcAddress, strikePrice, expiry, isPut, name, symbol),
        'revert',
      )
    })

    it('Should revert when creating duplicated option', async () => {
      await expectRevert(
        oTokenFactory.createOtoken(ethAddress, usdcAddress, usdcAddress, strikePrice, expiry, isPut, name, symbol),
        'OptionFactory: Option created',
      )
    })

    it('Should revert when creating same options with different name or symbol', async () => {
      await expectRevert(
        oTokenFactory.createOtoken(ethAddress, usdcAddress, usdcAddress, strikePrice, expiry, isPut, 'name2', symbol),
        'OptionFactory: Option created',
      )
      await expectRevert(
        oTokenFactory.createOtoken(ethAddress, usdcAddress, usdcAddress, strikePrice, expiry, isPut, name, 'symbol2'),
        'OptionFactory: Option created',
      )
    })
  })

  describe('Get oToken address after creation', () => {
    it('Should have one otoken record', async () => {
      const otokens = await oTokenFactory.getOtokens()
      expect(otokens.length).to.equal(1)

      expect(otokens.includes(oToken.address)).to.be.true
    })

    it('should get same address if calling getTargetOTokenAddress with existing option paramters', async () => {
      const addr = await oTokenFactory.getTargetOtokenAddress(
        ethAddress,
        usdcAddress,
        usdcAddress,
        strikePrice,
        expiry,
        isPut,
        name,
        symbol,
      )
      expect(addr).to.be.equal(oToken.address)
    })

    it('Should return correct token address', async () => {
      const existAddress = await oTokenFactory.getOtoken(
        ethAddress,
        usdcAddress,
        usdcAddress,
        strikePrice,
        expiry,
        isPut,
      )
      expect(existAddress).to.equal(oToken.address)
    })
  })

  describe('Wrong setup: wrong implementation contract', () => {
    it('Should revert on token creation', async () => {
      // Set the oToken Impl contract to a wrong address
      await addressBook.setOtokenImpl(oTokenFactory.address)
      // Try to create a 250 strike (use the 200 strike will throw "Option Created" error first.)
      const newStrikePrice = new BigNumber(250)
      await expectRevert(
        oTokenFactory.createOtoken(ethAddress, usdcAddress, usdcAddress, newStrikePrice, expiry, isPut, name, symbol),
        'revert',
      )
    })
  })
})
