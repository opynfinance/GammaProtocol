import { SignedConverterTesterInstance } from '../../build/types/truffle-types'
import BigNumber from 'bignumber.js'

const { expectRevert } = require('@openzeppelin/test-helpers')

const SignedConverterTester = artifacts.require('SignedConverterTester.sol')

contract('FixedPointInt256 lib', () => {
  let lib: SignedConverterTesterInstance

  before('set up contracts', async () => {
    lib = await SignedConverterTester.new()
  })

  describe('Test type conversion', () => {
    it('Should convert from unsigned integer to signed integer', async () => {
      const uint = new BigNumber(5)
      const expectedInt = new BigNumber(5)

      assert.equal(
        (await lib.testFromUint(uint)).toNumber(),
        expectedInt.toNumber(),
        'conversion from uint to int mismatch',
      )
    })

    it('It should revert converting an unsigned integer greater than 2^255  signed integer', async () => {
      const uint = new BigNumber(2).pow(255)
      await expectRevert(lib.testFromUint(uint), 'FixedPointInt256: out of int range')

      const uint2 = new BigNumber(2).pow(255).plus(1)
      await expectRevert(lib.testFromUint(uint2), 'FixedPointInt256: out of int range')
    })

    it('Should convert max_int (2^255) - 1 from uint to int', async () => {
      const uint = new BigNumber(2).pow(255).minus(1)
      assert.equal((await lib.testFromUint(uint)).toString(), uint.toString(), 'conversion from int to uint mismatch')
    })

    it('Should convert from signed integer to unsigned integer', async () => {
      const int = new BigNumber(-3)
      const expectedUint = new BigNumber(3)

      assert.equal(
        (await lib.testFromInt(int)).toNumber(),
        expectedUint.toNumber(),
        'conversion from int to uint mismatch',
      )
    })
    it('Should convert from positive signed integer to unsigned integer', async () => {
      const int = new BigNumber(3)
      const expectedUint = new BigNumber(3)

      assert.equal(
        (await lib.testFromInt(int)).toNumber(),
        expectedUint.toNumber(),
        'conversion from int to uint mismatch',
      )
    })
  })
})
