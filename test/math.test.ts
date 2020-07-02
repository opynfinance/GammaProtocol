import {expect} from 'chai'
import {MathTesterInstance} from '../build/types/truffle-types'

const Math = artifacts.require('MathTester.sol')

const truffleAssert = require('truffle-assertions')

const {BN, time, expectEvent, expectRevert, balance} = require('@openzeppelin/test-helpers')

contract('Math Tester', accounts => {
  const creatorAddress = accounts[0]

  let math: MathTesterInstance

  before('set up contracts', async () => {
    math = await Math.deployed()
  })

  describe('Test Addition', () => {
    it('Test 2 + 5 = 7', async () => {
      const modResult = await math.add('5', '2')
      console.log(modResult.toString())
    })
  })
})
