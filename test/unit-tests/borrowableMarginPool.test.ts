import {
  MockERC20Instance,
  MockAddressBookInstance,
  MockWhitelistModuleInstance,
  WETH9Instance,
  MarginPoolInstance,
  BorrowableMarginPoolInstance,
  MockDumbERC20Instance,
  OtokenInstance,
} from '../../build/types/truffle-types'
import { createTokenAmount } from '../utils'

import BigNumber from 'bignumber.js'

const { expectRevert, ether } = require('@openzeppelin/test-helpers')

const MockERC20 = artifacts.require('MockERC20.sol')
const MockDumbERC20 = artifacts.require('MockDumbERC20.sol')
const MockAddressBook = artifacts.require('MockAddressBook.sol')
const MockWhitelist = artifacts.require('MockWhitelistModule.sol')
const WETH9 = artifacts.require('WETH9.sol')
const MarginPool = artifacts.require('BorrowableMarginPool.sol')
const Otoken = artifacts.require('Otoken.sol')

// address(0)
const ZERO_ADDR = '0x0000000000000000000000000000000000000000'

contract('MarginPool', ([owner, controllerAddress, farmer, user1, random]) => {
  const usdcToMint = ether('1000')
  const wethToMint = ether('50')
  const otokenAmount = createTokenAmount(10)

  const strikePrice = createTokenAmount(200)
  const expiry = 1916380800 // 2030/09/25 0800 UTC
  const isPut = false

  const TOTAL_PCT = 10000

  // ERC20 mocks
  let usdc: MockERC20Instance
  let weth: WETH9Instance
  // DumbER20: Return false when transfer fail.
  let dumbToken: MockDumbERC20Instance
  // addressbook module mock
  let addressBook: MockAddressBookInstance
  // whitelist module mock
  let whitelist: MockWhitelistModuleInstance
  // margin pool
  let marginPool: BorrowableMarginPoolInstance
  // mock oToken
  let otoken: OtokenInstance

  before('Deployment', async () => {
    // deploy USDC token
    usdc = await MockERC20.new('USDC', 'USDC', 18)
    // deploy WETH token for testing
    weth = await WETH9.new()
    // deploy dumb erc20
    dumbToken = await MockDumbERC20.new('DUSDC', 'DUSDC', 18)
    // deploy AddressBook mock
    addressBook = await MockAddressBook.new()
    // deploy whitelist mock
    whitelist = await MockWhitelist.new()
    // set Controller module address
    await addressBook.setController(controllerAddress)
    // set Whitelist module address
    await addressBook.setWhitelist(whitelist.address)

    // deploy MarginPool module
    marginPool = await MarginPool.new(addressBook.address)

    otoken = await Otoken.new()

    await otoken.init(addressBook.address, weth.address, usdc.address, usdc.address, strikePrice, expiry, isPut, {
      from: owner,
    })

    // mint usdc
    await usdc.mint(user1, usdcToMint)
    // mint usdc
    await usdc.mint(marginPool.address, usdcToMint)
    // wrap ETH in Controller module level
    await weth.deposit({ from: controllerAddress, value: wethToMint })

    // controller approving infinite amount of WETH to pool
    await weth.approve(marginPool.address, wethToMint, { from: controllerAddress })

    // transfer to pool
    await marginPool.transferToPool(weth.address, controllerAddress, ether('25'), { from: controllerAddress })
  })

  describe('MarginPool initialization', () => {
    it('should revert if initilized with 0 addressBook address', async () => {
      await expectRevert(MarginPool.new(ZERO_ADDR), 'Invalid address book')
    })
  })

  describe('Set Borrow Whitelist', () => {
    it('should revert calling setBorrowerWhitelistedStatus from non-owner', async () => {
      await expectRevert(
        marginPool.setBorrowerWhitelistedStatus(random, true, { from: random }),
        'Ownable: caller is not the owner',
      )
    })

    it('should revert calling setBorrowerWhitelistedStatus on zero address', async () => {
      await expectRevert(
        marginPool.setBorrowerWhitelistedStatus(ZERO_ADDR, true, { from: owner }),
        'MarginPool: Invalid Borrower',
      )
    })

    it('should set whitelist status to true when called from owner', async () => {
      await marginPool.setBorrowerWhitelistedStatus(random, true, { from: owner })

      assert.equal(await marginPool.isWhitelistedBorrower(random), true, 'whitelist status mismatch')
    })

    it('should set whitelist status to false when called from owner', async () => {
      await marginPool.setBorrowerWhitelistedStatus(random, true, { from: owner })

      assert.equal(await marginPool.isWhitelistedBorrower(random), true, 'whitelist status mismatch')

      await marginPool.setBorrowerWhitelistedStatus(random, false, { from: owner })

      assert.equal(await marginPool.isWhitelistedBorrower(random), false, 'whitelist status mismatch')
    })
  })

  describe('Set oToken Buyer Whitelist', () => {
    it('should revert calling setOTokenBuyerWhitelistedStatus from non-owner', async () => {
      await expectRevert(
        marginPool.setOTokenBuyerWhitelistedStatus(random, true, { from: random }),
        'Ownable: caller is not the owner',
      )
    })

    it('should revert calling setOTokenBuyerWhitelistedStatus on zero address', async () => {
      await expectRevert(
        marginPool.setOTokenBuyerWhitelistedStatus(ZERO_ADDR, true, { from: owner }),
        'MarginPool: Invalid oToken Buyer',
      )
    })

    it('should set whitelist status to true when called from owner', async () => {
      await marginPool.setOTokenBuyerWhitelistedStatus(random, true, { from: owner })

      assert.equal(await marginPool.isWhitelistedOTokenBuyer(random), true, 'whitelist status mismatch')
    })

    it('should set whitelist status to false when called from owner', async () => {
      await marginPool.setOTokenBuyerWhitelistedStatus(random, true, { from: owner })

      assert.equal(await marginPool.isWhitelistedOTokenBuyer(random), true, 'whitelist status mismatch')

      await marginPool.setOTokenBuyerWhitelistedStatus(random, false, { from: owner })

      assert.equal(await marginPool.isWhitelistedOTokenBuyer(random), false, 'whitelist status mismatch')
    })
  })

  describe('Set Options Vault Whitelist', () => {
    it('should revert calling setOptionsVaultWhitelistedStatus from non-owner', async () => {
      await expectRevert(
        marginPool.setOptionsVaultWhitelistedStatus(random, true, { from: random }),
        'Ownable: caller is not the owner',
      )
    })

    it('should revert calling setOptionsVaultWhitelistedStatus on zero address', async () => {
      await expectRevert(
        marginPool.setOptionsVaultWhitelistedStatus(ZERO_ADDR, true, { from: owner }),
        'MarginPool: Invalid Options Vault',
      )
    })

    it('should revert calling setOptionsVaultWhitelistedStatus on retail vault', async () => {
      await marginPool.setOptionsVaultToRetailStatus([farmer])

      await expectRevert(
        marginPool.setOptionsVaultWhitelistedStatus(farmer, true, { from: owner }),
        'MarginPool: Cannot whitelist a retail vault',
      )
    })

    it('should set whitelist status to true when called from owner', async () => {
      await marginPool.setOptionsVaultWhitelistedStatus(random, true, { from: owner })

      assert.equal(await marginPool.isWhitelistedOptionsVault(random), true, 'whitelist status mismatch')
    })

    it('should set whitelist status to false when called from owner', async () => {
      await marginPool.setOptionsVaultWhitelistedStatus(random, true, { from: owner })

      assert.equal(await marginPool.isWhitelistedOptionsVault(random), true, 'whitelist status mismatch')

      await marginPool.setOptionsVaultWhitelistedStatus(random, false, { from: owner })

      assert.equal(await marginPool.isWhitelistedOptionsVault(random), false, 'whitelist status mismatch')
    })
  })

  describe('Set Options Vault to Retail', () => {
    it('should revert calling setIsRetailVault from non-owner', async () => {
      await expectRevert(
        marginPool.setOptionsVaultToRetailStatus([random], { from: random }),
        'Ownable: caller is not the owner',
      )
    })

    it('should set option vault retail vault status to true when called from owner', async () => {
      await marginPool.setOptionsVaultToRetailStatus([random], { from: owner })

      assert.equal(await marginPool.isRetailOptionsVault(random), true, 'whitelist status mismatch')
    })

    it('should set multiple option vaults retail vault status to true when called from owner', async () => {
      await marginPool.setOptionsVaultToRetailStatus([random, ZERO_ADDR, owner, controllerAddress], { from: owner })

      assert.equal(await marginPool.isRetailOptionsVault(random), true, 'whitelist status mismatch')
      assert.equal(await marginPool.isRetailOptionsVault(owner), true, 'whitelist status mismatch')
      assert.equal(await marginPool.isRetailOptionsVault(controllerAddress), true, 'whitelist status mismatch')
    })
  })

  describe('Set Borrow Percent', () => {
    it('should revert calling setBorrowPCT from non-owner', async () => {
      await expectRevert(
        marginPool.setBorrowPCT(await otoken.collateralAsset(), 1, { from: random }),
        'Ownable: caller is not the owner',
      )
    })

    it('should set borrow percent when called from owner', async () => {
      await marginPool.setBorrowPCT(await otoken.collateralAsset(), 100, { from: owner })

      assert.equal(
        new BigNumber(await marginPool.borrowPCT(await otoken.collateralAsset())).toString(),
        '100',
        'borrowability status mismatch',
      )
    })
  })

  describe('Borrow', () => {
    beforeEach(async () => {
      otoken = await Otoken.new()

      await otoken.init(addressBook.address, weth.address, usdc.address, usdc.address, strikePrice, expiry, isPut, {
        from: owner,
      })

      await marginPool.setBorrowerWhitelistedStatus(random, true, { from: owner })
      await marginPool.setBorrowerWhitelistedStatus(user1, true, { from: owner })
      await otoken.mintOtoken(user1, otokenAmount, { from: controllerAddress })
      await marginPool.setBorrowPCT(await otoken.collateralAsset(), TOTAL_PCT, { from: owner })
      await whitelist.whitelistOtoken(otoken.address)
    })

    it('should revert borrowing if not whitelisted borrower', async () => {
      await marginPool.setBorrowerWhitelistedStatus(random, false, { from: owner })

      assert.equal(
        (await marginPool.borrowable(random, otoken.address)).toString(),
        new BigNumber('0').toString(),
        'Borrowable amount mismatch',
      )

      await expectRevert(
        marginPool.borrow(otoken.address, 1, { from: random }),
        'MarginPool: Sender is not whitelisted borrower',
      )
    })

    it('should revert borrowing if borrowing 0 of underlying', async () => {
      await expectRevert(
        marginPool.borrow(otoken.address, 0, { from: random }),
        'MarginPool: Cannot borrow 0 of underlying',
      )
    })

    it('should revert borrowing if borrowPCT = 0', async () => {
      await marginPool.setBorrowPCT(await otoken.collateralAsset(), 0, { from: owner })

      assert.equal(
        (await marginPool.borrowable(random, otoken.address)).toString(),
        new BigNumber('0').toString(),
        'Borrowable amount mismatch',
      )

      await expectRevert(
        marginPool.borrow(otoken.address, 1, { from: random }),
        'MarginPool: Borrowing more than allocated',
      )
    })

    it('should revert borrowing if using expired oToken', async () => {
      const otoken2 = await Otoken.new()

      const strikePrice = createTokenAmount(200)
      const isPut = false

      await otoken2.init(
        addressBook.address,
        weth.address,
        usdc.address,
        usdc.address,
        strikePrice,
        1637792800,
        isPut,
        {
          from: owner,
        },
      )

      // check otoken whitelist
      await whitelist.whitelistOtoken(otoken2.address)

      await expectRevert(
        marginPool.borrow(otoken2.address, 1, { from: random }),
        'MarginPool: Cannot borrow collateral asset of expired oToken',
      )
    })

    it('should revert borrowing if using put oToken', async () => {
      const otoken2 = await Otoken.new()

      const strikePrice = createTokenAmount(200)
      const isPut = true

      await otoken2.init(
        addressBook.address,
        weth.address,
        usdc.address,
        usdc.address,
        strikePrice,
        1637792800,
        isPut,
        {
          from: owner,
        },
      )

      // check otoken whitelist
      await whitelist.whitelistOtoken(otoken2.address)

      await expectRevert(
        marginPool.borrow(otoken2.address, 1, { from: random }),
        'MarginPool: oToken is not a call option',
      )
    })

    it('should revert borrowing if using blacklisted oToken', async () => {
      const otoken2 = await Otoken.new()

      const strikePrice = createTokenAmount(200)
      const isPut = false

      await otoken2.init(
        addressBook.address,
        weth.address,
        usdc.address,
        usdc.address,
        strikePrice,
        1637792800,
        isPut,
        {
          from: owner,
        },
      )

      await expectRevert(
        marginPool.borrow(otoken2.address, 1, { from: random }),
        'MarginPool: oToken is not whitelisted',
      )
    })

    it('should revert borrowing if borrowing more than allocated', async () => {
      await expectRevert(
        marginPool.borrow(otoken.address, 1, { from: random }),
        'MarginPool: Borrowing more than allocated',
      )

      await expectRevert(
        marginPool.borrow(otoken.address, new BigNumber(await otoken.balanceOf(user1)).plus(1), { from: user1 }),
        'MarginPool: Borrowing more than allocated',
      )
    })

    it('should revert borrowing if borrowing more than allocated (with borrowPCT chance)', async () => {
      const borrowPCT = 5000

      await marginPool.setBorrowPCT(await otoken.collateralAsset(), borrowPCT, { from: owner })

      const oTokenAmount = new BigNumber(await otoken.balanceOf(user1))
      const oTokenToUnderlying = oTokenAmount.times(new BigNumber(10).exponentiatedBy(10))

      assert.equal(
        oTokenToUnderlying.div(2).toString(),
        new BigNumber(await marginPool.borrowable(user1, otoken.address)).toString(),
        'Borrowable amount mismatch',
      )

      await expectRevert(
        marginPool.borrow(otoken.address, oTokenAmount.div(2).plus(1), { from: user1 }),
        'MarginPool: Borrowing more than allocated',
      )
    })

    it('should revert borrowing after borrowing full amount', async () => {
      await expectRevert(
        marginPool.borrow(otoken.address, 1, { from: random }),
        'MarginPool: Borrowing more than allocated',
      )
    })

    it('should increase borrow capacity after increasing otoken balance', async () => {
      const oTokenBalanceBefore = await otoken.balanceOf(user1)
      const amtBorrowableBefore = await marginPool.borrowable(user1, otoken.address)

      await otoken.mintOtoken(user1, otokenAmount, { from: controllerAddress })

      const amtBorrowableAfter = await marginPool.borrowable(user1, otoken.address)

      const oTokenToUnderlying = new BigNumber(
        new BigNumber(await otoken.balanceOf(user1)).minus(oTokenBalanceBefore),
      ).times(new BigNumber(10).exponentiatedBy(10))

      assert.equal(
        oTokenToUnderlying.toString(),
        new BigNumber(amtBorrowableAfter).minus(amtBorrowableBefore).toString(),
        'Borrowable amount mismatch',
      )
    })

    it('should transfer collateral asset to borrower', async () => {
      const oTokenBalanceBefore = await otoken.balanceOf(user1)
      const borrowerBalanceBefore = new BigNumber(await usdc.balanceOf(user1))
      const amtBorrowableBefore = await marginPool.borrowable(user1, otoken.address)

      const oTokenAmount = new BigNumber(await otoken.balanceOf(user1))
      const oTokenToUnderlying = oTokenAmount.times(new BigNumber(10).exponentiatedBy(10))

      await otoken.approve(marginPool.address, oTokenAmount, { from: user1 })
      await marginPool.borrow(otoken.address, oTokenAmount, { from: user1 })

      const borrowerBalanceAfter = new BigNumber(await usdc.balanceOf(user1))
      const amtBorrowableAfter = await marginPool.borrowable(user1, otoken.address)
      const oTokenBalanceAfter = await otoken.balanceOf(user1)

      await usdc.approve(marginPool.address, oTokenToUnderlying, { from: user1 })
      await marginPool.repay(otoken.address, oTokenToUnderlying, { from: user1 })

      assert.equal(
        new BigNumber('0').toString(),
        new BigNumber(oTokenBalanceAfter).toString(),
        'oToken amount mismatch',
      )

      assert.equal(
        oTokenToUnderlying.toString(),
        new BigNumber(amtBorrowableBefore).minus(amtBorrowableAfter).toString(),
        'Borrowable amount mismatch',
      )

      assert.equal(
        oTokenToUnderlying.toString(),
        new BigNumber(borrowerBalanceAfter).minus(borrowerBalanceBefore).toString(),
        'WETH value transfered from margin pool mismatch',
      )
    })

    it('should transfer collateral asset to borrower after setting borrow PCT', async () => {
      const oTokenBalanceBefore = await otoken.balanceOf(user1)

      const oTokenAmount = new BigNumber(await otoken.balanceOf(user1))
      const oTokenToUnderlying = oTokenAmount.times(new BigNumber(10).exponentiatedBy(10))

      await otoken.approve(marginPool.address, oTokenAmount, { from: user1 })

      await marginPool.borrow(otoken.address, oTokenAmount.div(4), { from: user1 })

      // 50% borrowable
      await marginPool.setBorrowPCT(await otoken.collateralAsset(), 5000, { from: owner })

      await marginPool.borrow(otoken.address, oTokenAmount.div(4), { from: user1 })

      const oTokenBalanceAfter = await otoken.balanceOf(user1)

      assert.equal(
        new BigNumber(await marginPool.borrowable(user1, otoken.address)).toString(),
        new BigNumber('0').toString(),
        'Borrowable amount mismatch',
      )

      assert.equal(
        new BigNumber(oTokenBalanceBefore).div(2).toString(),
        new BigNumber(oTokenBalanceBefore).minus(oTokenBalanceAfter).toString(),
        'oToken amount mismatch',
      )

      await usdc.approve(marginPool.address, oTokenToUnderlying, { from: user1 })
      await marginPool.repay(otoken.address, oTokenToUnderlying.div(2), { from: user1 })
    })
  })

  describe('Repay', () => {
    beforeEach(async () => {
      otoken = await Otoken.new()

      await otoken.init(addressBook.address, weth.address, usdc.address, usdc.address, strikePrice, expiry, isPut, {
        from: owner,
      })

      await marginPool.setBorrowerWhitelistedStatus(random, true, { from: owner })
      await marginPool.setBorrowerWhitelistedStatus(user1, true, { from: owner })
      await otoken.mintOtoken(user1, otokenAmount, { from: controllerAddress })
      await marginPool.setBorrowPCT(await otoken.collateralAsset(), TOTAL_PCT, { from: owner })
      await whitelist.whitelistOtoken(otoken.address)
    })

    it('should revert borrowing if repaying 0 of underlying', async () => {
      await expectRevert(
        marginPool.repay(otoken.address, 0, { from: user1 }),
        'MarginPool: Cannot repay 0 of underlying',
      )
    })

    it('should revert if repaying more than outstanding borrow', async () => {
      const oTokenAmount = new BigNumber(await otoken.balanceOf(user1))
      const oTokenToUnderlying = oTokenAmount.times(new BigNumber(10).exponentiatedBy(10))

      await otoken.approve(marginPool.address, oTokenAmount, { from: user1 })
      await marginPool.borrow(otoken.address, oTokenAmount, { from: user1 })
      await expectRevert(
        marginPool.repay(otoken.address, oTokenToUnderlying.plus(1), { from: user1 }),
        'MarginPool: Repaying more than outstanding borrow amount',
      )

      await usdc.approve(marginPool.address, oTokenToUnderlying, { from: user1 })
      await marginPool.repay(otoken.address, oTokenToUnderlying, { from: user1 })
    })

    it('should repay the outstanding borrow', async () => {
      const oTokenAmount = new BigNumber(await otoken.balanceOf(user1))

      const oTokenToUnderlying = oTokenAmount.times(new BigNumber(10).exponentiatedBy(10))

      await otoken.approve(marginPool.address, oTokenAmount, { from: user1 })
      await marginPool.borrow(otoken.address, oTokenAmount, { from: user1 })

      const oTokenBalanceBefore = await otoken.balanceOf(user1)
      const amtBorrowableBefore = await marginPool.borrowable(user1, otoken.address)
      const marginPoolBalanceBefore = new BigNumber(await usdc.balanceOf(marginPool.address))

      await usdc.approve(marginPool.address, oTokenToUnderlying, { from: user1 })

      await marginPool.repay(otoken.address, oTokenToUnderlying, { from: user1 })

      const oTokenBalanceAfter = await otoken.balanceOf(user1)
      const amtBorrowableAfter = await marginPool.borrowable(user1, otoken.address)
      const marginPoolBalanceAfter = new BigNumber(await usdc.balanceOf(marginPool.address))

      assert.equal(
        new BigNumber(oTokenToUnderlying).toString(),
        new BigNumber(amtBorrowableAfter).minus(amtBorrowableBefore).toString(),
        'Borrowable amount mismatch',
      )

      assert.equal(
        new BigNumber(oTokenToUnderlying).toString(),
        new BigNumber(marginPoolBalanceAfter).minus(marginPoolBalanceBefore).toString(),
        'WETH value transfered to margin pool mismatch',
      )
    })
  })

  describe('Repay For', () => {
    beforeEach(async () => {
      otoken = await Otoken.new()

      await otoken.init(addressBook.address, weth.address, usdc.address, usdc.address, strikePrice, expiry, isPut, {
        from: owner,
      })

      await marginPool.setBorrowerWhitelistedStatus(random, true, { from: owner })
      await marginPool.setBorrowerWhitelistedStatus(user1, true, { from: owner })
      await otoken.mintOtoken(user1, otokenAmount, { from: controllerAddress })
      await marginPool.setBorrowPCT(await otoken.collateralAsset(), TOTAL_PCT, { from: owner })
      await whitelist.whitelistOtoken(otoken.address)
    })

    it('should revert if repaying for zero address', async () => {
      const oTokenAmount = new BigNumber(await otoken.balanceOf(user1))
      const oTokenToUnderlying = oTokenAmount.times(new BigNumber(10).exponentiatedBy(10))

      await otoken.approve(marginPool.address, oTokenAmount, { from: user1 })
      await marginPool.borrow(otoken.address, oTokenAmount, { from: user1 })
      await expectRevert(
        marginPool.repayFor(otoken.address, oTokenToUnderlying.plus(1), ZERO_ADDR, { from: random }),
        'MarginPool: Borrower cannot be zero address',
      )

      await usdc.approve(marginPool.address, oTokenToUnderlying, { from: user1 })
      await marginPool.repay(otoken.address, oTokenToUnderlying, { from: user1 })
    })

    it('should revert borrowing if repaying 0 of underlying', async () => {
      await expectRevert(
        marginPool.repay(otoken.address, 0, { from: user1 }),
        'MarginPool: Cannot repay 0 of underlying',
      )
    })

    it('should revert if repaying more than outstanding borrow', async () => {
      const oTokenAmount = new BigNumber(await otoken.balanceOf(user1))
      const oTokenToUnderlying = oTokenAmount.times(new BigNumber(10).exponentiatedBy(10))

      await otoken.approve(marginPool.address, oTokenAmount, { from: user1 })
      await marginPool.borrow(otoken.address, oTokenAmount, { from: user1 })
      await expectRevert(
        marginPool.repayFor(otoken.address, oTokenToUnderlying.plus(1), user1, { from: random }),
        'MarginPool: Repaying more than outstanding borrow amount',
      )

      await usdc.approve(marginPool.address, oTokenToUnderlying, { from: user1 })
      await marginPool.repay(otoken.address, oTokenToUnderlying, { from: user1 })
    })

    it('should repay the outstanding borrow', async () => {
      const oTokenAmount = new BigNumber(await otoken.balanceOf(user1))
      const oTokenToUnderlying = oTokenAmount.times(new BigNumber(10).exponentiatedBy(10))

      await otoken.approve(marginPool.address, oTokenAmount, { from: user1 })
      await marginPool.borrow(otoken.address, oTokenAmount, { from: user1 })

      const oTokenBalanceBefore = await otoken.balanceOf(user1)
      const amtBorrowableBefore = await marginPool.borrowable(user1, otoken.address)
      const marginPoolBalanceBefore = new BigNumber(await usdc.balanceOf(marginPool.address))

      await usdc.transfer(random, oTokenToUnderlying, { from: user1 })

      await usdc.approve(marginPool.address, oTokenToUnderlying, { from: random })

      await marginPool.repayFor(otoken.address, oTokenToUnderlying, user1, { from: random })

      const oTokenBalanceAfter = await otoken.balanceOf(user1)
      const amtBorrowableAfter = await marginPool.borrowable(user1, otoken.address)
      const marginPoolBalanceAfter = new BigNumber(await usdc.balanceOf(marginPool.address))

      assert.equal(oTokenBalanceAfter.toString(), oTokenAmount.toString(), 'oToken amount mismatch')

      assert.equal(
        new BigNumber(oTokenToUnderlying).toString(),
        new BigNumber(amtBorrowableAfter).minus(amtBorrowableBefore).toString(),
        'Borrowable amount mismatch',
      )

      assert.equal(
        new BigNumber(oTokenToUnderlying).toString(),
        new BigNumber(marginPoolBalanceAfter).minus(marginPoolBalanceBefore).toString(),
        'WETH value transfered to margin pool mismatch',
      )
    })
  })
})
