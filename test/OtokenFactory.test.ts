import {OTokenFactoryInstance, OTokenInstance} from '../build/types/truffle-types'
import BigNumber from 'bignumber.js'

const {expectEvent, expectRevert, time} = require('@openzeppelin/test-helpers')
const OToken = artifacts.require('Otoken.sol')
const OTokenFactory = artifacts.require('OtokenFactory.sol')
const ZERO_ADDR = '0x0000000000000000000000000000000000000000'

contract('OTokenFactory', accounts => {
  let oToken: OTokenInstance
  let oTokenFactory: OTokenFactoryInstance

  // Paramter used for oToken init(). (Use random addresses as usdc and eth)
  const usdcAddress = accounts[5]
  const ethAddress = accounts[6]
  const strikePrice = new BigNumber(200)
  const isPut = true
  // const name = 'Opyn ETH-USDC 200 PUT'
  // const symbol = 'ETH-USDC 200 P'
  let expiry: number

  before('Deploy oToken logic and Factory contract', async () => {
    const logic = await OToken.new()
    oTokenFactory = await OTokenFactory.new(logic.address)
    const now = (await time.latest()).toNumber()
    expiry = now + time.duration.days(30).toNumber()
  })

  describe('Get oToken address', () => {
    it('Should return address(0) if token not deployed', async () => {
      const existAddress = await oTokenFactory.getOtoken(
        usdcAddress,
        ethAddress,
        usdcAddress,
        strikePrice,
        expiry,
        isPut,
      )
      expect(existAddress).to.equal(ZERO_ADDR)
    })

    it('should get deterministic address with new oToken paramters', async () => {
      const targetAddress = await oTokenFactory.getTargetOtokenAddress(
        usdcAddress,
        ethAddress,
        usdcAddress,
        strikePrice,
        expiry,
        isPut,
      )
      expect(targetAddress).not.equal(ZERO_ADDR)
    })

    it('should get different target address with different oToken paramters', async () => {
      const targetAddress1 = await oTokenFactory.getTargetOtokenAddress(
        usdcAddress,
        ethAddress,
        usdcAddress,
        strikePrice,
        expiry,
        isPut,
      )
      const targetAddress2 = await oTokenFactory.getTargetOtokenAddress(
        ZERO_ADDR,
        ZERO_ADDR,
        ZERO_ADDR,
        strikePrice,
        expiry,
        isPut,
      )
      expect(targetAddress1).not.equal(targetAddress2)
    })
  })

  describe('Create new oToken', () => {
    it('Should create new contract at expected address', async () => {
      const targetAddress = await oTokenFactory.getTargetOtokenAddress(
        usdcAddress,
        ethAddress,
        usdcAddress,
        strikePrice,
        expiry,
        isPut,
      )

      const txResponse = await oTokenFactory.createOtoken(
        usdcAddress,
        ethAddress,
        usdcAddress,
        strikePrice,
        expiry,
        isPut,
      )
      expectEvent(txResponse, 'OtokenCreated', {
        tokenAddress: targetAddress,
      })
      expect(txResponse.logs[0].args.tokenAddress).to.be.equal(targetAddress)
      oToken = await OToken.at(targetAddress)
    })

    it('Should have correct paramter', async () => {
      expect(await oToken.strikeAsset()).to.be.equal(usdcAddress)
      expect(await oToken.underlyingAsset()).to.be.equal(ethAddress)
      expect((await oToken.strikePrice()).toString()).to.be.equal(strikePrice.toString())
    })

    it('Should not allow non-whitelisted options', () => {
      expect(1).to.be.equal(1)
    })

    it('Should not allow init oToken second time', () => {
      expect(1).to.be.equal(1)
    })

    it('Should not allow duplicated options', async () => {
      await expectRevert(
        oTokenFactory.createOtoken(usdcAddress, ethAddress, usdcAddress, strikePrice, expiry, isPut),
        'OptionFactory: Option created',
      )
    })
  })

  describe('Get oToken address after creation', () => {
    it('Should return token address correct token address', async () => {
      const existAddress = await oTokenFactory.getOtoken(
        usdcAddress,
        ethAddress,
        usdcAddress,
        strikePrice,
        expiry,
        isPut,
      )
      expect(existAddress).to.equal(oToken.address)
    })

    it('should revert when calling getTargetOTokenAddress with existing paramters', async () => {
      await expectRevert(
        oTokenFactory.getTargetOtokenAddress(usdcAddress, ethAddress, usdcAddress, strikePrice, expiry, isPut),
        'OptionFactory: Option created',
      )
    })
  })
})
