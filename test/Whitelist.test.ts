import {MockERC20Instance, MockAddressBookInstance, WhitelistInstance} from '../build/types/truffle-types'

const {expectEvent, expectRevert} = require('@openzeppelin/test-helpers')

const MockERC20 = artifacts.require('MockERC20.sol')
const MockAddressBook = artifacts.require('MockAddressBook.sol')
const Whitelist = artifacts.require('Whitelist.sol')
// address(0)
const ZERO_ADDR = '0x0000000000000000000000000000000000000000'

contract('Whitelist', ([owner, otokenFactoryAddress, random, newOwner]) => {
  // ERC20 mocks
  let usdc: MockERC20Instance
  let dai: MockERC20Instance
  // option mock
  let otoken: MockERC20Instance
  // address book mock
  let addressBook: MockAddressBookInstance
  // Whitelist module
  let whitelist: WhitelistInstance

  const underlyingAsset = ZERO_ADDR

  before('Deployment', async () => {
    // deploy USDC token
    usdc = await MockERC20.new('USDC', 'USDC', 6)
    // deploy DAI token
    dai = await MockERC20.new('DAI', 'DAI', 18)
    // deploy option
    otoken = await MockERC20.new('OETH', 'OETH', 18)

    // deploy AddressBook mock
    addressBook = await MockAddressBook.new()
    // set Otoken Factory address
    await addressBook.setOtokenFactory(otokenFactoryAddress)

    // deploy Whitelist module
    whitelist = await Whitelist.new(addressBook.address, {from: owner})
  })

  describe('Whitelist product', () => {
    it('should revert whitelisting a product from non-owner address', async () => {
      await expectRevert(
        whitelist.whitelistProduct(underlyingAsset, usdc.address, usdc.address, {from: random}),
        'Ownable: caller is not the owner',
      )
    })

    it('should whitelist a product from owner address', async () => {
      const whitelistTx = await whitelist.whitelistProduct(underlyingAsset, usdc.address, usdc.address, {from: owner})

      expectEvent(whitelistTx, 'ProductWhitelisted')

      const isWhitelistedProduct = await whitelist.isWhitelistedProduct(underlyingAsset, usdc.address, usdc.address)
      assert.equal(isWhitelistedProduct, true, 'fail: product not whitelisted')
    })
  })

  describe('Blacklist product', () => {
    it('should revert blacklisting a product from non-owner address', async () => {
      await expectRevert(
        whitelist.blacklistProduct(underlyingAsset, usdc.address, usdc.address, {from: random}),
        'Ownable: caller is not the owner',
      )
    })

    it('should blacklist a product from owner address', async () => {
      assert.equal(
        await whitelist.isWhitelistedProduct(underlyingAsset, usdc.address, usdc.address),
        true,
        'fail: product not whitelisted',
      )

      const blacklistTx = await whitelist.blacklistProduct(underlyingAsset, usdc.address, usdc.address, {from: owner})

      expectEvent(blacklistTx, 'ProductBlacklisted')

      const isWhitelistedProduct = await whitelist.isWhitelistedProduct(underlyingAsset, usdc.address, usdc.address)
      assert.equal(isWhitelistedProduct, false, 'fail: product not blacklisted')
    })
  })

  describe('Whitelist otoken', () => {
    it('should revert whitelisting an otoken from sender other than Otoken Factory', async () => {
      await expectRevert(whitelist.whitelistOtoken(otoken.address, {from: owner}), 'Sender is not Otoken Factory')
    })

    it('should whitelist an otoken from Otoken Factory address', async () => {
      const whitelistTx = await whitelist.whitelistOtoken(otoken.address, {from: otokenFactoryAddress})

      expectEvent(whitelistTx, 'OtokenWhitelisted')

      const isWhitelistedOtoken = await whitelist.isWhitelistedOtoken(otoken.address)
      assert.equal(isWhitelistedOtoken, true, 'fail: otoken not whitelisted')
    })
  })

  describe('Blacklist otoken', () => {
    it('should revert blacklisting an otoken from sender other than owner', async () => {
      await expectRevert(
        whitelist.blacklistOtoken(otoken.address, {from: otokenFactoryAddress}),
        'Ownable: caller is not the owner',
      )
    })

    it('should blacklist an otoken from owner address', async () => {
      assert.equal(await whitelist.isWhitelistedOtoken(otoken.address), true, 'fail: otoken not whitelisted')

      const blacklistTx = await whitelist.blacklistOtoken(otoken.address, {from: owner})

      expectEvent(blacklistTx, 'OtokenBlacklisted')

      const isWhitelistedOtoken = await whitelist.isWhitelistedOtoken(otoken.address)
      assert.equal(isWhitelistedOtoken, false, 'fail: otoken not blacklisted')
    })
  })

  describe('Whitelist collateral', () => {
    it('should revert whitelisting collateral from non-owner address', async () => {
      await expectRevert(
        whitelist.whitelistCollateral(usdc.address, {from: random}),
        'Ownable: caller is not the owner',
      )
    })

    it('should whitelist collateral from owner address', async () => {
      const whitelistTx = await whitelist.whitelistCollateral(usdc.address, {from: owner})

      expectEvent(whitelistTx, 'CollateralWhitelisted')

      const isWhitelistedCollateral = await whitelist.isWhitelistedCollateral(usdc.address)
      assert.equal(isWhitelistedCollateral, true, 'fail: collateral not whitelisted')
    })
  })

  describe('blacklist collateral', () => {
    it('should revert blacklisting collateral from non-owner address', async () => {
      await expectRevert(
        whitelist.blacklistCollateral(usdc.address, {from: random}),
        'Ownable: caller is not the owner',
      )
    })

    it('should blacklist collateral from owner address', async () => {
      assert.equal(await whitelist.isWhitelistedCollateral(usdc.address), true, 'fail: collateral not whitelisted')

      const blacklistTx = await whitelist.blacklistCollateral(usdc.address, {from: owner})

      expectEvent(blacklistTx, 'CollateralBlacklisted')

      const isWhitelistedCollateral = await whitelist.isWhitelistedCollateral(usdc.address)
      assert.equal(isWhitelistedCollateral, false, 'fail: collateral not blacklisted')
    })
  })

  describe('Transfer ownership', () => {
    it('should transfer ownership to new owner', async () => {
      await whitelist.transferOwnership(newOwner, {from: owner})

      assert.equal(await whitelist.owner(), newOwner, 'Owner address mismatch')
    })

    it('should revert whitelisting a product from old owner address', async () => {
      await expectRevert(
        whitelist.whitelistProduct(underlyingAsset, dai.address, dai.address, {from: owner}),
        'Ownable: caller is not the owner',
      )
    })

    it('should whitelist a product from owner address', async () => {
      const whitelistTx = await whitelist.whitelistProduct(underlyingAsset, dai.address, dai.address, {from: newOwner})

      expectEvent(whitelistTx, 'ProductWhitelisted')

      const isSupportedProduct = await whitelist.isWhitelistedProduct(underlyingAsset, dai.address, dai.address)
      assert.equal(isSupportedProduct, true, 'fail: product not supported')
    })
  })

  describe('Deployment checks', () => {
    it('should revert deploying Whitelist Module when AddressBook is equal to address(0)', async () => {
      await expectRevert(Whitelist.new(ZERO_ADDR, {from: owner}), 'Invalid address book')
    })
  })
})