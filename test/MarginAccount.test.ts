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

      it('should add short otoken', async () => {
        await marginAccountTester.testAddShort(otoken.address, 10, 0)
        const vault = await marginAccountTester.getVault()

        console.log(vault)
        //assert.equal(vault)
      })

      it('should add another short otoken', async () => {
        await marginAccountTester.testAddShort(otoken2.address, 10, 1)
        const vault = await marginAccountTester.getVault()

        console.log(vault)
        //assert.equal(vault)
      })

      /*it('should revert if trying on the wrong vault', async () => {
        await expectRevert(await marginAccountTester.testAddShort(otoken.address, 10, 3, {from: deployer}), 'revert')
        // await expectRevert(await marginAccountTester.testAddShort(Otoken, 10, 3, {from: deployer}), 'revert')
        // await expectRevert(await marginAccountTester.testAddShort(Otoken, 10, 100, {from: deployer}), 'revert')
      })*/

      // it('should add short correctly if called on correct vault', async () => {
      //   await marginAccountTester.testAddShort(Otoken, 10, 0, {from: deployer})
      //   assert.equal(account.vaultIds.toString(), '1', 'vaultIds is not 1 after new vault opened')
      //   assert.equal(account.vaultIds, testAccount.vaultIds, 'Incorrect vaultIds')
      // })
    })
  })
})
