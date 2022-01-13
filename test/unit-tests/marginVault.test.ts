import { MarginVaultTester, MockERC20, Otoken, MockAddressBook } from '../../typechain'

import { ethers, web3 } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { assert } from 'chai'
import { ContractFactory } from 'ethers'

const BigNumber = ethers.BigNumber
import { createTokenAmount } from '../utils'
const { expectRevert } = require('@openzeppelin/test-helpers')

describe('MarginVault', function () {
  let weth: MockERC20
  let usdc: MockERC20
  let otoken: Otoken
  let otoken2: Otoken
  let addressBook: MockAddressBook
  let marginVaultTester: MarginVaultTester

  // let expiry: number;
  const strikePrice = createTokenAmount(200)
  const expiry = 1601020800 // 2020/09/25 0800 UTC
  const isPut = true

  //accounts
  let deployer: SignerWithAddress;
  let controller: SignerWithAddress

  let accounts: SignerWithAddress[] = []

  //address(0)
  const ZERO_ADDR = '0x0000000000000000000000000000000000000000'

  let Otoken: ContractFactory
  let MockERC20: ContractFactory
  let MarginVaultTester: ContractFactory
  let MockAddressBook: ContractFactory
  let MarginVault: ContractFactory

  const usdcDecimals = 6
  const wethDecimals = 18

  this.beforeAll('Set up account', async () => {
    accounts = await ethers.getSigners()
    const [_deployer, _controller] = accounts

    deployer = _deployer
    controller = _controller
  })

  this.beforeAll('Initialize Contract Factory', async () => {
    Otoken = await ethers.getContractFactory('Otoken')
    MockERC20 = await ethers.getContractFactory('MockERC20')
    //MarginVaultTester = await ethers.getContractFactory('MarginVaultTester')
    MockAddressBook = await ethers.getContractFactory('MockAddressBook')
    MarginVault = await ethers.getContractFactory('MarginVault')
  })

  this.beforeAll('Deployment', async () => {
    // deploy WETH token
    weth = (await MockERC20.deploy('WETH', 'WETH', 18)) as MockERC20
    weth = await weth.deployed()
    // usdc
    usdc = (await MockERC20.deploy('USDC', 'USDC', 6)) as MockERC20
    usdc = await usdc.deployed()
    // deploy AddressBook token
    addressBook = (await MockAddressBook.deploy()) as MockAddressBook
    addressBook = await addressBook.deployed()
    await addressBook.setController(controller.address)
    // deploy otoken
    otoken = (await Otoken.deploy()) as Otoken
    otoken = await otoken.deployed()

    await otoken
      .connect(deployer)
      .init(addressBook.address, weth.address, usdc.address, usdc.address, strikePrice, expiry, isPut)

    // deploy second otoken
    otoken2 = (await Otoken.deploy()) as Otoken
    otoken2 = await otoken2.deployed()
    await otoken2
      .connect(deployer)
      .init(addressBook.address, weth.address, usdc.address, usdc.address, strikePrice, expiry, isPut)

    let lib = await MarginVault.deploy()
    lib = await lib.deployed()

    MarginVaultTester = await ethers.getContractFactory('MarginVaultTester', {
      libraries: {
        MarginVault: lib.address,
      },
    })

    marginVaultTester = (await MarginVaultTester.deploy()) as MarginVaultTester
    marginVaultTester = await marginVaultTester.deployed()
  })

  describe('Add short', async () => {
    it('should revert if trying to add short otoken with index greater than short otoken array length', async () => {
      const vaultCounter = BigNumber.from(0)
      await expectRevert(marginVaultTester.testAddShort(vaultCounter, otoken.address, 10, 4), 'V2')
    })

    it('should add short otokens', async () => {
      const vaultCounter = BigNumber.from(0)

      await marginVaultTester.testAddShort(vaultCounter, otoken.address, 10, 0)
      const vault = await marginVaultTester.getVault(vaultCounter)
      assert.equal(
        BigNumber.from(vault.shortAmounts[vault.shortAmounts.length - 1]).toString(),
        BigNumber.from(10).toString(),
      )
    })

    it('should revert when adding 0 short', async () => {
      const vaultCounter = BigNumber.from(0)

      await expectRevert(marginVaultTester.testAddShort(vaultCounter, otoken.address, 0, 0), 'V1')
    })

    it('should add a different short otokens to a different index', async () => {
      const vaultCounter = BigNumber.from(0)

      await marginVaultTester.testAddShort(vaultCounter, otoken2.address, 11, 1)
      const vault = await marginVaultTester.getVault(vaultCounter)
      assert.equal(
        BigNumber.from(vault.shortAmounts[vault.shortAmounts.length - 1]).toString(),
        BigNumber.from(11).toString(),
      )
    })

    it('should add more amount of the second short otoken', async () => {
      const vaultCounter = BigNumber.from(0)

      await marginVaultTester.testAddShort(vaultCounter, otoken2.address, 12, 1)
      const vault = await marginVaultTester.getVault(vaultCounter)
      assert.equal(
        BigNumber.from(vault.shortAmounts[vault.shortAmounts.length - 1]).toString(),
        BigNumber.from(23).toString(),
      )
    })

    it('should revert if trying to add wrong short otoken to an index', async () => {
      const vaultCounter = BigNumber.from(0)

      await expectRevert(marginVaultTester.testAddShort(vaultCounter, otoken.address, 10, 1), 'V3')
    })
  })

  describe('Remove short', () => {
    it('should remove some of the short otokens', async () => {
      const index = 0
      const toRemove = 5
      const vaultCounter = BigNumber.from(0)
      const vaultBefore = await marginVaultTester.getVault(vaultCounter)

      await marginVaultTester.testRemoveShort(vaultCounter, otoken.address, toRemove, index)
      const vaultAfter = await marginVaultTester.getVault(vaultCounter)

      assert.equal(
        BigNumber.from(vaultBefore.shortAmounts[index]).sub(BigNumber.from(vaultAfter.shortAmounts[index])).toString(),
        BigNumber.from(toRemove).toString(),
        'short amount removed mismatch',
      )
    })

    it('should be able to remove all of the remaining amount of first short otoken and delete short otoken address', async () => {
      const vaultCounter = BigNumber.from(0)
      const vaultBefore = await marginVaultTester.getVault(vaultCounter)
      const index = 0
      const toRemove = vaultBefore.shortAmounts[index]

      await marginVaultTester.testRemoveShort(vaultCounter, otoken.address, toRemove, index)
      const vaultAfter = await marginVaultTester.getVault(vaultCounter)

      assert.equal(
        BigNumber.from(vaultBefore.shortAmounts[index]).sub(BigNumber.from(vaultAfter.shortAmounts[index])).toString(),
        BigNumber.from(toRemove).toString(),
        'short amount removed mismatch',
      )
      assert.equal(vaultAfter.shortOtokens[index], ZERO_ADDR, 'short otken address mismatch')
    })

    it('should revert when trying to remove wrong short otoken from an index', async () => {
      const vaultCounter = BigNumber.from(0)

      await expectRevert(marginVaultTester.testRemoveShort(vaultCounter, otoken2.address, 1, 0), 'V3')
    })

    it('should be able to add different short in the index of the old short otoken without increase short array length', async () => {
      const vaultCounter = BigNumber.from(0)
      const vaultBefore = await marginVaultTester.getVault(vaultCounter)

      await marginVaultTester.testAddShort(vaultCounter, otoken2.address, 10, 0)
      const vaultAfter = await marginVaultTester.getVault(vaultCounter)
      assert.equal(BigNumber.from(vaultAfter.shortAmounts[0]).toString(), BigNumber.from(10).toString())
      assert.equal(
        vaultBefore.shortOtokens.length,
        vaultAfter.shortOtokens.length,
        'short otokens array length mismatch',
      )
    })
  })

  describe('Add long', () => {
    it('should revert if trying to add long otoken with index greater than long otoken array length', async () => {
      const vaultCounter = BigNumber.from(0)

      await expectRevert(marginVaultTester.testAddLong(vaultCounter, otoken.address, 10, 4), 'V5')
    })

    it('should add long otokens', async () => {
      const index = 0
      const amount = 10
      const vaultCounter = BigNumber.from(0)

      await marginVaultTester.testAddLong(vaultCounter, otoken.address, amount, index)
      const vault = await marginVaultTester.getVault(vaultCounter)
      assert.equal(BigNumber.from(vault.longAmounts[index]).toString(), BigNumber.from(amount).toString())
    })

    it('should add a different long otoken', async () => {
      const index = 1
      const amount = 10
      const vaultCounter = BigNumber.from(0)

      await marginVaultTester.testAddLong(vaultCounter, otoken2.address, amount, index)
      const vault = await marginVaultTester.getVault(vaultCounter)
      assert.equal(BigNumber.from(vault.longAmounts[index]).toString(), BigNumber.from(amount).toString())
    })

    it('should add more amount of the second long otoken', async () => {
      const index = 1
      const amount = 10
      const vaultCounter = BigNumber.from(0)

      await marginVaultTester.testAddLong(vaultCounter, otoken2.address, amount, index)
      const vault = await marginVaultTester.getVault(vaultCounter)
      assert.equal(BigNumber.from(vault.longAmounts[index]).toString(), BigNumber.from(20).toString())
    })

    it('should revert if trying to add wrong long otoken to an index', async () => {
      const index = 1
      const amount = 10
      const vaultCounter = BigNumber.from(0)

      await expectRevert(marginVaultTester.testAddLong(vaultCounter, otoken.address, amount, index), 'V6')
    })
  })

  describe('Remove long', () => {
    it('should remove some of the long otokens', async () => {
      const index = 0
      const toRemove = 5
      const vaultCounter = BigNumber.from(0)
      const vaultBefore = await marginVaultTester.getVault(vaultCounter)

      await marginVaultTester.testRemoveLong(vaultCounter, otoken.address, toRemove, index)
      const vaultAfter = await marginVaultTester.getVault(vaultCounter)

      assert.equal(
        BigNumber.from(vaultBefore.longAmounts[index]).sub(BigNumber.from(vaultAfter.longAmounts[index])).toString(),
        BigNumber.from(toRemove).toString(),
        'long amount removed mismatch',
      )
    })

    it('should be able to remove all of the remaining amount of first long otoken and delete long otoken address', async () => {
      const vaultCounter = BigNumber.from(0)
      const vaultBefore = await marginVaultTester.getVault(vaultCounter)
      const index = 0
      const toRemove = vaultBefore.longAmounts[index]

      await marginVaultTester.testRemoveLong(vaultCounter, otoken.address, toRemove, index)
      const vaultAfter = await marginVaultTester.getVault(vaultCounter)

      assert.equal(
        BigNumber.from(vaultBefore.longAmounts[index]).sub(BigNumber.from(vaultAfter.longAmounts[index])).toString(),
        BigNumber.from(toRemove).toString(),
        'long amount removed mismatch',
      )
      assert.equal(vaultAfter.longOtokens[index], ZERO_ADDR, 'short otken address mismatch')
    })

    it('should revert when trying to remove wrong long otoken from an index', async () => {
      const vaultCounter = BigNumber.from(0)

      await expectRevert(marginVaultTester.testRemoveLong(vaultCounter, otoken2.address, 1, 0), 'V6')
    })

    it('should be able to add different long in the index of the old long otoken without increase long array length', async () => {
      const vaultCounter = BigNumber.from(0)
      const vaultBefore = await marginVaultTester.getVault(vaultCounter)

      await marginVaultTester.testAddLong(vaultCounter, otoken2.address, 10, 0)
      const vaultAfter = await marginVaultTester.getVault(vaultCounter)
      assert.equal(BigNumber.from(vaultAfter.shortAmounts[0]).toString(), BigNumber.from(10).toString())
      assert.equal(vaultBefore.longOtokens.length, vaultAfter.longOtokens.length, 'long otokens array length mismatch')
    })
  })

  describe('Add collateral', () => {
    it('should revert if trying to add collateral asset with index greater than collateral asset array length', async () => {
      const vaultCounter = BigNumber.from(0)

      await expectRevert(marginVaultTester.testAddCollateral(vaultCounter, weth.address, 10, 4), 'V8')
    })

    it('should add weth collateral', async () => {
      const index = 0
      const amount = 10
      const vaultCounter = BigNumber.from(0)

      await marginVaultTester.testAddCollateral(vaultCounter, weth.address, amount, index)
      const vault = await marginVaultTester.getVault(vaultCounter)
      assert.equal(BigNumber.from(vault.collateralAmounts[index]).toString(), BigNumber.from(amount).toString())
    })

    it('should add some more weth collateral', async () => {
      const changeAmt = 20
      const index = 0
      const vaultCounter = BigNumber.from(0)
      const vaultBefore = await marginVaultTester.getVault(vaultCounter)

      await marginVaultTester.testAddCollateral(vaultCounter, weth.address, changeAmt, index)
      const vaultAfter = await marginVaultTester.getVault(vaultCounter)

      assert.equal(
        BigNumber.from(vaultAfter.collateralAmounts[index])
          .sub(BigNumber.from(vaultBefore.collateralAmounts[index]))
          .toString(),
        changeAmt.toString(),
      )
    })

    it('should add usdc collateral', async () => {
      const index = 1
      const amount = 20
      const vaultCounter = BigNumber.from(0)

      await marginVaultTester.testAddCollateral(vaultCounter, usdc.address, amount, index)
      const vault = await marginVaultTester.getVault(vaultCounter)
      assert.equal(BigNumber.from(vault.collateralAmounts[index]).toString(), BigNumber.from(amount).toString())
    })

    it('should revert if adding usdc collateral to wrong index', async () => {
      const changeAmt = 10
      const index = 0
      const vaultCounter = BigNumber.from(0)

      await expectRevert(marginVaultTester.testAddCollateral(vaultCounter, usdc.address, changeAmt, index), 'V9')
    })

    it('should add some more usdc collateral', async () => {
      const changeAmt = 30
      const index = 1
      const vaultCounter = BigNumber.from(0)
      const vaultBefore = await marginVaultTester.getVault(vaultCounter)

      await marginVaultTester.testAddCollateral(vaultCounter, usdc.address, changeAmt, index)
      const vaultAfter = await marginVaultTester.getVault(vaultCounter)

      assert.equal(
        BigNumber.from(vaultAfter.collateralAmounts[index])
          .sub(BigNumber.from(vaultBefore.collateralAmounts[index]))
          .toString(),
        changeAmt.toString(),
      )
    })

    it('should revert if trying to add WETH as collateral to wrong index', async () => {
      const changeAmt = 10
      const index = 1
      const vaultCounter = BigNumber.from(0)

      await expectRevert(marginVaultTester.testAddCollateral(vaultCounter, otoken.address, changeAmt, index), 'V9')
    })
  })

  describe('Remove collateral', () => {
    it('should remove some of the collateral asset', async () => {
      const index = 0
      const toRemove = 5
      const vaultCounter = BigNumber.from(0)
      const vaultBefore = await marginVaultTester.getVault(vaultCounter)

      await marginVaultTester.testRemoveCollateral(vaultCounter, weth.address, toRemove, index)
      const vaultAfter = await marginVaultTester.getVault(vaultCounter)

      assert.equal(
        BigNumber.from(vaultBefore.collateralAmounts[index])
          .sub(BigNumber.from(vaultAfter.collateralAmounts[index]))
          .toString(),
        BigNumber.from(toRemove).toString(),
        'collateral amount removed mismatch',
      )
    })

    it('should be able to remove all of the remaining amount of first collateral asset and delete collateral asset address', async () => {
      const vaultCounter = BigNumber.from(0)
      const vaultBefore = await marginVaultTester.getVault(vaultCounter)
      const index = 0
      const toRemove = vaultBefore.collateralAmounts[index]

      await marginVaultTester.testRemoveCollateral(vaultCounter, weth.address, toRemove, index)
      const vaultAfter = await marginVaultTester.getVault(vaultCounter)

      assert.equal(
        BigNumber.from(vaultBefore.collateralAmounts[index])
          .sub(BigNumber.from(vaultAfter.collateralAmounts[index]))
          .toString(),
        BigNumber.from(toRemove).toString(),
        'collateral amount removed mismatch',
      )
      assert.equal(vaultAfter.collateralAssets[index], ZERO_ADDR, 'collateral asset address mismatch')
    })

    it('should revert when trying to remove wrong collateral asset from an index', async () => {
      const vaultCounter = BigNumber.from(0)

      await expectRevert(marginVaultTester.testRemoveCollateral(vaultCounter, weth.address, 1, 0), 'V9')
    })

    it('should be able to add different collateral asset in the index of the old collateral asset without increase collateral array length', async () => {
      const vaultCounter = BigNumber.from(0)
      const vaultBefore = await marginVaultTester.getVault(vaultCounter)

      await marginVaultTester.testAddCollateral(vaultCounter, usdc.address, 10, 0)
      const vaultAfter = await marginVaultTester.getVault(vaultCounter)

      assert.equal(BigNumber.from(vaultAfter.collateralAmounts[0]).toString(), BigNumber.from(10).toString())
      assert.equal(
        vaultBefore.collateralAssets.length,
        vaultAfter.collateralAssets.length,
        'collateral asset array length mismatch',
      )
    })
  })
})
