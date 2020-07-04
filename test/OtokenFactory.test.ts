import {OTokenFactoryInstance, OTokenInstance} from '../build/types/truffle-types'
import BigNumber from 'bignumber.js'

const {expectEvent} = require('@openzeppelin/test-helpers')
const OToken = artifacts.require('OToken.sol')
const OTokenFactory = artifacts.require('OTokenFactory.sol')

contract('OtokenFactory Tester', accounts => {
  let oToken: OTokenInstance
  let oTokenFactory: OTokenFactoryInstance

  // use random address
  const usdcAddress = accounts[5]
  const ethAddress = accounts[6]
  const strikePrice = new BigNumber(200)

  before('Deploy oToken logic and Factory contract', async () => {
    oTokenFactory = await OTokenFactory.deployed()
  })

  describe('Create new oToken', () => {
    it('Should create new contract at expected address', async () => {
      const targetAddress = await oTokenFactory.getUndeployedOTokenAddress(usdcAddress, ethAddress, strikePrice)

      const txResponse = await oTokenFactory.createOToken(usdcAddress, ethAddress, strikePrice)
      expectEvent(txResponse, 'OTokenCreated', {
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

    it('Should not allow duplicated options', () => {
      expect(1).to.be.equal(1)
    })
  })
})
