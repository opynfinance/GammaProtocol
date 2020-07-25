import {
  OtokenFactoryInstance,
  OtokenInstance,
  MockOtokenInstance,
  MockAddressBookInstance,
  MockERC20Instance,
} from '../build/types/truffle-types'
import BigNumber from 'bignumber.js'
import {assert} from 'chai'
import {setupContracts} from './utils'
const {expectRevert} = require('@openzeppelin/test-helpers')
const MockERC20 = artifacts.require('MockERC20.sol')
const Otoken = artifacts.require('Otoken.sol')
const ZERO_ADDR = '0x0000000000000000000000000000000000000000'

// used for testing change of Otoken impl address in AddressBook
const MockOtoken = artifacts.require('MockOtoken.sol')

contract('OTokenFactory + Otoken', ([deployer, controller, newController, user1, user2]) => {
  let otokenImpl: OtokenInstance
  let otoken1: OtokenInstance
  let otoken2: OtokenInstance
  let addressBook: MockAddressBookInstance
  let otokenFactory: OtokenFactoryInstance

  let usdc: MockERC20Instance
  let dai: MockERC20Instance
  let randomERC20: MockERC20Instance

  const ethAddress = ZERO_ADDR
  const strikePrice = new BigNumber(200).times(new BigNumber(10).exponentiatedBy(18))
  const isPut = true
  const expiry = 1753776000 // 07/29/2025 @ 8:00am (UTC)

  before('Deploy addreeBook, otoken logic, whitelist, Factory contract', async () => {
    usdc = await MockERC20.new('USDC', 'USDC')
    dai = await MockERC20.new('DAI', 'DAI')
    randomERC20 = await MockERC20.new('RANDOM', 'RAM')

    const {factory: _factory, addressBook: _addressBook, whitelist, otokenImpl: _otokenImpl} = await setupContracts(
      deployer,
    )

    otokenFactory = _factory
    otokenImpl = _otokenImpl
    addressBook = _addressBook

    // controller is not in the setup flow
    await addressBook.setController(controller)
    await whitelist.whitelistProduct(ethAddress, usdc.address, usdc.address)
    await whitelist.whitelistProduct(ethAddress, dai.address, dai.address)
  })

  describe('Init process on minimal proxy', () => {
    it('Should init otoken1 with correct name and symbol', async () => {
      // otoken1: eth-usdc option
      const targetAddress1 = await otokenFactory.getTargetOtokenAddress(
        ethAddress,
        usdc.address,
        usdc.address,
        strikePrice,
        expiry,
        isPut,
      )
      await otokenFactory.createOtoken(ethAddress, usdc.address, usdc.address, strikePrice, expiry, isPut, {
        from: user1,
      })
      otoken1 = await Otoken.at(targetAddress1)
      assert.equal(await otoken1.name(), 'ETHUSDC 29-July-2025 200Put USDC Collateral')
      assert.equal(await otoken1.symbol(), 'oETHUSDC-29JUL25-200P')
    })
    it('Should init otoken2 with correct name and symbol', async () => {
      // otoken2: eth-dai option
      const targetAddress2 = await otokenFactory.getTargetOtokenAddress(
        ethAddress,
        dai.address,
        dai.address,
        strikePrice,
        expiry,
        isPut,
      )
      await otokenFactory.createOtoken(ethAddress, dai.address, dai.address, strikePrice, expiry, isPut, {
        from: user2,
      })
      otoken2 = await Otoken.at(targetAddress2)
      assert.equal(await otoken2.name(), 'ETHDAI 29-July-2025 200Put DAI Collateral')
      assert.equal(await otoken2.symbol(), 'oETHDAI-29JUL25-200P')
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
        ethAddress,
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

    it('should be able to mint token1 from controller address', async () => {
      await otoken1.mintOtoken(user1, amountToMint.toString(), {from: controller})
      const balance = await otoken1.balanceOf(user1)
      assert.equal(balance.toString(), amountToMint.toString())
    })

    it('should revert minting tokens from old controller address after update', async () => {
      await addressBook.setController(newController, {from: deployer})
      await expectRevert(
        otoken1.mintOtoken(user1, amountToMint, {from: controller}),
        'Otoken: Only Controller can mint Otokens',
      )
    })

    it('should revert when burning token1 from the old controller ', async () => {
      await expectRevert(
        otoken1.burnOtoken(user1, amountToMint, {from: controller}),
        'Otoken: Only Controller can burn Otokens.',
      )
    })

    it('should be able to burn tokens from new controller address', async () => {
      await otoken1.burnOtoken(user1, amountToMint, {from: newController})
      const balance = await otoken1.balanceOf(user1)
      assert.equal(balance.toString(), '0')
    })
  })

  describe('Otoken Implementation address upgrade ', () => {
    const amountToMint = new BigNumber(10).times(new BigNumber(10).exponentiatedBy(18))
    it('should not affect existing otoken instances', async () => {
      await otoken1.mintOtoken(user1, amountToMint, {from: newController})
      const newOtoken = await MockOtoken.new()
      await addressBook.setOtokenImpl(newOtoken.address, {from: deployer})

      const balance = await otoken1.balanceOf(user1)
      assert.equal(balance.toString(), amountToMint.toString())
    })

    it('should deploy MockOtoken after upgrade', async () => {
      const newExpiry = expiry + 86400
      const address = await otokenFactory.getTargetOtokenAddress(
        ethAddress,
        usdc.address,
        usdc.address,
        strikePrice,
        newExpiry,
        isPut,
      )
      await otokenFactory.createOtoken(ethAddress, usdc.address, usdc.address, strikePrice, newExpiry, isPut)

      const mockedToken: MockOtokenInstance = await MockOtoken.at(address)
      // Only MockOtoken has this method, if it return true that means we created a MockOtoken instance.
      const inited = await mockedToken.inited()
      assert.isTrue(inited)
    })
  })
})
