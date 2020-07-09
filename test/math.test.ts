import {expect} from 'chai'
import {MathTesterInstance} from '../build/types/truffle-types'

const Math = artifacts.require('MathTester.sol')

// const truffleAssert = require('truffle-assertions')

// const {BN, time, expectEvent, expectRevert, balance} = require('@openzeppelin/test-helpers')

contract('Math Tester', () => {
  // const creatorAddress = accounts[0]

  let math: MathTesterInstance

  before('set up contracts', async () => {
    math = await Math.deployed()
  })

  describe('Test Addition', () => {
    it('Should return 7 for 5 + 2', async () => {
      const modResult = await math.add('5', '2')
      expect(modResult.toNumber()).to.be.equal(7)
    })
  })

  describe('Test subtraction', () => {
    it('Should return 2 for 7 - 5', async () => {
      const modResult = await math.sub('7', '5')
      expect(modResult.toNumber()).to.be.equal(2)
    })
  })

  describe('Test Mul', () => {
    it('Should return 10 for 2 * 5.', async () => {
      const modResult = await math.mul('2000000000000000000', '5000000000000000000')
      expect(modResult.toString()).to.be.equal('10000000000000000000')
    })
  })

  describe('Test Div', () => {
    it('Should return 2 for 10 / 5.', async () => {
      const modResult = await math.div('10000000000000000000', '5000000000000000000')
      expect(modResult.toString()).to.be.equal('2000000000000000000')
    })
  })
})
