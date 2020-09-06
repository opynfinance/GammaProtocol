import {
  OtokenFactoryInstance,
  OtokenInstance,
  MockOtokenInstance,
  AddressBookInstance,
  MockERC20Instance,
  MockControllerInstance,
  WhitelistInstance,
} from '../../build/types/truffle-types'
import BigNumber from 'bignumber.js'
import {assert} from 'chai'
import {createScaledNumber as createScaled} from '../utils'
const {expectRevert} = require('@openzeppelin/test-helpers')

const MockController = artifacts.require('MockController.sol')
const MockERC20 = artifacts.require('MockERC20.sol')

// real contract instances for Testing
const Otoken = artifacts.require('Otoken.sol')
const OTokenFactory = artifacts.require('OtokenFactory.sol')
const AddressBook = artifacts.require('AddressBook.sol')
const Whitelist = artifacts.require('Whitelist.sol')

// used for testing change of Otoken impl address in AddressBook
const MockOtoken = artifacts.require('MockOtoken.sol')

contract('OTokenFactory + Otoken: Cloning of real otoken instances.', ([owner, user1, user2, random]) => {
  let otokenImpl: OtokenInstance
  let otoken1: OtokenInstance
  let otoken2: OtokenInstance
  let addressBook: AddressBookInstance
  let otokenFactory: OtokenFactoryInstance
  let whitelist: WhitelistInstance
  let usdc: MockERC20Instance
  let dai: MockERC20Instance
  let weth: MockERC20Instance
  let randomERC20: MockERC20Instance

  let testController: MockControllerInstance

  const strikePrice = createScaled(200)
  const isPut = true
  const expiry = 1753776000 // 07/29/2025 @ 8:00am (UTC)

  before('Deploy addressBook, otoken logic, whitelist, Factory contract', async () => {
    usdc = await MockERC20.new('USDC', 'USDC', 6)
    dai = await MockERC20.new('DAI', 'DAI', 18)
    weth = await MockERC20.new('wETH', 'WETH', 18)
    randomERC20 = await MockERC20.new('RANDOM', 'RAM', 10)

    // Setup AddresBook
    addressBook = await AddressBook.new({from: owner})

    otokenImpl = await Otoken.new({from: owner})
    whitelist = await Whitelist.new(addressBook.address, {from: owner})
    otokenFactory = await OTokenFactory.new(addressBook.address, {from: owner})

    // setup addressBook
    await addressBook.setOtokenImpl(otokenImpl.address, {from: owner})
    await addressBook.setWhitelist(whitelist.address, {from: owner})
    await addressBook.setOtokenFactory(otokenFactory.address, {from: owner})

    // deploy the controller instance
    testController = await MockController.new()

    // set the testController as controller (so it has access to minting tokens)
    await addressBook.setController(testController.address)
    testController = await MockController.at(await addressBook.getController())
  })

  describe('Market Creation before whitelisting', () => {
    it('Should revert before admin whitelist any product', async () => {
      await expectRevert(
        otokenFactory.createOtoken(weth.address, usdc.address, usdc.address, strikePrice, expiry, isPut, {
          from: user1,
        }),
        'OtokenFactory: Unsupported Product',
      )
    })
  })

  describe('Market Creation after whitelisting products', () => {
    before('Whitelist product from admin', async () => {
      await whitelist.whitelistProduct(weth.address, usdc.address, usdc.address, {from: owner})
      await whitelist.whitelistProduct(weth.address, dai.address, dai.address, {from: owner})
    })

    it('Should init otoken1 with correct name and symbol', async () => {
      // otoken1: eth-usdc option
      const targetAddress1 = await otokenFactory.getTargetOtokenAddress(
        weth.address,
        usdc.address,
        usdc.address,
        strikePrice,
        expiry,
        isPut,
      )
      await otokenFactory.createOtoken(weth.address, usdc.address, usdc.address, strikePrice, expiry, isPut, {
        from: user1,
      })
      otoken1 = await Otoken.at(targetAddress1)
      assert.equal(await otoken1.name(), 'WETHUSDC 29-July-2025 200Put USDC Collateral')
      assert.equal(await otoken1.symbol(), 'oWETHUSDC-29JUL25-200P')
    })

    it('Should init otoken2 with correct name and symbol', async () => {
      // otoken2: eth-dai option
      const targetAddress2 = await otokenFactory.getTargetOtokenAddress(
        weth.address,
        dai.address,
        dai.address,
        strikePrice,
        expiry,
        isPut,
      )
      await otokenFactory.createOtoken(weth.address, dai.address, dai.address, strikePrice, expiry, isPut, {
        from: user2,
      })
      otoken2 = await Otoken.at(targetAddress2)
      assert.equal(await otoken2.name(), 'WETHDAI 29-July-2025 200Put DAI Collateral')
      assert.equal(await otoken2.symbol(), 'oWETHDAI-29JUL25-200P')
    })

    it('The newly created tokens should be whitelisted in the whitelist module', async () => {
      assert.equal(await whitelist.isWhitelistedOtoken(otoken1.address), true)
      assert.equal(await whitelist.isWhitelistedOtoken(otoken2.address), true)
    })

    it('The owner of whitelist contract can blacklist specific otoken', async () => {
      await whitelist.blacklistOtoken(otoken1.address)
      await whitelist.blacklistOtoken(otoken2.address)
      assert.equal(await whitelist.isWhitelistedOtoken(otoken1.address), false)
      assert.equal(await whitelist.isWhitelistedOtoken(otoken2.address), false)
    })

    it('should revert creating otoken after the owner blacklist the product', async () => {
      await whitelist.blacklistProduct(weth.address, usdc.address, usdc.address)
      const newStrikePrice = createScaled(188)
      await expectRevert(
        otokenFactory.createOtoken(weth.address, usdc.address, usdc.address, newStrikePrice, expiry, isPut, {
          from: user1,
        }),
        'OtokenFactory: Unsupported Product',
      )
    })

    it('Should revert when calling init after createOtoken', async () => {
      /* Should revert because the init function is already called by the factory in createOtoken() */
      await expectRevert(
        otoken1.init(addressBook.address, usdc.address, usdc.address, usdc.address, strikePrice, expiry, isPut),
        'Contract instance has already been initialized',
      )

      await expectRevert(
        otoken2.init(addressBook.address, randomERC20.address, dai.address, usdc.address, strikePrice, expiry, isPut),
        'Contract instance has already been initialized',
      )
    })

    it('Calling init on otoken logic contract should not affecting the minimal proxies.', async () => {
      // someone call init on the logic function for no reason
      await otokenImpl.init(
        addressBook.address,
        randomERC20.address,
        randomERC20.address,
        weth.address,
        strikePrice,
        expiry,
        isPut,
      )

      const strikeOfOtoken1 = await otoken1.strikeAsset()
      const collateralOfOtoken1 = await otoken1.collateralAsset()

      const strikeOfOtoken2 = await otoken2.strikeAsset()
      const collateralOfOtoken2 = await otoken2.collateralAsset()

      assert.equal(strikeOfOtoken1, usdc.address)
      assert.equal(strikeOfOtoken2, dai.address)
      assert.equal(collateralOfOtoken1, usdc.address)
      assert.equal(collateralOfOtoken2, dai.address)
    })
  })

  describe('Controller only functions on cloned otokens', () => {
    const amountToMint = new BigNumber(10).times(new BigNumber(10).exponentiatedBy(18))

    it('should revert when mintOtoken is called by random address', async () => {
      await expectRevert(
        otoken1.mintOtoken(user1, amountToMint, {from: random}),
        'Otoken: Only Controller can mint Otokens',
      )
    })

    it('should be able to mint token1 from controller', async () => {
      // the testController will call otoken1.mintOtoken()
      await testController.testMintOtoken(otoken1.address, user1, amountToMint.toString())
      const balance = await otoken1.balanceOf(user1)
      assert.equal(balance.toString(), amountToMint.toString())
    })

    it('should revert when burnOtoken is called by random address', async () => {
      await expectRevert(
        otoken1.burnOtoken(user1, amountToMint, {from: random}),
        'Otoken: Only Controller can burn Otokens',
      )
    })

    it('should be able to burn tokens from controller', async () => {
      await testController.testBurnOtoken(otoken1.address, user1, amountToMint.toString())
      const balance = await otoken1.balanceOf(user1)
      assert.equal(balance.toString(), '0')
    })
  })

  describe('Otoken Implementation address upgrade ', () => {
    const amountToMint = createScaled(10)

    before('whitelist product again', async () => {
      await whitelist.whitelistProduct(weth.address, usdc.address, usdc.address, {from: owner})
    })

    it('should not affect existing otoken instances', async () => {
      await testController.testMintOtoken(otoken1.address, user1, amountToMint.toString())
      const newOtoken = await MockOtoken.new()
      // update otokenimpl address in addressbook
      await addressBook.setOtokenImpl(newOtoken.address, {from: owner})

      const balance = await otoken1.balanceOf(user1)
      assert.equal(balance.toString(), amountToMint.toString())
    })

    it('should deploy MockOtoken after upgrade', async () => {
      const newExpiry = expiry + 86400
      const address = await otokenFactory.getTargetOtokenAddress(
        weth.address,
        usdc.address,
        usdc.address,
        strikePrice,
        newExpiry,
        isPut,
      )
      await otokenFactory.createOtoken(weth.address, usdc.address, usdc.address, strikePrice, newExpiry, isPut)

      const mockedToken: MockOtokenInstance = await MockOtoken.at(address)
      // Only MockOtoken has this method, if it return true that means we created a MockOtoken instance.
      const inited = await mockedToken.inited()
      assert.isTrue(inited)
    })
  })
})
