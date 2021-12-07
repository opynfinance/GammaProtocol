import {
  MarginVaultTesterInstance,
  MockERC20Instance,
  OtokenInstance,
  MockAddressBookInstance,
} from '../../build/types/truffle-types'
import { BigNumber } from 'bignumber.js'
import { createTokenAmount } from '../utils'

const { expectRevert } = require('@openzeppelin/test-helpers')

const Otoken = artifacts.require('Otoken.sol')
const MockERC20 = artifacts.require('MockERC20.sol')
const MarginVaultTester = artifacts.require('MarginVaultTester.sol')
const MockAddressBook = artifacts.require('MockAddressBook')
const MarginVault = artifacts.require('MarginVault.sol')

const ZERO_ADDR = '0x0000000000000000000000000000000000000000'

contract('MarginVault', ([deployer, controller]) => {
  let weth: MockERC20Instance
  let usdc: MockERC20Instance
  let otoken: OtokenInstance
  let otoken2: OtokenInstance
  let addressBook: MockAddressBookInstance
  let marginVaultTester: MarginVaultTesterInstance

  // let expiry: number;
  const strikePrice = createTokenAmount(200)
  const expiry = 1601020800 // 2020/09/25 0800 UTC
  const isPut = true

  before('Deployment', async () => {
    // deploy WETH token
    weth = await MockERC20.new('WETH', 'WETH', 18)
    // usdc
    usdc = await MockERC20.new('USDC', 'USDC', 6)
    // deploy AddressBook token
    addressBook = await MockAddressBook.new()
    await addressBook.setController(controller)
    // deploy otoken
    otoken = await Otoken.new()
    await otoken.init(addressBook.address, weth.address, usdc.address, usdc.address, strikePrice, expiry, isPut, {
      from: deployer,
    })
    // deploy second otoken
    otoken2 = await Otoken.new()
    await otoken2.init(addressBook.address, weth.address, usdc.address, usdc.address, strikePrice, expiry, isPut, {
      from: deployer,
    })
    // margin vault
    const lib = await MarginVault.new()
    await MarginVaultTester.link('MarginVault', lib.address)
    marginVaultTester = await MarginVaultTester.new()
  })

  describe('Add short', async () => {
    it('should revert if trying to add short otoken with index greater than short otoken array length', async () => {
      const vaultCounter = new BigNumber(0)
      await expectRevert(marginVaultTester.testAddShort(vaultCounter, otoken.address, 10, 4), 'V2')
    })

    it('should add short otokens', async () => {
      const vaultCounter = new BigNumber(0)

      await marginVaultTester.testAddShort(vaultCounter, otoken.address, 10, 0)
      const vault = await marginVaultTester.getVault(vaultCounter)
      assert.equal(vault.shortAmounts[vault.shortAmounts.length - 1], new BigNumber(10))
    })

    it('should revert when adding 0 short', async () => {
      const vaultCounter = new BigNumber(0)

      await expectRevert(marginVaultTester.testAddShort(vaultCounter, otoken.address, 0, 0), 'V1')
    })

    it('should add a different short otokens to a different index', async () => {
      const vaultCounter = new BigNumber(0)

      await marginVaultTester.testAddShort(vaultCounter, otoken2.address, 11, 1)
      const vault = await marginVaultTester.getVault(vaultCounter)
      assert.equal(vault.shortAmounts[vault.shortAmounts.length - 1], new BigNumber(11))
    })

    it('should add more amount of the second short otoken', async () => {
      const vaultCounter = new BigNumber(0)

      await marginVaultTester.testAddShort(vaultCounter, otoken2.address, 12, 1)
      const vault = await marginVaultTester.getVault(vaultCounter)
      assert.equal(vault.shortAmounts[vault.shortAmounts.length - 1], new BigNumber(23))
    })

    it('should revert if trying to add wrong short otoken to an index', async () => {
      const vaultCounter = new BigNumber(0)

      await expectRevert(marginVaultTester.testAddShort(vaultCounter, otoken.address, 10, 1), 'V3')
    })
  })

  describe('Remove short', () => {
    it('should remove some of the short otokens', async () => {
      const index = 0
      const toRemove = 5
      const vaultCounter = new BigNumber(0)
      const vaultBefore = await marginVaultTester.getVault(vaultCounter)

      await marginVaultTester.testRemoveShort(vaultCounter, otoken.address, toRemove, index)
      const vaultAfter = await marginVaultTester.getVault(vaultCounter)

      assert.equal(
        new BigNumber(vaultBefore.shortAmounts[index]).minus(new BigNumber(vaultAfter.shortAmounts[index])).toString(),
        new BigNumber(toRemove).toString(),
        'short amount removed mismatch',
      )
    })

    it('should be able to remove all of the remaining amount of first short otoken and delete short otoken address', async () => {
      const vaultCounter = new BigNumber(0)
      const vaultBefore = await marginVaultTester.getVault(vaultCounter)
      const index = 0
      const toRemove = vaultBefore.shortAmounts[index]

      await marginVaultTester.testRemoveShort(vaultCounter, otoken.address, toRemove, index)
      const vaultAfter = await marginVaultTester.getVault(vaultCounter)

      assert.equal(
        new BigNumber(vaultBefore.shortAmounts[index]).minus(new BigNumber(vaultAfter.shortAmounts[index])).toString(),
        new BigNumber(toRemove).toString(),
        'short amount removed mismatch',
      )
      assert.equal(vaultAfter.shortOtokens[index], ZERO_ADDR, 'short otken address mismatch')
    })

    it('should revert when trying to remove wrong short otoken from an index', async () => {
      const vaultCounter = new BigNumber(0)

      await expectRevert(marginVaultTester.testRemoveShort(vaultCounter, otoken2.address, 1, 0), 'V3')
    })

    it('should be able to add different short in the index of the old short otoken without increase short array length', async () => {
      const vaultCounter = new BigNumber(0)
      const vaultBefore = await marginVaultTester.getVault(vaultCounter)

      await marginVaultTester.testAddShort(vaultCounter, otoken2.address, 10, 0)
      const vaultAfter = await marginVaultTester.getVault(vaultCounter)
      assert.equal(vaultAfter.shortAmounts[0], new BigNumber(10))
      assert.equal(
        vaultBefore.shortOtokens.length,
        vaultAfter.shortOtokens.length,
        'short otokens array length mismatch',
      )
    })
  })

  describe('Add long', () => {
    it('should revert if trying to add long otoken with index greater than long otoken array length', async () => {
      const vaultCounter = new BigNumber(0)

      await expectRevert(marginVaultTester.testAddLong(vaultCounter, otoken.address, 10, 4), 'V5')
    })

    it('should add long otokens', async () => {
      const index = 0
      const amount = 10
      const vaultCounter = new BigNumber(0)

      await marginVaultTester.testAddLong(vaultCounter, otoken.address, amount, index)
      const vault = await marginVaultTester.getVault(vaultCounter)
      assert.equal(vault.longAmounts[index], new BigNumber(amount))
    })

    it('should add a different long otoken', async () => {
      const index = 1
      const amount = 10
      const vaultCounter = new BigNumber(0)

      await marginVaultTester.testAddLong(vaultCounter, otoken2.address, amount, index)
      const vault = await marginVaultTester.getVault(vaultCounter)
      assert.equal(vault.longAmounts[index], new BigNumber(amount))
    })

    it('should add more amount of the second long otoken', async () => {
      const index = 1
      const amount = 10
      const vaultCounter = new BigNumber(0)

      await marginVaultTester.testAddLong(vaultCounter, otoken2.address, amount, index)
      const vault = await marginVaultTester.getVault(vaultCounter)
      assert.equal(vault.longAmounts[index], new BigNumber(20))
    })

    it('should revert if trying to add wrong long otoken to an index', async () => {
      const index = 1
      const amount = 10
      const vaultCounter = new BigNumber(0)

      await expectRevert(marginVaultTester.testAddLong(vaultCounter, otoken.address, amount, index), 'V6')
    })
  })

  describe('Remove long', () => {
    it('should remove some of the long otokens', async () => {
      const index = 0
      const toRemove = 5
      const vaultCounter = new BigNumber(0)
      const vaultBefore = await marginVaultTester.getVault(vaultCounter)

      await marginVaultTester.testRemoveLong(vaultCounter, otoken.address, toRemove, index)
      const vaultAfter = await marginVaultTester.getVault(vaultCounter)

      assert.equal(
        new BigNumber(vaultBefore.longAmounts[index]).minus(new BigNumber(vaultAfter.longAmounts[index])).toString(),
        new BigNumber(toRemove).toString(),
        'long amount removed mismatch',
      )
    })

    it('should be able to remove all of the remaining amount of first long otoken and delete long otoken address', async () => {
      const vaultCounter = new BigNumber(0)
      const vaultBefore = await marginVaultTester.getVault(vaultCounter)
      const index = 0
      const toRemove = vaultBefore.longAmounts[index]

      await marginVaultTester.testRemoveLong(vaultCounter, otoken.address, toRemove, index)
      const vaultAfter = await marginVaultTester.getVault(vaultCounter)

      assert.equal(
        new BigNumber(vaultBefore.longAmounts[index]).minus(new BigNumber(vaultAfter.longAmounts[index])).toString(),
        new BigNumber(toRemove).toString(),
        'long amount removed mismatch',
      )
      assert.equal(vaultAfter.longOtokens[index], ZERO_ADDR, 'short otken address mismatch')
    })

    it('should revert when trying to remove wrong long otoken from an index', async () => {
      const vaultCounter = new BigNumber(0)

      await expectRevert(marginVaultTester.testRemoveLong(vaultCounter, otoken2.address, 1, 0), 'V6')
    })

    it('should be able to add different long in the index of the old long otoken without increase long array length', async () => {
      const vaultCounter = new BigNumber(0)
      const vaultBefore = await marginVaultTester.getVault(vaultCounter)

      await marginVaultTester.testAddLong(vaultCounter, otoken2.address, 10, 0)
      const vaultAfter = await marginVaultTester.getVault(vaultCounter)
      assert.equal(vaultAfter.shortAmounts[0], new BigNumber(10))
      assert.equal(vaultBefore.longOtokens.length, vaultAfter.longOtokens.length, 'long otokens array length mismatch')
    })
  })

  describe('Add collateral', () => {
    it('should revert if trying to add collateral asset with index greater than collateral asset array length', async () => {
      const vaultCounter = new BigNumber(0)

      await expectRevert(marginVaultTester.testAddCollateral(vaultCounter, weth.address, 10, 4), 'V8')
    })

    it('should add weth collateral', async () => {
      const index = 0
      const amount = 10
      const vaultCounter = new BigNumber(0)

      await marginVaultTester.testAddCollateral(vaultCounter, weth.address, amount, index)
      const vault = await marginVaultTester.getVault(vaultCounter)
      assert.equal(vault.collateralAmounts[index], new BigNumber(amount))
    })

    it('should add some more weth collateral', async () => {
      const changeAmt = 20
      const index = 0
      const vaultCounter = new BigNumber(0)
      const vaultBefore = await marginVaultTester.getVault(vaultCounter)

      await marginVaultTester.testAddCollateral(vaultCounter, weth.address, changeAmt, index)
      const vaultAfter = await marginVaultTester.getVault(vaultCounter)

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
      const vaultCounter = new BigNumber(0)

      await marginVaultTester.testAddCollateral(vaultCounter, usdc.address, amount, index)
      const vault = await marginVaultTester.getVault(vaultCounter)
      assert.equal(vault.collateralAmounts[index], new BigNumber(amount))
    })

    it('should revert if adding usdc collateral to wrong index', async () => {
      const changeAmt = 10
      const index = 0
      const vaultCounter = new BigNumber(0)

      await expectRevert(marginVaultTester.testAddCollateral(vaultCounter, usdc.address, changeAmt, index), 'V9')
    })

    it('should add some more usdc collateral', async () => {
      const changeAmt = 30
      const index = 1
      const vaultCounter = new BigNumber(0)
      const vaultBefore = await marginVaultTester.getVault(vaultCounter)

      await marginVaultTester.testAddCollateral(vaultCounter, usdc.address, changeAmt, index)
      const vaultAfter = await marginVaultTester.getVault(vaultCounter)

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
      const vaultCounter = new BigNumber(0)

      await expectRevert(marginVaultTester.testAddCollateral(vaultCounter, otoken.address, changeAmt, index), 'V9')
    })
  })

  describe('Remove collateral', () => {
    it('should remove some of the collateral asset', async () => {
      const index = 0
      const toRemove = 5
      const vaultCounter = new BigNumber(0)
      const vaultBefore = await marginVaultTester.getVault(vaultCounter)

      await marginVaultTester.testRemoveCollateral(vaultCounter, weth.address, toRemove, index)
      const vaultAfter = await marginVaultTester.getVault(vaultCounter)

      assert.equal(
        new BigNumber(vaultBefore.collateralAmounts[index])
          .minus(new BigNumber(vaultAfter.collateralAmounts[index]))
          .toString(),
        new BigNumber(toRemove).toString(),
        'collateral amount removed mismatch',
      )
    })

    it('should be able to remove all of the remaining amount of first collateral asset and delete collateral asset address', async () => {
      const vaultCounter = new BigNumber(0)
      const vaultBefore = await marginVaultTester.getVault(vaultCounter)
      const index = 0
      const toRemove = vaultBefore.collateralAmounts[index]

      await marginVaultTester.testRemoveCollateral(vaultCounter, weth.address, toRemove, index)
      const vaultAfter = await marginVaultTester.getVault(vaultCounter)

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
      const vaultCounter = new BigNumber(0)

      await expectRevert(marginVaultTester.testRemoveCollateral(vaultCounter, weth.address, 1, 0), 'V9')
    })

    it('should be able to add different collateral asset in the index of the old collateral asset without increase collateral array length', async () => {
      const vaultCounter = new BigNumber(0)
      const vaultBefore = await marginVaultTester.getVault(vaultCounter)

      await marginVaultTester.testAddCollateral(vaultCounter, usdc.address, 10, 0)
      const vaultAfter = await marginVaultTester.getVault(vaultCounter)

      assert.equal(vaultAfter.collateralAmounts[0], new BigNumber(10))
      assert.equal(
        vaultBefore.collateralAssets.length,
        vaultAfter.collateralAssets.length,
        'collateral asset array length mismatch',
      )
    })
  })
})
