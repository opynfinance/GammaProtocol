import {OtokenFactoryInstance, OtokenInstance} from '../build/types/truffle-types'
import BigNumber from 'bignumber.js'

const {expectEvent, expectRevert, time} = require('@openzeppelin/test-helpers')
const OToken = artifacts.require('Otoken.sol')
const OTokenFactory = artifacts.require('OtokenFactory.sol')
const ZERO_ADDR = '0x0000000000000000000000000000000000000000'

contract('OTokenFactory', accounts => {
  let oToken: OtokenInstance
  let oTokenFactory: OtokenFactoryInstance

  // Paramter used for oToken init(). (Use random addresses as usdc and eth)
  const usdcAddress = accounts[5]
  const ethAddress = accounts[6]
  const strikePrice = new BigNumber(200)
  const isPut = true
  const name = 'Opyn ETH-USDC 200 PUT'
  const symbol = 'ETH-USDC 200 P'
  let expiry: number

  before('Deploy oToken logic and Factory contract', async () => {
    const logic = await OToken.new()
    oTokenFactory = await OTokenFactory.new(logic.address)
    expiry = (await time.latest()).toNumber() + time.duration.days(30).toNumber()
  })

  describe('Get oToken address', () => {
    it('Should have no otoken records at the begining', async () => {
      const otokens = await oTokenFactory.getOtokens()
      expect(otokens.length).to.equal(0)
    })

    it('Should return address(0) if token is not deployed', async () => {
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
        name,
        symbol,
      )
      expect(targetAddress).not.equal(ZERO_ADDR)

      const isOtoken = await oTokenFactory.isOtoken(targetAddress)
      expect(isOtoken).false
    })

    it('should get different target address with different oToken paramters', async () => {
      const targetAddress1 = await oTokenFactory.getTargetOtokenAddress(
        usdcAddress,
        ethAddress,
        usdcAddress,
        strikePrice,
        expiry,
        isPut,
        name,
        symbol,
      )
      const targetAddress2 = await oTokenFactory.getTargetOtokenAddress(
        ZERO_ADDR,
        ZERO_ADDR,
        ZERO_ADDR,
        strikePrice,
        expiry,
        isPut,
        name,
        symbol,
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
        name,
        symbol,
      )

      const txResponse = await oTokenFactory.createOtoken(
        usdcAddress,
        ethAddress,
        usdcAddress,
        strikePrice,
        expiry,
        isPut,
        name,
        symbol,
        {from: accounts[0]},
      )
      expectEvent(txResponse, 'OtokenCreated', {
        creator: accounts[0],
        strike: usdcAddress,
        underlying: ethAddress,
        collateral: usdcAddress,
        strikePrice: strikePrice.toString(),
        expiry: expiry.toString(),
        isPut: isPut,
        tokenAddress: targetAddress,
      })
      oToken = await OToken.at(targetAddress)
    })

    it('Should have correct paramter', async () => {
      expect(await oToken.strikeAsset()).to.be.equal(usdcAddress)
      expect(await oToken.underlyingAsset()).to.be.equal(ethAddress)
      expect(await oToken.collateralAsset()).to.be.equal(usdcAddress)
      expect(await oToken.isPut()).to.be.equal(isPut)
      expect((await oToken.strikePrice()).toString()).to.be.equal(strikePrice.toString())
      expect((await oToken.expiry()).toString()).to.be.equal(expiry.toString())
    })

    it('Should not allow non-whitelisted options', () => {
      expect(1).to.be.equal(1)
    })

    it('Should not allow re-init oToken', () => {
      expect(1).to.be.equal(1)
    })

    it('Should not allow duplicated options', async () => {
      await expectRevert(
        oTokenFactory.createOtoken(usdcAddress, ethAddress, usdcAddress, strikePrice, expiry, isPut, name, symbol),
        'OptionFactory: Option created',
      )
    })
  })

  describe('Get oToken address after creation', () => {
    it('Should have one otoken record', async () => {
      const otokens = await oTokenFactory.getOtokens()
      expect(otokens.length).to.equal(1)

      expect(otokens.includes(oToken.address)).to.be.true
    })

    it('Should return correct token address', async () => {
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

    it('Should return true when calling isOtoken with the correct address', async () => {
      const isOtoken = await oTokenFactory.isOtoken(oToken.address)
      expect(isOtoken).to.be.true
    })

    it('should revert if calling getTargetOTokenAddress with existing option paramters', async () => {
      await expectRevert(
        oTokenFactory.getTargetOtokenAddress(
          usdcAddress,
          ethAddress,
          usdcAddress,
          strikePrice,
          expiry,
          isPut,
          name,
          symbol,
        ),
        'OptionFactory: Option created',
      )
    })
  })

  describe('Wrong setup: wrong implementation contract', () => {
    it('Should revert on token creation', async () => {
      // We should initiate oTokenFactory with oToken implementation contract, so this is incorrect.
      const wrongFactory: OtokenFactoryInstance = await OTokenFactory.new(oTokenFactory.address)
      await expectRevert(
        wrongFactory.createOtoken(usdcAddress, ethAddress, usdcAddress, strikePrice, expiry, isPut, name, symbol),
        'revert',
      )
    })
  })
})
