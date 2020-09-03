import {USDCPricerInstance, MockOracleInstance, MockERC20Instance} from '../build/types/truffle-types'
import BigNumber from 'bignumber.js'

const {time} = require('@openzeppelin/test-helpers')

const USDCPricer = artifacts.require('USDCPricer.sol')
const MockOracle = artifacts.require('MockOracle.sol')
const MockERC20 = artifacts.require('MockERC20.sol')

contract('USDCPricer', ([owner, random]) => {
  let oracle: MockOracleInstance
  let usdc: MockERC20Instance
  let pricer: USDCPricerInstance

  before('Deployment', async () => {
    // deploy mock contracts
    oracle = await MockOracle.new()
    usdc = await MockERC20.new('USDC', 'USDC', 6, {from: owner})
    pricer = await USDCPricer.new(usdc.address, oracle.address)
  })

  describe('getPrice', () => {
    it('should return 1e18', async () => {
      const price = await pricer.getPrice()
      const expectedResult = new BigNumber(1).times(1e18)
      assert.equal(price.toString(), expectedResult.toString())
    })
  })

  describe('setExpiryPrice', () => {
    it('everyone can set an price to oracle', async () => {
      const expiry = (await time.latest()) + time.duration.days(30).toNumber()

      await pricer.setExpiryPriceToOralce(expiry, {from: random})
      const priceFromOracle = await oracle.getExpiryPrice(usdc.address, expiry)
      const expectedResult = new BigNumber(1).times(1e18)
      assert.equal(expectedResult.toString(), priceFromOracle[0].toString())
    })
  })
})
