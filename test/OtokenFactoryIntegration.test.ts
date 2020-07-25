import {
  OtokenFactoryInstance,
  OtokenInstance,
  MockAddressBookInstance,
  WhitelistInstance,
  MockERC20Instance,
} from '../build/types/truffle-types'
import BigNumber from 'bignumber.js'
import {assert} from 'chai'
import {setupContracts} from './utils'
const {expectEvent, expectRevert} = require('@openzeppelin/test-helpers')
// const OTokenFactory = artifacts.require('OtokenFactory.sol')
// const MockAddressBook = artifacts.require('MockAddressBook.sol')
// const Whitelist = artifacts.require('Whitelist.sol')
const MockERC20 = artifacts.require('MockERC20.sol')
const Otoken = artifacts.require('Otoken.sol')
const ZERO_ADDR = '0x0000000000000000000000000000000000000000'

contract('OTokenFactory + Otoken', ([deployer, controller, user1, user2]) => {
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

  before('Deploy 2 Otokens', async () => {
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
      from: user1,
    })
    otoken2 = await Otoken.at(targetAddress2)
  })

  describe('Init process on minimal proxy', () => {
    it('Should revert when calling init after createOtoken', async () => {
      /* Should revert because the init function is already called by the factory in createOtoken() */
      await expectRevert(
        otoken1.init(usdc.address, usdc.address, usdc.address, strikePrice, expiry, isPut),
        'Contract instance has already been initialized',
      )

      await expectRevert(
        otoken2.init(randomERC20.address, dai.address, usdc.address, strikePrice, expiry, isPut),
        'Contract instance has already been initialized',
      )
    })

    it('Calling init on otoken logic contract should not affecting the minimal proxies.', async () => {
      await otokenImpl.init(randomERC20.address, ethAddress, randomERC20.address, strikePrice, expiry, isPut)

      const strikeOfLogicAddres = await otokenImpl.strikeAsset()
      const collateralOfLogicAddres = await otokenImpl.collateralAsset()

      const strikeOfOtoken1 = await otoken1.strikeAsset()
      const collateralOfOtoken1 = await otoken1.collateralAsset()

      const strikeOfOtoken2 = await otoken2.strikeAsset()
      const collateralOfOtoken2 = await otoken2.collateralAsset()

      assert.notEqual(strikeOfOtoken1, strikeOfLogicAddres)
      assert.notEqual(strikeOfOtoken2, strikeOfLogicAddres)
      assert.notEqual(collateralOfOtoken1, collateralOfLogicAddres)
      assert.notEqual(collateralOfOtoken2, collateralOfLogicAddres)
    })
  })

  describe('Init process on minimal proxy', () => {
    it('Should revert when calling init after createOtoken', async () => {
      /* Should revert because the init function is already called by the factory in createOtoken() */
      await expectRevert(
        otoken1.init(usdc.address, usdc.address, usdc.address, strikePrice, expiry, isPut),
        'Contract instance has already been initialized',
      )

      await expectRevert(
        otoken2.init(randomERC20.address, dai.address, usdc.address, strikePrice, expiry, isPut),
        'Contract instance has already been initialized',
      )
    })

    it('Calling init on otoken logic contract should not affecting the minimal proxies.', async () => {
      await otokenImpl.init(randomERC20.address, ethAddress, randomERC20.address, strikePrice, expiry, isPut)

      const strikeOfLogicAddres = await otokenImpl.strikeAsset()
      const collateralOfLogicAddres = await otokenImpl.collateralAsset()

      const strikeOfOtoken1 = await otoken1.strikeAsset()
      const collateralOfOtoken1 = await otoken1.collateralAsset()

      const strikeOfOtoken2 = await otoken2.strikeAsset()
      const collateralOfOtoken2 = await otoken2.collateralAsset()

      assert.notEqual(strikeOfOtoken1, strikeOfLogicAddres)
      assert.notEqual(strikeOfOtoken2, strikeOfLogicAddres)
      assert.notEqual(collateralOfOtoken1, collateralOfLogicAddres)
      assert.notEqual(collateralOfOtoken2, collateralOfLogicAddres)
    })
  })

  describe('Controller only functions on oToken', () => {
    it('should be able to mint tokens from controller address', async () => {
      // await otoken1.mintOtoken(user1, amountToMint, {from: controller})
      // const balance = await otoken1.balanceOf(user1)
      // assert.equal(balance.toString(), amountToMint.toString())
    })
  })
})
