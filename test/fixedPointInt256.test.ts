import {FixedPointInt256TesterInstance} from '../build/types/truffle-types'
import BigNumber from 'bignumber.js'

const {expectRevert} = require('@openzeppelin/test-helpers')

const FixedPointInt256Tester = artifacts.require('FixedPointInt256Tester.sol')

contract('FixedPointInt256 lib', () => {
  let lib: FixedPointInt256TesterInstance

  before('set up contracts', async () => {
    lib = await FixedPointInt256Tester.new()
  })

  describe('Test Addition', () => {
    it('Should return 7e18 for 5e18 + 2e18', async () => {
      const a = await lib.testFromUnscaledInt(new BigNumber(5))
      const b = await lib.testFromUnscaledInt(new BigNumber(2))
      const expectedResult = new BigNumber(7).multipliedBy(1e18)

      assert.equal((await lib.testAdd(a, b)).toString(), expectedResult.toString(), 'adding result mismatch')
    })
  })

  describe('Test subtraction', () => {
    it('Should return 2e18 for 7e18 - 5e18', async () => {
      const a = await lib.testFromUnscaledInt(new BigNumber(7))
      const b = await lib.testFromUnscaledInt(new BigNumber(5))
      const expectedResult = new BigNumber(2).multipliedBy(1e18)

      assert.equal((await lib.testSub(a, b)).toString(), expectedResult.toString(), 'subtraction result mismatch')
    })
  })

  describe('Test mul', () => {
    it('Should return 10e18 for 2e18 * 5e18', async () => {
      const a = await lib.testFromUnscaledInt(new BigNumber(2))
      const b = await lib.testFromUnscaledInt(new BigNumber(5))
      const expectedResult = new BigNumber(10).multipliedBy(1e18)

      assert.equal((await lib.testMul(a, b)).toString(), expectedResult.toString(), 'multiplication result mismatch')
    })

    it('Should return 0 for 0 * 5e18', async () => {
      const a = new BigNumber(0)
      const b = new BigNumber(5).multipliedBy(1e18)

      assert.equal((await lib.testMul(a, b)).toString(), '0', 'multiplication result mismatch')
    })
  })

  describe('Test div', () => {
    it('Should return 2e18 for 10e18 divided by 5e18', async () => {
      const a = await lib.testFromUnscaledInt(new BigNumber(10))
      const b = await lib.testFromUnscaledInt(new BigNumber(5))
      const expectedResult = new BigNumber(2).multipliedBy(1e18)

      assert.equal((await lib.testDiv(a, b)).toString(), expectedResult.toString(), 'division result mismatch')
    })
  })

  describe('Test min', () => {
    it('Should return 3e18 between 3e18 and 5e18', async () => {
      const a = await lib.testFromUnscaledInt(new BigNumber(3))
      const b = await lib.testFromUnscaledInt(new BigNumber(5))
      const expectedResult = new BigNumber(3).multipliedBy(1e18)

      assert.equal((await lib.testMin(a, b)).toString(), expectedResult.toString(), 'minimum result mismatch')
    })

    it('Should return -2e18 between -2e18 and 2e18', async () => {
      const a = await lib.testFromUnscaledInt(new BigNumber(-2))
      const b = await lib.testFromUnscaledInt(new BigNumber(-2))
      const expectedResult = new BigNumber(-2).multipliedBy(1e18)

      assert.equal((await lib.testMin(a, b)).toString(), expectedResult.toString(), 'minimum result mismatch')
    })
  })

  describe('Test max', () => {
    it('Should return 3e18 between 3e18 and 1e18', async () => {
      const a = await lib.testFromUnscaledInt(new BigNumber(3))
      const b = await lib.testFromUnscaledInt(new BigNumber(1))
      const expectedResult = new BigNumber(3).multipliedBy(1e18)

      assert.equal((await lib.testMax(a, b)).toString(), expectedResult.toString(), 'maximum result mismatch')
    })
  })

  describe('Test comparison operator', () => {
    it('Should return if two int are equal or not', async () => {
      const a = await lib.testFromUnscaledInt(new BigNumber(3))
      const b = await lib.testFromUnscaledInt(new BigNumber(3))
      const expectedResult = true

      assert.equal(await lib.testIsEqual(a, b), expectedResult, 'isEqual result mismatch')
    })

    it('Should return if a is greater than b or not', async () => {
      const a = await lib.testFromUnscaledInt(new BigNumber(-2))
      const b = await lib.testFromUnscaledInt(new BigNumber(2))
      const expectedResult = false

      assert.equal(await lib.testIsGreaterThan(a, b), expectedResult, 'isGreaterThan result mismatch')
    })

    it('Should return if a is greater than or equal b', async () => {
      const a = await lib.testFromUnscaledInt(new BigNumber(-2))
      const b = await lib.testFromUnscaledInt(new BigNumber(-2))
      const expectedResult = true

      assert.equal(await lib.testIsGreaterThanOrEqual(a, b), expectedResult, 'isGreaterThanOrEqual result mismatch')
    })

    it('Should return if a is less than b or not', async () => {
      const a = await lib.testFromUnscaledInt(new BigNumber(-2))
      const b = await lib.testFromUnscaledInt(new BigNumber(0))
      const expectedResult = true

      assert.equal(await lib.testIsLessThan(a, b), expectedResult, 'isLessThan result mismatch')
    })

    it('Should return if a is less than or equal b', async () => {
      const a = await lib.testFromUnscaledInt(new BigNumber(0))
      const b = await lib.testFromUnscaledInt(new BigNumber(0))
      const expectedResult = true

      assert.equal(await lib.testIsLessThanOrEqual(a, b), expectedResult, 'isLessThanOrEqual result mismatch')
    })
  })
})
