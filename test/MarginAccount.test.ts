import {MarginAccountTesterInstance, MockERC20Instance, OtokenInstance} from '../build/types/truffle-types'

import {BigNumber} from 'bignumber.js'

const {expectRevert} = require('@openzeppelin/test-helpers')

const Otoken = artifacts.require('Otoken.sol')
const MockERC20 = artifacts.require('MockERC20.sol')
const MarginAccountTester = artifacts.require('MarginAccountTester.sol')
const MockAddressBook = artifacts.require('MockAddressBook')
const ZERO_ADDR = '0x0000000000000000000000000000000000000000'
const ETH_ADDR = ZERO_ADDR

contract('MarginAccount', ([deployer, controller]) => {
  // ERC20 mocks
  let weth: MockERC20Instance
  // addressbook instance
  let marginAccountTester: MarginAccountTesterInstance
  let otoken: OtokenInstance
  let otoken2: OtokenInstance
  let usdc: MockERC20Instance
  let mockAddressBookAddr: string

  // let expiry: number;
  const strikePrice = new BigNumber(200).times(new BigNumber(10).exponentiatedBy(18))
  const expiry = 1601020800 // 2020/09/25 0800 UTC
  const isPut = true

  const testAccount: {owner: string; vaultIds: BigNumber} = {owner: ZERO_ADDR, vaultIds: new BigNumber(0)}
  let account: {owner: string; vaultIds: BigNumber}

  before('Deployment', async () => {
    // deploy WETH token
    weth = await MockERC20.new('WETH', 'WETH')
    // deploy AddressBook token
    marginAccountTester = await MarginAccountTester.new()

    const addressBook = await MockAddressBook.new()
    mockAddressBookAddr = addressBook.address
    await addressBook.setController(controller)

    // deploy oToken with addressbook
    otoken = await Otoken.new(addressBook.address)

    usdc = await MockERC20.new('USDC', 'USDC')

    // deploy second otoken
    otoken2 = await Otoken.new(addressBook.address)
    await otoken2.init(ETH_ADDR, usdc.address, usdc.address, strikePrice, expiry, isPut, {from: deployer})
  })

  describe('Otoken Initialization', () => {
    it('should be able to initialize with put parameter correctly', async () => {
      await otoken.init(ETH_ADDR, usdc.address, usdc.address, strikePrice, expiry, isPut, {from: deployer})
      assert.equal(await otoken.underlyingAsset(), ETH_ADDR)
      assert.equal(await otoken.strikeAsset(), usdc.address)
      assert.equal(await otoken.collateralAsset(), usdc.address)
      assert.equal((await otoken.strikePrice()).toString(), strikePrice.toString())
      assert.equal(await otoken.isPut(), isPut)
      assert.equal((await otoken.expiry()).toNumber(), expiry)
    })

    it('should initialize the put option with valid name / symbol', async () => {
      assert.equal(await otoken.name(), `ETHUSDC 25-September-2020 200Put USDC Collateral`)
      assert.equal(await otoken.symbol(), `oETHUSDC-25SEP20-200P`)
      assert.equal((await otoken.decimals()).toNumber(), 18)
    })

    describe('Open new vault', () => {
      it('vaultIds should be zero, owner should be null', async () => {
        account = await marginAccountTester.getAccount({from: deployer})
        assert.equal(account.owner, testAccount.owner, 'MarginAccount.Account owner addr mismatch')
        assert.equal(account.vaultIds, testAccount.vaultIds, 'Incorrect vaultIds')
      })

      it('ensure that the vault is empty when first opened', async () => {
        const vault = await marginAccountTester.getVault()
        assert.equal(vault.shortAmounts.length, 0, 'shortAmounts.length should be 0')
        assert.equal(vault.longAmounts.length, 0, 'longAmounts.length should be 0')
        assert.equal(vault.collateralAmounts.length, 0, 'collateralAmounts.length should be 0')
        assert.equal(vault.shortOtokens.length, 0, 'shortOtokens.length should be 0')
        assert.equal(vault.longOtokens.length, 0, 'longOtokens.length should be 0')
        assert.equal(vault.collateralAssets.length, 0, 'collateralAssets.length should be 0')
      })

      //TODO: should vaultIds be at 1 or 0 at the end (i.e. how do we do indices)
      it('should increment vaultID otoken implementation address', async () => {
        await marginAccountTester.testOpenNewVault({from: deployer})
        const account = await marginAccountTester.getAccount({from: deployer})
        assert.equal(account.vaultIds.toString(), '1', 'vaultIds is not 1 after new vault opened')
      })

      it('should increment vaultID otoken implementation address if tried a second time', async () => {
        await marginAccountTester.testOpenNewVault({from: deployer})
        const account = await marginAccountTester.getAccount({from: deployer})
        assert.equal(account.vaultIds.toString(), '2', 'vaultIds is not 2 after 2nd new vault opened')
      })
    })

    describe('Add short', () => {
      it('vaultIds should be zero, owner should be null', async () => {
        account = await marginAccountTester.getAccount({from: deployer})
        assert.equal(account.owner, testAccount.owner, 'MarginAccount.Account owner addr mismatch')
      })

      it('should add short otokens', async () => {
        await marginAccountTester.testAddShort(otoken.address, 10, 0)
        const vault = await marginAccountTester.getVault()
        assert.equal(vault.shortAmounts[0], new BigNumber(10))
      })

      it('should add a different short otokens to a different index', async () => {
        await marginAccountTester.testAddShort(otoken2.address, 11, 1)
        const vault = await marginAccountTester.getVault()
        assert.equal(vault.shortAmounts[1], new BigNumber(11))
      })

      it('should add some more of the second short otoken', async () => {
        await marginAccountTester.testAddShort(otoken2.address, 12, 1)
        const vault = await marginAccountTester.getVault()
        assert.equal(vault.shortAmounts[1], new BigNumber(23))
      })

      it('should revert if trying to add wrong otoken to an index', async () => {
        await expectRevert(
          marginAccountTester.testAddShort(otoken.address, 10, 1),
          'MarginAccount: invalid short otoken position',
        )
      })

      // it('should revert if trying on the wrong vault', async () => {
      //   // await expectRevert(marginAccountTester.testAddShort(otoken.address, 10, 5, {from: deployer}), 'revert')
      //   // await expectRevert(await marginAccountTester.testAddShort(Otoken, 10, 3, {from: deployer}), 'revert')
      //   // await expectRevert(await marginAccountTester.testAddShort(Otoken, 10, 100, {from: deployer}), 'revert')
      // })
    })

    describe('Add long', () => {
      it('vaultIds should be zero, owner should be null', async () => {
        account = await marginAccountTester.getAccount({from: deployer})
        assert.equal(account.owner, testAccount.owner, 'MarginAccount.Account owner addr mismatch')
      })

      it('should add long otokens', async () => {
        const index = 0
        const amount = 10
        await marginAccountTester.testAddLong(otoken.address, amount, index)
        const vault = await marginAccountTester.getVault()
        assert.equal(vault.longAmounts[index], new BigNumber(amount))
      })

      it('should add a different long otoken', async () => {
        const index = 1
        const amount = 10
        await marginAccountTester.testAddLong(otoken2.address, amount, index)
        const vault = await marginAccountTester.getVault()
        assert.equal(vault.longAmounts[index], new BigNumber(amount))
      })

      it('should revert if trying to add wrong otoken to an index', async () => {
        const index = 1
        const amount = 10
        await expectRevert(
          marginAccountTester.testAddLong(otoken.address, amount, index),
          'MarginAccount: invalid long otoken position',
        )
      })

    })

    describe('Add collateral', () => {
      it('vaultIds should be zero, owner should be null', async () => {
        account = await marginAccountTester.getAccount({from: deployer})
        assert.equal(account.owner, testAccount.owner, 'MarginAccount.Account owner addr mismatch')
      })

      it('should add weth collateral', async () => {
        const index = 0
        const amount = 10
        await marginAccountTester.testAddCollateral(weth.address, amount, index)
        const vault = await marginAccountTester.getVault()
        assert.equal(vault.collateralAmounts[index], new BigNumber(amount))
      })

      //TODO: understand why below doesn't work
      // it('should revert if adding weth collateral to wrong index', async () => {
      //   await expectRevert(marginAccountTester.testAddCollateral(weth.address, 10, 1), "MarginAccount: invalid collateral token position")
      // })

      it('should add some more weth collateral', async () => {
        const beforeVault = await marginAccountTester.getVault()
        const changeAmt = 20
        const index = 0
        await marginAccountTester.testAddCollateral(weth.address, changeAmt, index)
        const afterVault = await marginAccountTester.getVault()
        assert.equal(
          new BigNumber(afterVault.collateralAmounts[index])
            .minus(new BigNumber(beforeVault.collateralAmounts[index]))
            .toString(),
          changeAmt.toString(),
        )
      })

      //TODO: shouldn't the below revert?
      // it('should revert if trying to add WETH as collateral to wrong index', async () => {
      //   const changeAmt = 10
      //   const index = 1
      //   await expectRevert(marginAccountTester.testAddCollateral(otoken.address, changeAmt, index), "MarginAccount: invalid collateral token position")
      // })

      it('should add usdc collateral', async () => {
        const index = 1
        const amount = 20
        await marginAccountTester.testAddCollateral(usdc.address, amount, index)
        const vault = await marginAccountTester.getVault()
        assert.equal(vault.collateralAmounts[index], new BigNumber(amount))
      })

      it('should revert if adding usdc collateral to wrong index', async () => {
        const changeAmt = 10
        const index = 0
        await expectRevert(
          marginAccountTester.testAddCollateral(usdc.address, changeAmt, index),
          'MarginAccount: invalid collateral token position',
        )
      })

      it('should add some more usdc collateral', async () => {
        const beforeVault = await marginAccountTester.getVault()
        const changeAmt = 30
        const index = 1
        await marginAccountTester.testAddCollateral(usdc.address, changeAmt, index)
        const afterVault = await marginAccountTester.getVault()
        assert.equal(
          new BigNumber(afterVault.collateralAmounts[index])
            .minus(new BigNumber(beforeVault.collateralAmounts[index]))
            .toString(),
          changeAmt.toString(),
        )
      })

      //TODO:  is this out of scope of the margin account?
      // it('should revert if trying to add otoken as collateral to a vault', async () => {
      //   await expectRevert(marginAccountTester.testAddCollateral(otoken.address, 10, 3))
      //   await expectRevert(marginAccountTester.testAddCollateral(otoken.address, 10, 2))
      //   await expectRevert(marginAccountTester.testAddCollateral(otoken.address, 10, 1))
      //   await expectRevert(marginAccountTester.testAddCollateral(otoken.address, 10, 0))
      // })
      //
      // it('should revert if trying on the wrong vault', async () => {
      //   // await expectRevert(marginAccountTester.testAddShort(otoken.address, 10, 5, {from: deployer}), 'revert')
      //   // await expectRevert(await marginAccountTester.testAddShort(Otoken, 10, 3, {from: deployer}), 'revert')
      //   // await expectRevert(await marginAccountTester.testAddShort(Otoken, 10, 100, {from: deployer}), 'revert')
      // })
    })

    describe('Remove short', () => {
      before('redeploying', async () => {
        marginAccountTester = await MarginAccountTester.new()
      })

      // testAccount = {owner: ZERO_ADDR, vaultIds: new BigNumber(0)}
      it('vaultIds should be zero again, owner should be ZERO_ADDR', async () => {
        account = await marginAccountTester.getAccount({from: deployer})
        assert.equal(account.owner, testAccount.owner, 'MarginAccount.Account owner addr mismatch')
        assert.equal(account.vaultIds, testAccount.vaultIds, 'MarginAccount.Account owner vaultids mismatch')
      })

      it('should not remove short otokens if there are none', async () => {
        await expectRevert(
          marginAccountTester.testRemoveShort(otoken.address, 10, 0),
          'MarginAccount: short otoken address mismatch',
        )
      })

      it('should add some short otokens to be removed later', async () => {
        await marginAccountTester.testAddShort(otoken.address, 10, 0)
      })

      it('should remove some of those short otokens', async () => {
        const index = 0
        const toRemove = 5
        const beforeVault = await marginAccountTester.getVault()
        await marginAccountTester.testRemoveShort(otoken.address, toRemove, index)
        const afterVault = await marginAccountTester.getVault()
        assert.equal(
          new BigNumber(beforeVault.shortAmounts[index])
            .minus(new BigNumber(afterVault.shortAmounts[index]))
            .toString(),
          new BigNumber(toRemove).toString(),
          'amount removed mismatch',
        )
      })

      it('should not be able to remove more than the num of remaining of those short otokens', async () => {
        await expectRevert(
          marginAccountTester.testRemoveShort(otoken.address, 100, 0),
          'SafeMath: subtraction overflow',
        )
      })

      //TODO: Is this a condition we need?
      // it('should not be able to remove zero of those short otokens', async () => {
      //   await marginAccountTester.testRemoveShort(otoken.address, 0, 1)
      //   const vault = await marginAccountTester.getVault()
      //   assert.equal(1,2)
      // })

      it('should be able to remove some of the remaining short otokens', async () => {
        const index = 0
        const toRemove = 5
        const beforeVault = await marginAccountTester.getVault()
        await marginAccountTester.testRemoveShort(otoken.address, 5, 0)
        const afterVault = await marginAccountTester.getVault()
        assert.equal(
          new BigNumber(beforeVault.shortAmounts[index])
            .minus(new BigNumber(afterVault.shortAmounts[index]))
            .toString(),
          new BigNumber(toRemove).toString(),
          'amount removed mismatch',
        )
      })

      it('should revert if trying to remove wrong otoken from an index', async () => {
        await expectRevert(
          marginAccountTester.testRemoveShort(otoken2.address, 1, 0),
          'MarginAccount: short otoken address mismatch',
        )
      })
    })

    describe('Remove long', () => {
      before('redeploying', async () => {
        marginAccountTester = await MarginAccountTester.new()
      })

      it('vaultIds should be zero again, owner should be ZERO_ADDR', async () => {
        account = await marginAccountTester.getAccount({from: deployer})
        assert.equal(account.owner, testAccount.owner, 'MarginAccount.Account owner addr mismatch')
        assert.equal(account.vaultIds, testAccount.vaultIds, 'MarginAccount.Account owner vaultids mismatch')
      })

      it('should not remove long otokens if there are none', async () => {
        await expectRevert(
          marginAccountTester.testRemoveLong(otoken.address, 10, 0),
          'MarginAccount: long otoken address mismatch',
        )
      })

      it('should add some long otokens to be removed later', async () => {
        await marginAccountTester.testAddLong(otoken.address, 10, 0)
      })

      it('should not be able to remove more than the num of remaining long otokens', async () => {
        await expectRevert(marginAccountTester.testRemoveLong(otoken.address, 100, 0), 'SafeMath: subtraction overflow')
      })

      it('should be able to remove some of the remaining long oTokens', async () => {
        const index = 0
        const toRemove = 1
        const beforeVault = await marginAccountTester.getVault()
        await marginAccountTester.testRemoveLong(otoken.address, toRemove, index)
        const afterVault = await marginAccountTester.getVault()
        assert.equal(
          new BigNumber(beforeVault.longAmounts[index]).minus(new BigNumber(afterVault.longAmounts[index])).toString(),
          new BigNumber(toRemove).toString(),
          'amount removed mismatch',
        )
      })

      it('should not be able to remove the wrong otoken from a long position with a different index', async () => {
        await expectRevert(
          marginAccountTester.testRemoveLong(otoken2.address, 1, 0),
          'MarginAccount: long otoken address mismatch',
        )
      })
    })

    describe('Remove collateral', () => {
      before('redeploying', async () => {
        marginAccountTester = await MarginAccountTester.new()
      })

      it('vaultIds should be zero, owner should be ZERO_ADDR', async () => {
        account = await marginAccountTester.getAccount({from: deployer})
        assert.equal(account.owner, testAccount.owner, 'MarginAccount.Account owner addr mismatch')
        assert.equal(
          account.vaultIds.toString(),
          testAccount.vaultIds.toString(),
          'MarginAccount.Account owner vaultIds mismatch',
        )
      })

      it('should not remove short collateral if there is none', async () => {
        await expectRevert(
          marginAccountTester.testRemoveCollateral(weth.address, 10, 0),
          'MarginAccount: collateral token address mismatch',
        )
      })

      it('should add more collateral for testing', async () => {
        await marginAccountTester.testAddShort(weth.address, 10, 0)
      })

      it('should revert if trying to remove wrong collateral from an index', async () => {
        await expectRevert(
          marginAccountTester.testRemoveCollateral(weth.address, 10, 1),
          'MarginAccount: collateral token address mismatch',
        )
      })

      it('should not be able to remove more than the amount of collateral', async () => {
        await expectRevert(
          marginAccountTester.testRemoveCollateral(otoken.address, 100, 1),
          'MarginAccount: collateral token address mismatch',
        )
      })

      //TODO: Is this a condition we need?
      // it('should not be able to remove zero of those short otokens', async () => {
      //   await marginAccountTester.testRemoveShort(otoken.address, 0, 1)
      //   const vault = await marginAccountTester.getVault()
      //   assert.equal(1,2)
      // })

      // it('should be able to remove the remaining short otokens', async () => {
      //   await marginAccountTester.testRemoveShort(otoken.address, 5, 1)
      //   const vault = await marginAccountTester.getVault()
      //   assert.equal(1,2)
      // })
      //
      // it('should not be able to remove shortOtokens if there are none remaining', async () => {
      //   await marginAccountTester.testRemoveShort(otoken.address, 1, 1)
      //   const vault = await marginAccountTester.getVault()
      //   assert.equal(1,2)
      // })
      // it('should revert if trying on the wrong vault', async () => {
      //   // await expectRevert(marginAccountTester.testAddShort(otoken.address, 10, 5, {from: deployer}), 'revert')
      //   // await expectRevert(await marginAccountTester.testAddShort(Otoken, 10, 3, {from: deployer}), 'revert')
      //   // await expectRevert(await marginAccountTester.testAddShort(Otoken, 10, 100, {from: deployer}), 'revert')
      // })
    })

    describe('Clear vault', () => {
      before('redeploying', async () => {
        marginAccountTester = await MarginAccountTester.new()
      })

      it('vaultIds should no longer be zero, owner should be null', async () => {
        account = await marginAccountTester.getAccount({from: deployer})
        assert.equal(account.owner, testAccount.owner, 'MarginAccount.Account owner addr mismatch')
      })

      it('should add weth collateral', async () => {
        await marginAccountTester.testAddCollateral(weth.address, 10, 0)
      })

      it('should add long oTokens', async () => {
        await marginAccountTester.testAddLong(otoken.address, 10, 0)
      })

      it('should add short oTokens', async () => {
        await marginAccountTester.testAddShort(otoken2.address, 10, 0)
      })

      it('ensure that the vault is not empty before clearing', async () => {
        const vault = await marginAccountTester.getVault()
        assert.notEqual(vault.shortAmounts.length, 0, 'shortAmounts.length should not be 0')
        assert.notEqual(vault.longAmounts.length, 0, 'longAmounts.length should not be 0')
        assert.notEqual(vault.collateralAmounts.length, 0, 'collateralAmounts.length should not be 0')
        assert.notEqual(vault.shortOtokens.length, 0, 'shortOtokens.length should not be 0')
        assert.notEqual(vault.longOtokens.length, 0, 'longOtokens.length should not be 0')
        //TODO: change the following
        assert.notEqual(vault.collateralAssets.length, 0, 'collateralAssets.length should not be 0')
      })

      it('ensure that the vault is empty after clearing', async () => {
        await marginAccountTester.testClearVault()
        const vault = await marginAccountTester.getVault()
        assert.equal(vault.shortAmounts.length, 0, 'shortAmounts.length should be 0')
        assert.equal(vault.longAmounts.length, 0, 'longAmounts.length should be 0')
        assert.equal(vault.collateralAmounts.length, 0, 'collateralAmounts.length should be 0')
        assert.equal(vault.shortOtokens.length, 0, 'shortOtokens.length should be 0')
        assert.equal(vault.longOtokens.length, 0, 'longOtokens.length should be 0')
        assert.equal(vault.collateralAssets.length, 0, 'collateralAssets.length should be 0')
      })
    })
  })
})
