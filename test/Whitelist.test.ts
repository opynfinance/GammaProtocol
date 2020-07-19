import {MockERC20Instance, WhitelistInstance} from '../build/types/truffle-types'

const {expectEvent, expectRevert} = require('@openzeppelin/test-helpers')

const MockERC20 = artifacts.require('MockERC20.sol')
const Whitelist = artifacts.require('Whitelist.sol')
// address(0)
const ZERO_ADDR = '0x0000000000000000000000000000000000000000'

contract('Whitelist', ([owner, random, newOwner]) => {
  // ERC20 mocks
  let usdc: MockERC20Instance
  let dai: MockERC20Instance
  // Whitelist module
  let whitelist: WhitelistInstance

  const underlyingAsset = ZERO_ADDR

  before('Deployment', async () => {
    // deploy USDC token
    usdc = await MockERC20.new('USDC', 'USDC')
    dai = await MockERC20.new('DAI', 'DAI')

    // deploy Whitelist module
    whitelist = await Whitelist.new({from: owner})
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

      const isSupportedProduct = await whitelist.isWhitelistedProduct(underlyingAsset, usdc.address, usdc.address)
      assert.equal(isSupportedProduct, true, 'fail: product not supported')
    })

    it('should revert whitelisting an already whitelisted product', async () => {
      await expectRevert(
        whitelist.whitelistProduct(underlyingAsset, usdc.address, usdc.address, {from: owner}),
        'Product already whitelisted',
      )
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
})
