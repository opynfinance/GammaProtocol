import {FixedPointInt256TesterInstance} from '../../build/types/truffle-types'
import BigNumber from 'bignumber.js'
import {createTokenAmount} from '../utils'
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

    it('Should return -2e18 for 5e18 - 7e18', async () => {
      const a = await lib.testFromUnscaledInt(new BigNumber(7))
      const b = await lib.testFromUnscaledInt(new BigNumber(5))
      const expectedResult = new BigNumber(-2).multipliedBy(1e18)

      assert.equal((await lib.testSub(b, a)).toString(), expectedResult.toString(), 'subtraction result mismatch')
    })
  })

  describe('Test mul', () => {
    it('Should return 10e18 for 2e18 * 5e18', async () => {
      const a = await lib.testFromUnscaledInt(new BigNumber(2))
      const b = await lib.testFromUnscaledInt(new BigNumber(5))
      const expectedResult = new BigNumber(10).multipliedBy(1e18)

      assert.equal((await lib.testMul(a, b)).toString(), expectedResult.toString(), 'multiplication result mismatch')
    })

    it('Should return 10 for -2 * -5', async () => {
      const a = await lib.testFromUnscaledInt(new BigNumber(-2))
      const b = await lib.testFromUnscaledInt(new BigNumber(-5))
      const expectedResult = new BigNumber(10).multipliedBy(1e18)

      assert.equal((await lib.testMul(a, b)).toString(), expectedResult.toString(), 'multiplication result mismatch')
    })

    it('Should return 10 for -2 * 5', async () => {
      const a = await lib.testFromUnscaledInt(new BigNumber(-2))
      const b = await lib.testFromUnscaledInt(new BigNumber(5))
      const expectedResult = new BigNumber(-10).multipliedBy(1e18)

      assert.equal((await lib.testMul(a, b)).toString(), expectedResult.toString(), 'multiplication result mismatch')
    })

    it('Should return 10 for 2 * -5', async () => {
      const a = await lib.testFromUnscaledInt(new BigNumber(2))
      const b = await lib.testFromUnscaledInt(new BigNumber(-5))
      const expectedResult = new BigNumber(-10).multipliedBy(1e18)

      assert.equal((await lib.testMul(a, b)).toString(), expectedResult.toString(), 'multiplication result mismatch')
    })

    it('Should return 0 for 0 * 5e18', async () => {
      const a = await lib.testFromUnscaledInt(new BigNumber(0))
      const b = await lib.testFromUnscaledInt(new BigNumber(5))

      assert.equal((await lib.testMul(a, b)).toString(), '0', 'multiplication result mismatch')
    })

    it('Should discard numbers < 1e-18', async () => {
      // 1e-20 * 2e-20 = 2 * 1e-36, should be discarded
      const a = {value: 1}
      const b = {value: 2}
      assert.equal((await lib.testMul(a, b)).toString(), '0', 'multiplication result mismatch')

      // 1e-18 * 2*e-1 = 2 * 1e-19, should be discarded
      const c = {value: 1}
      const d = {value: createTokenAmount(2, 17)}
      assert.equal((await lib.testMul(c, d)).toString(), '0', 'multiplication result mismatch')

      // 1e-9 * 2e-9 = 2 * 2e-20, should not be discarded
      const e = {value: createTokenAmount(1, 9)}
      const f = {value: createTokenAmount(2, 9)}
      assert.equal((await lib.testMul(e, f)).toString(), '2', 'multiplication result mismatch')
    })

    it('Should return 1e40 for 1e20 * 1e20', async () => {
      // max int: 2^255 = 5.7896045e+76
      const a = await lib.testFromUnscaledInt(createTokenAmount(1, 20))
      const expectedResult = await lib.testFromUnscaledInt(createTokenAmount(1, 40))
      assert.equal(
        (await lib.testMul(a, a)).toString(),
        expectedResult.value.toString(),
        'multiplication result mismatch',
      )
    })

    it('Should return overflow error when number is too big', async () => {
      // max int: 2^255 = 5.7896045e+76
      const b = {value: createTokenAmount(2, 40)}
      const c = {value: createTokenAmount(3, 40)}
      // this should overflow because 6e+76 > Max Int
      await expectRevert(lib.testMul(b, c), 'SignedSafeMath: multiplication overflow')
    })
  })

  describe('Test div', () => {
    it('Should return 2e18 for 10e18 divided by 5e18', async () => {
      const a = await lib.testFromUnscaledInt(new BigNumber(10))
      const b = await lib.testFromUnscaledInt(new BigNumber(5))
      const expectedResult = new BigNumber(2).multipliedBy(1e18)

      assert.equal((await lib.testDiv(a, b)).toString(), expectedResult.toString(), 'division result mismatch')
    })

    it('Should return -2e18 for -10e18 divided by 5e18', async () => {
      const a = await lib.testFromUnscaledInt(new BigNumber(-10))
      const b = await lib.testFromUnscaledInt(new BigNumber(5))
      const expectedResult = new BigNumber(-2).multipliedBy(1e18)

      assert.equal((await lib.testDiv(a, b)).toString(), expectedResult.toString(), 'division result mismatch')
    })

    it('Should return -2e18 for 10e18 divided by -5e18', async () => {
      const a = await lib.testFromUnscaledInt(new BigNumber(10))
      const b = await lib.testFromUnscaledInt(new BigNumber(-5))
      const expectedResult = new BigNumber(-2).multipliedBy(1e18)

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
