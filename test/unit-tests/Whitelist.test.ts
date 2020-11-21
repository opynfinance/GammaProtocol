import {
  MockERC20Instance,
  MockNoDecimalERC20Instance,
  MockNoSymbolERC20Instance,
  MockAddressBookInstance,
  WhitelistInstance,
} from '../../build/types/truffle-types'

const {expectEvent, expectRevert} = require('@openzeppelin/test-helpers')

const MockERC20 = artifacts.require('MockERC20.sol')
const MockNoDecimalERC20 = artifacts.require('MockNoDecimalERC20.sol')
const MockNoSymbolERC20 = artifacts.require('MockNoSymbolERC20.sol')
const MockAddressBook = artifacts.require('MockAddressBook.sol')
const Whitelist = artifacts.require('Whitelist.sol')
// address(0)
const ZERO_ADDR = '0x0000000000000000000000000000000000000000'

contract('Whitelist', ([owner, otokenFactoryAddress, random, newOwner, callee]) => {
  // ERC20 mocks
  let usdc: MockERC20Instance
  let dai: MockERC20Instance
  let noDecimal: MockNoDecimalERC20Instance
  let noSymbol: MockNoSymbolERC20Instance
  let twentyDecimal: MockERC20Instance
  let threeDecimal: MockERC20Instance
  let blankSymbol: MockERC20Instance
  // option mock
  let otoken: MockERC20Instance
  // address book mock
  let addressBook: MockAddressBookInstance
  // Whitelist module
  let whitelist: WhitelistInstance

  const isPut = true

  const underlyingAsset = ZERO_ADDR

  before('Deployment', async () => {
    // deploy USDC token
    usdc = await MockERC20.new('USDC', 'USDC', 6)
    // deploy DAI token
    dai = await MockERC20.new('DAI', 'DAI', 18)
    // deploy option
    otoken = await MockERC20.new('OETH', 'OETH', 8)
    //deploy no decimal erc-20
    noDecimal = await MockNoDecimalERC20.new('noDecimalERC20', 'noDecimalERC20')
    //deploy no symbol erc-20
    noSymbol = await MockNoSymbolERC20.new('noSymbolERC20')
    //deploy erc-20 with decimals = 20
    twentyDecimal = await MockERC20.new('TwentyDecimalERC20', 'TwentyDecimalERC20', 20)
    //deploy erc-20 with decimals = 3
    threeDecimal = await MockERC20.new('ThreeDecimalERC20', 'ThreeDecimalERC20', 3)
    //deploy erc-20 with symbol=""
    blankSymbol = await MockERC20.new('NAMEBUTNOSYM', '', 18)

    // deploy AddressBook mock
    addressBook = await MockAddressBook.new()
    // set Otoken Factory address
    await addressBook.setOtokenFactory(otokenFactoryAddress)

    // deploy Whitelist module
    whitelist = await Whitelist.new(addressBook.address, {from: owner})
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

  describe('Out of bounds ERC-20s', () => {
    it('should revert whitelisting collateral when decimals are too high', async () => {
      await expectRevert(
        whitelist.whitelistCollateral(twentyDecimal.address, {from: owner}),
        'Whitelist: Collateral decimals out of bounds',
      )
    })

    it('should revert whitelisting collateral when decimals are too low', async () => {
      await expectRevert(
        whitelist.whitelistCollateral(threeDecimal.address, {from: owner}),
        'Whitelist: Collateral decimals out of bounds',
      )
    })

    it('should revert whitelisting collateral when there is no decimals', async () => {
      await expectRevert.unspecified(whitelist.whitelistCollateral(noDecimal.address, {from: owner}))
    })

    it('should revert whitelisting collateral when there is no symbol', async () => {
      await expectRevert.unspecified(whitelist.whitelistCollateral(noSymbol.address, {from: owner}))
    })

    it('should revert whitelisting collateral when the symbol is blank', async () => {
      await expectRevert(
        whitelist.whitelistCollateral(blankSymbol.address, {from: owner}),
        'Whitelist: Collateral has no symbol',
      )
    })

    it('should revert whitelisting a product when underlying asset decimals are too high', async () => {
      await expectRevert(
        whitelist.whitelistProduct(twentyDecimal.address, usdc.address, usdc.address, isPut, {from: owner}),
        'Whitelist: Underlying decimals out of bounds',
      )
    })
    it('should revert whitelisting a product when underlying asset decimals are too low', async () => {
      await expectRevert(
        whitelist.whitelistProduct(threeDecimal.address, usdc.address, usdc.address, isPut, {from: owner}),
        'Whitelist: Underlying decimals out of bounds',
      )
    })
    it('should revert whitelisting a product when strike asset decimals are too high', async () => {
      await expectRevert(
        whitelist.whitelistProduct(usdc.address, twentyDecimal.address, usdc.address, isPut, {from: owner}),
        'Whitelist: Strike decimals out of bounds',
      )
    })
    it('should revert whitelisting a product when strike asset decimals are too low', async () => {
      await expectRevert(
        whitelist.whitelistProduct(usdc.address, threeDecimal.address, usdc.address, isPut, {from: owner}),
        'Whitelist: Strike decimals out of bounds',
      )
    })
    it('should revert whitelisting a product when underlying has no symbol', async () => {
      await expectRevert.unspecified(
        whitelist.whitelistProduct(noSymbol.address, usdc.address, usdc.address, isPut, {from: owner}),
      )
    })
    it('should revert whitelisting a product when strike has no symbol', async () => {
      await expectRevert.unspecified(
        whitelist.whitelistProduct(usdc.address, noSymbol.address, usdc.address, isPut, {from: owner}),
      )
    })
    it('should revert whitelisting a product when underlying has no decimals', async () => {
      await expectRevert.unspecified(
        whitelist.whitelistProduct(noDecimal.address, usdc.address, usdc.address, isPut, {from: owner}),
      )
    })
    it('should revert whitelisting a product when strike has no decimals', async () => {
      await expectRevert.unspecified(
        whitelist.whitelistProduct(usdc.address, noDecimal.address, usdc.address, isPut, {from: owner}),
      )
    })
    it('should revert whitelisting a product when underlying has a blank symbol', async () => {
      await expectRevert.unspecified(
        whitelist.whitelistProduct(blankSymbol.address, usdc.address, usdc.address, isPut, {from: owner}),
      )
    })
    it('should revert whitelisting a product when strike has a blank symbol', async () => {
      await expectRevert.unspecified(
        whitelist.whitelistProduct(usdc.address, blankSymbol.address, usdc.address, isPut, {from: owner}),
      )
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

  describe('Whitelist product', () => {
    it('should revert whitelisting a product from non-owner address', async () => {
      await expectRevert(
        whitelist.whitelistProduct(dai.address, usdc.address, usdc.address, isPut, {from: random}),
        'Ownable: caller is not the owner',
      )
    })

    it('should revert whitelisting a product when the collateral has not been whitelisted', async () => {
      const isWhitelistedCollateral = await whitelist.isWhitelistedCollateral(usdc.address)
      assert.equal(isWhitelistedCollateral, false, 'fail: collateral is whitelisted')

      await expectRevert(
        whitelist.whitelistProduct(dai.address, usdc.address, usdc.address, isPut, {from: owner}),
        'Whitelist: Collateral is not whitelisted',
      )
    })

    it('should whitelist a product from owner address when the collateral has been whitelisted', async () => {
      const collateralWhitelistTx = await whitelist.whitelistCollateral(usdc.address, {from: owner})

      expectEvent(collateralWhitelistTx, 'CollateralWhitelisted')

      const isWhitelistedCollateral = await whitelist.isWhitelistedCollateral(usdc.address)
      assert.equal(isWhitelistedCollateral, true, 'fail: collateral not whitelisted')

      const productWhitelistTx = await whitelist.whitelistProduct(dai.address, usdc.address, usdc.address, isPut, {
        from: owner,
      })

      expectEvent(productWhitelistTx, 'ProductWhitelisted')

      const isWhitelistedProduct = await whitelist.isWhitelistedProduct(dai.address, usdc.address, usdc.address, isPut)
      assert.equal(isWhitelistedProduct, true, 'fail: product not whitelisted')
    })
  })

  describe('Blacklist product', () => {
    it('should revert blacklisting a product from non-owner address', async () => {
      await expectRevert(
        whitelist.blacklistProduct(dai.address, usdc.address, usdc.address, isPut, {from: random}),
        'Ownable: caller is not the owner',
      )
    })

    it('should blacklist a product from owner address', async () => {
      assert.equal(
        await whitelist.isWhitelistedProduct(dai.address, usdc.address, usdc.address, isPut),
        true,
        'fail: product not whitelisted',
      )

      const blacklistTx = await whitelist.blacklistProduct(dai.address, usdc.address, usdc.address, isPut, {
        from: owner,
      })

      expectEvent(blacklistTx, 'ProductBlacklisted')

      const isWhitelistedProduct = await whitelist.isWhitelistedProduct(dai.address, usdc.address, usdc.address, isPut)
      assert.equal(isWhitelistedProduct, false, 'fail: product not blacklisted')
    })
  })

  describe('Whitelist otoken', () => {
    it('should revert whitelisting an otoken from sender other than Otoken Factory', async () => {
      await expectRevert(
        whitelist.whitelistOtoken(otoken.address, {from: owner}),
        'Whitelist: Sender is not OtokenFactory',
      )
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

  describe('Whitelist callee', () => {
    it('should revert whitelisting callee from non-owner address', async () => {
      await expectRevert(whitelist.whitelistCallee(callee, {from: random}), 'Ownable: caller is not the owner')
    })

    it('should whitelist callee from owner address', async () => {
      const whitelistTx = await whitelist.whitelistCallee(callee, {from: owner})

      expectEvent(whitelistTx, 'CalleeWhitelisted')

      const isWHitelistedCallee = await whitelist.isWhitelistedCallee(callee)
      assert.equal(isWHitelistedCallee, true, 'callee not whitelisted')
    })
  })

  describe('blacklist callee', () => {
    it('should revert blacklisting callee from non-owner address', async () => {
      await expectRevert(whitelist.blacklistCallee(callee, {from: random}), 'Ownable: caller is not the owner')
    })

    it('should blacklist callee from owner address', async () => {
      assert.equal(await whitelist.isWhitelistedCallee(callee), true, 'callee not whitelisted')

      const blacklistTx = await whitelist.blacklistCallee(callee, {from: owner})

      expectEvent(blacklistTx, 'CalleeBlacklisted')

      const isWhitelistedCallee = await whitelist.isWhitelistedCallee(callee)
      assert.equal(isWhitelistedCallee, false, 'callee is not blacklisted')
    })
  })

  describe('Transfer ownership', () => {
    it('should transfer ownership to new owner', async () => {
      await whitelist.transferOwnership(newOwner, {from: owner})

      assert.equal(await whitelist.owner(), newOwner, 'Owner address mismatch')
    })

    it('should revert whitelisting a product from old owner address', async () => {
      const collateralWhitelistTx = await whitelist.whitelistCollateral(dai.address, {from: newOwner})

      expectEvent(collateralWhitelistTx, 'CollateralWhitelisted')

      const isWhitelistedCollateral = await whitelist.isWhitelistedCollateral(dai.address)
      assert.equal(isWhitelistedCollateral, true, 'fail: collateral not whitelisted')

      await expectRevert(
        whitelist.whitelistProduct(underlyingAsset, dai.address, dai.address, isPut, {from: owner}),
        'Ownable: caller is not the owner',
      )
    })

    it('should whitelist a product from owner address', async () => {
      const whitelistTx = await whitelist.whitelistProduct(dai.address, dai.address, dai.address, isPut, {
        from: newOwner,
      })

      expectEvent(whitelistTx, 'ProductWhitelisted')

      const isSupportedProduct = await whitelist.isWhitelistedProduct(dai.address, dai.address, dai.address, isPut)
      assert.equal(isSupportedProduct, true, 'fail: product not supported')
    })
  })

  describe('Deployment checks', () => {
    it('should revert deploying Whitelist Module when AddressBook is equal to address(0)', async () => {
      await expectRevert(Whitelist.new(ZERO_ADDR, {from: owner}), 'Invalid address book')
    })
  })
})
