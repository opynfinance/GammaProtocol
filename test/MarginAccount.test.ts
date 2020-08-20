import {
  MarginAccountTesterInstance,
  MockERC20Instance,
  OtokenInstance,
  MockAddressBookInstance,
} from '../build/types/truffle-types'
import {BigNumber} from 'bignumber.js'

const {expectRevert} = require('@openzeppelin/test-helpers')

const Otoken = artifacts.require('Otoken.sol')
const MockERC20 = artifacts.require('MockERC20.sol')
const MarginAccountTester = artifacts.require('MarginAccountTester.sol')
const MockAddressBook = artifacts.require('MockAddressBook')
const ZERO_ADDR = '0x0000000000000000000000000000000000000000'
const ETH_ADDR = ZERO_ADDR

contract('MarginAccount', ([deployer, vaultOwner1, controller]) => {
  let weth: MockERC20Instance
  let usdc: MockERC20Instance
  let otoken: OtokenInstance
  let otoken2: OtokenInstance
  let addressBook: MockAddressBookInstance
  let marginAccountTester: MarginAccountTesterInstance

  // let expiry: number;
  const strikePrice = new BigNumber(200).times(new BigNumber(10).exponentiatedBy(18))
  const expiry = 1601020800 // 2020/09/25 0800 UTC
  const isPut = true

  const testAccount: {owner: string; vaultCounter: BigNumber} = {owner: ZERO_ADDR, vaultCounter: new BigNumber(0)}
  let account: {owner: string; vaultCounter: BigNumber}

  before('Deployment', async () => {
    // deploy WETH token
    weth = await MockERC20.new('WETH', 'WETH')
    // usdc
    usdc = await MockERC20.new('USDC', 'USDC')
    // deploy AddressBook token
    addressBook = await MockAddressBook.new()
    await addressBook.setController(controller)
    // deploy otoken
    otoken = await Otoken.new(addressBook.address)
    await otoken.init(ETH_ADDR, usdc.address, usdc.address, strikePrice, expiry, isPut, {from: deployer})
    // deploy second otoken
    otoken2 = await Otoken.new(addressBook.address)
    await otoken2.init(ETH_ADDR, usdc.address, usdc.address, strikePrice, expiry, isPut, {from: deployer})
    // margin account
    marginAccountTester = await MarginAccountTester.new()
  })

  describe('Open new vault', () => {
    it('should open a new vault', async () => {
      await marginAccountTester.testOpenNewVault({from: vaultOwner1})
      const account = await marginAccountTester.getAccount({from: vaultOwner1})
      const vaultCounter = new BigNumber(account.vaultCounter)
      assert.equal(account.vaultCounter.toString(), '1', 'vaultCounter is not 1 after new vault opened')

      const vault = await marginAccountTester.getVault(vaultCounter.minus(1))
      assert.equal(vault.shortAmounts.length, 0, 'shortAmounts length should be 0')
      assert.equal(vault.longAmounts.length, 0, 'longAmounts length should be 0')
      assert.equal(vault.collateralAmounts.length, 0, 'collateralAmounts length should be 0')
      assert.equal(vault.shortOtokens.length, 0, 'shortOtokens length should be 0')
      assert.equal(vault.longOtokens.length, 0, 'longOtokens length should be 0')
      assert.equal(vault.collateralAssets.length, 0, 'collateralAssets length should be 0')
    })
  })

  describe('Add short', async () => {
    it('should add short otokens', async () => {
      const account = await marginAccountTester.getAccount({from: vaultOwner1})
      const vaultCounter = new BigNumber(account.vaultCounter)

      await marginAccountTester.testAddShort(vaultCounter.minus(1), otoken.address, 10, 0)
      const vault = await marginAccountTester.getVault(vaultCounter.minus(1))
      assert.equal(vault.shortAmounts[vault.shortAmounts.length - 1], new BigNumber(10))
    })

    it('should add a different short otokens to a different index', async () => {
      const account = await marginAccountTester.getAccount({from: vaultOwner1})
      const vaultCounter = new BigNumber(account.vaultCounter)

      await marginAccountTester.testAddShort(vaultCounter.minus(1), otoken2.address, 11, 1)
      const vault = await marginAccountTester.getVault(vaultCounter.minus(1))
      assert.equal(vault.shortAmounts[vault.shortAmounts.length - 1], new BigNumber(11))
    })

    it('should add more amount of the second short otoken', async () => {
      const account = await marginAccountTester.getAccount({from: vaultOwner1})
      const vaultCounter = new BigNumber(account.vaultCounter)

      await marginAccountTester.testAddShort(vaultCounter.minus(1), otoken2.address, 12, 1)
      const vault = await marginAccountTester.getVault(vaultCounter.minus(1))
      assert.equal(vault.shortAmounts[vault.shortAmounts.length - 1], new BigNumber(23))
    })

    it('should revert if trying to add wrong otoken to an index', async () => {
      const account = await marginAccountTester.getAccount({from: vaultOwner1})
      const vaultCounter = new BigNumber(account.vaultCounter)

      await expectRevert(
        marginAccountTester.testAddShort(vaultCounter.minus(1), otoken.address, 10, 1),
        'MarginAccount: invalid short otoken position',
      )
    })
  })

  describe('Remove short', () => {
    it('should remove some of the short otokens', async () => {
      const index = 0
      const toRemove = 5
      const account = await marginAccountTester.getAccount({from: vaultOwner1})
      const vaultCounter = new BigNumber(account.vaultCounter)
      const vaultBefore = await marginAccountTester.getVault(vaultCounter.minus(1))

      await marginAccountTester.testRemoveShort(vaultCounter.minus(1), otoken.address, toRemove, index)
      const vaultAfter = await marginAccountTester.getVault(vaultCounter.minus(1))

      assert.equal(
        new BigNumber(vaultBefore.shortAmounts[index]).minus(new BigNumber(vaultAfter.shortAmounts[index])).toString(),
        new BigNumber(toRemove).toString(),
        'short amount removed mismatch',
      )
    })

    it('should be able to remove all of the remaining amount of first short otoken and delete short otoken address', async () => {
      const account = await marginAccountTester.getAccount({from: vaultOwner1})
      const vaultCounter = new BigNumber(account.vaultCounter)
      const vaultBefore = await marginAccountTester.getVault(vaultCounter.minus(1))
      const index = 0
      const toRemove = vaultBefore.shortAmounts[index]

      await marginAccountTester.testRemoveShort(vaultCounter.minus(1), otoken.address, toRemove, index)
      const vaultAfter = await marginAccountTester.getVault(vaultCounter.minus(1))

      assert.equal(
        new BigNumber(vaultBefore.shortAmounts[index]).minus(new BigNumber(vaultAfter.shortAmounts[index])).toString(),
        new BigNumber(toRemove).toString(),
        'short amount removed mismatch',
      )
      assert.equal(vaultAfter.shortOtokens[index], ZERO_ADDR, 'short otken address mismatch')
    })

    it('should revert when trying to remove wrong short otoken from an index', async () => {
      const account = await marginAccountTester.getAccount({from: vaultOwner1})
      const vaultCounter = new BigNumber(account.vaultCounter)

      await expectRevert(
        marginAccountTester.testRemoveShort(vaultCounter.minus(1), otoken2.address, 1, 0),
        'MarginAccount: short otoken address mismatch',
      )
    })

    it('should be able to add different short in the index of the old short otoken without increase short array length', async () => {
      const account = await marginAccountTester.getAccount({from: vaultOwner1})
      const vaultCounter = new BigNumber(account.vaultCounter)
      const vaultBefore = await marginAccountTester.getVault(vaultCounter.minus(1))

      await marginAccountTester.testAddShort(vaultCounter.minus(1), otoken2.address, 10, 0)
      const vaultAfter = await marginAccountTester.getVault(vaultCounter.minus(1))
      assert.equal(vaultAfter.shortAmounts[0], new BigNumber(10))
      assert.equal(
        vaultBefore.shortOtokens.length,
        vaultAfter.shortOtokens.length,
        'short otokens array length mismatch',
      )
    })
  })

  describe('Add long', () => {
    it('should add long otokens', async () => {
      const index = 0
      const amount = 10
      const account = await marginAccountTester.getAccount({from: vaultOwner1})
      const vaultCounter = new BigNumber(account.vaultCounter)

      await marginAccountTester.testAddLong(vaultCounter.minus(1), otoken.address, amount, index)
      const vault = await marginAccountTester.getVault(vaultCounter.minus(1))
      assert.equal(vault.longAmounts[index], new BigNumber(amount))
    })

    it('should add a different long otoken', async () => {
      const index = 1
      const amount = 10
      const account = await marginAccountTester.getAccount({from: vaultOwner1})
      const vaultCounter = new BigNumber(account.vaultCounter)

      await marginAccountTester.testAddLong(vaultCounter.minus(1), otoken2.address, amount, index)
      const vault = await marginAccountTester.getVault(vaultCounter.minus(1))
      assert.equal(vault.longAmounts[index], new BigNumber(amount))
    })

    it('should add more amount of the second long otoken', async () => {
      const index = 1
      const amount = 10
      const account = await marginAccountTester.getAccount({from: vaultOwner1})
      const vaultCounter = new BigNumber(account.vaultCounter)

      await marginAccountTester.testAddLong(vaultCounter.minus(1), otoken2.address, amount, index)
      const vault = await marginAccountTester.getVault(vaultCounter.minus(1))
      assert.equal(vault.longAmounts[index], new BigNumber(20))
    })

    it('should revert if trying to add wrong otoken to an index', async () => {
      const index = 1
      const amount = 10
      const account = await marginAccountTester.getAccount({from: vaultOwner1})
      const vaultCounter = new BigNumber(account.vaultCounter)

      await expectRevert(
        marginAccountTester.testAddLong(vaultCounter.minus(1), otoken.address, amount, index),
        'MarginAccount: invalid long otoken position',
      )
    })
  })

  describe('Remove long', () => {
    it('should remove some of the long otokens', async () => {
      const index = 0
      const toRemove = 5
      const account = await marginAccountTester.getAccount({from: vaultOwner1})
      const vaultCounter = new BigNumber(account.vaultCounter)
      const vaultBefore = await marginAccountTester.getVault(vaultCounter.minus(1))

      await marginAccountTester.testRemoveLong(vaultCounter.minus(1), otoken.address, toRemove, index)
      const vaultAfter = await marginAccountTester.getVault(vaultCounter.minus(1))

      assert.equal(
        new BigNumber(vaultBefore.longAmounts[index]).minus(new BigNumber(vaultAfter.longAmounts[index])).toString(),
        new BigNumber(toRemove).toString(),
        'long amount removed mismatch',
      )
    })

    it('should be able to remove all of the remaining amount of first long otoken and delete long otoken address', async () => {
      const account = await marginAccountTester.getAccount({from: vaultOwner1})
      const vaultCounter = new BigNumber(account.vaultCounter)
      const vaultBefore = await marginAccountTester.getVault(vaultCounter.minus(1))
      const index = 0
      const toRemove = vaultBefore.longAmounts[index]

      await marginAccountTester.testRemoveLong(vaultCounter.minus(1), otoken.address, toRemove, index)
      const vaultAfter = await marginAccountTester.getVault(vaultCounter.minus(1))

      assert.equal(
        new BigNumber(vaultBefore.longAmounts[index]).minus(new BigNumber(vaultAfter.longAmounts[index])).toString(),
        new BigNumber(toRemove).toString(),
        'long amount removed mismatch',
      )
      assert.equal(vaultAfter.longOtokens[index], ZERO_ADDR, 'short otken address mismatch')
    })

    it('should revert when trying to remove wrong long otoken from an index', async () => {
      const account = await marginAccountTester.getAccount({from: vaultOwner1})
      const vaultCounter = new BigNumber(account.vaultCounter)

      await expectRevert(
        marginAccountTester.testRemoveLong(vaultCounter.minus(1), otoken2.address, 1, 0),
        'MarginAccount: long otoken address mismatch',
      )
    })

    it('should be able to add different long in the index of the old long otoken without increase long array length', async () => {
      const account = await marginAccountTester.getAccount({from: vaultOwner1})
      const vaultCounter = new BigNumber(account.vaultCounter)
      const vaultBefore = await marginAccountTester.getVault(vaultCounter.minus(1))

      await marginAccountTester.testAddLong(vaultCounter.minus(1), otoken2.address, 10, 0)
      const vaultAfter = await marginAccountTester.getVault(vaultCounter.minus(1))
      assert.equal(vaultAfter.shortAmounts[0], new BigNumber(10))
      assert.equal(vaultBefore.longOtokens.length, vaultAfter.longOtokens.length, 'long otokens array length mismatch')
    })
  })

  describe('Add collateral', () => {
    it('should add weth collateral', async () => {
      const index = 0
      const amount = 10
      const account = await marginAccountTester.getAccount({from: vaultOwner1})
      const vaultCounter = new BigNumber(account.vaultCounter)

      await marginAccountTester.testAddCollateral(vaultCounter.minus(1), weth.address, amount, index)
      const vault = await marginAccountTester.getVault(vaultCounter.minus(1))
      assert.equal(vault.collateralAmounts[index], new BigNumber(amount))
    })

    it('should add some more weth collateral', async () => {
      const changeAmt = 20
      const index = 0
      const account = await marginAccountTester.getAccount({from: vaultOwner1})
      const vaultCounter = new BigNumber(account.vaultCounter)
      const vaultBefore = await marginAccountTester.getVault(vaultCounter.minus(1))

      await marginAccountTester.testAddCollateral(vaultCounter.minus(1), weth.address, changeAmt, index)
      const vaultAfter = await marginAccountTester.getVault(vaultCounter.minus(1))

      assert.equal(
        new BigNumber(vaultAfter.collateralAmounts[index])
          .minus(new BigNumber(vaultBefore.collateralAmounts[index]))
          .toString(),
        changeAmt.toString(),
      )
    })

    it('should add usdc collateral', async () => {
      const index = 1
      const amount = 20
      const account = await marginAccountTester.getAccount({from: vaultOwner1})
      const vaultCounter = new BigNumber(account.vaultCounter)

      await marginAccountTester.testAddCollateral(vaultCounter.minus(1), usdc.address, amount, index)
      const vault = await marginAccountTester.getVault(vaultCounter.minus(1))
      assert.equal(vault.collateralAmounts[index], new BigNumber(amount))
    })

    it('should revert if adding usdc collateral to wrong index', async () => {
      const changeAmt = 10
      const index = 0
      const account = await marginAccountTester.getAccount({from: vaultOwner1})
      const vaultCounter = new BigNumber(account.vaultCounter)

      await expectRevert(
        marginAccountTester.testAddCollateral(vaultCounter.minus(1), usdc.address, changeAmt, index),
        'MarginAccount: invalid collateral token position',
      )
    })

    it('should add some more usdc collateral', async () => {
      const changeAmt = 30
      const index = 1
      const account = await marginAccountTester.getAccount({from: vaultOwner1})
      const vaultCounter = new BigNumber(account.vaultCounter)
      const vaultBefore = await marginAccountTester.getVault(vaultCounter.minus(1))

      await marginAccountTester.testAddCollateral(vaultCounter.minus(1), usdc.address, changeAmt, index)
      const vaultAfter = await marginAccountTester.getVault(vaultCounter.minus(1))

      assert.equal(
        new BigNumber(vaultAfter.collateralAmounts[index])
          .minus(new BigNumber(vaultBefore.collateralAmounts[index]))
          .toString(),
        changeAmt.toString(),
      )
    })

    it('should revert if trying to add WETH as collateral to wrong index', async () => {
      const changeAmt = 10
      const index = 1
      const account = await marginAccountTester.getAccount({from: vaultOwner1})
      const vaultCounter = new BigNumber(account.vaultCounter)

      await expectRevert(
        marginAccountTester.testAddCollateral(vaultCounter.minus(1), otoken.address, changeAmt, index),
        'MarginAccount: invalid collateral token position',
      )
    })
  })

  describe('Remove collateral', () => {
    it('should remove some of the collateral asset', async () => {
      const index = 0
      const toRemove = 5
      const account = await marginAccountTester.getAccount({from: vaultOwner1})
      const vaultCounter = new BigNumber(account.vaultCounter)
      const vaultBefore = await marginAccountTester.getVault(vaultCounter.minus(1))

      await marginAccountTester.testRemoveCollateral(vaultCounter.minus(1), weth.address, toRemove, index)
      const vaultAfter = await marginAccountTester.getVault(vaultCounter.minus(1))

      assert.equal(
        new BigNumber(vaultBefore.collateralAmounts[index])
          .minus(new BigNumber(vaultAfter.collateralAmounts[index]))
          .toString(),
        new BigNumber(toRemove).toString(),
        'collateral amount removed mismatch',
      )
    })

    it('should be able to remove all of the remaining amount of first collateral asset and delete collateral asset address', async () => {
      const account = await marginAccountTester.getAccount({from: vaultOwner1})
      const vaultCounter = new BigNumber(account.vaultCounter)
      const vaultBefore = await marginAccountTester.getVault(vaultCounter.minus(1))
      const index = 0
      const toRemove = vaultBefore.collateralAmounts[index]

      await marginAccountTester.testRemoveCollateral(vaultCounter.minus(1), weth.address, toRemove, index)
      const vaultAfter = await marginAccountTester.getVault(vaultCounter.minus(1))

      assert.equal(
        new BigNumber(vaultBefore.collateralAmounts[index])
          .minus(new BigNumber(vaultAfter.collateralAmounts[index]))
          .toString(),
        new BigNumber(toRemove).toString(),
        'collateral amount removed mismatch',
      )
      assert.equal(vaultAfter.collateralAssets[index], ZERO_ADDR, 'collateral asset address mismatch')
    })

    it('should revert when trying to remove wrong collateral asset from an index', async () => {
      const account = await marginAccountTester.getAccount({from: vaultOwner1})
      const vaultCounter = new BigNumber(account.vaultCounter)

      await expectRevert(
        marginAccountTester.testRemoveCollateral(vaultCounter.minus(1), weth.address, 1, 0),
        'MarginAccount: collateral token address mismatch',
      )
    })

    it('should be able to add different collateral asset in the index of the old collateral asset without increase collateral array length', async () => {
      const account = await marginAccountTester.getAccount({from: vaultOwner1})
      const vaultCounter = new BigNumber(account.vaultCounter)
      const vaultBefore = await marginAccountTester.getVault(vaultCounter.minus(1))

      await marginAccountTester.testAddCollateral(vaultCounter.minus(1), usdc.address, 10, 0)
      const vaultAfter = await marginAccountTester.getVault(vaultCounter.minus(1))

      assert.equal(vaultAfter.collateralAmounts[0], new BigNumber(10))
      assert.equal(
        vaultBefore.collateralAssets.length,
        vaultAfter.collateralAssets.length,
        'collateral asset array length mismatch',
      )
    })
  })

  describe('Clear vault', () => {
    it('should clear vault', async () => {
      const account = await marginAccountTester.getAccount({from: vaultOwner1})
      const vaultCounter = new BigNumber(account.vaultCounter)

      await marginAccountTester.testClearVault(vaultCounter.minus(1))
      const vault = await marginAccountTester.getVault(vaultCounter.minus(1))
      assert.equal(vault.shortAmounts.length, 0, 'shortAmounts length should be 0')
      assert.equal(vault.longAmounts.length, 0, 'longAmounts length should be 0')
      assert.equal(vault.collateralAmounts.length, 0, 'collateralAmounts length should be 0')
      assert.equal(vault.shortOtokens.length, 0, 'shortOtokens length should be 0')
      assert.equal(vault.longOtokens.length, 0, 'longOtokens length should be 0')
      assert.equal(vault.collateralAssets.length, 0, 'collateralAssets length should be 0')
    })
  })
})
