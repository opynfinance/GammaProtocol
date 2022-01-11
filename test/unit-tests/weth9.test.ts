import { WETH9Instance } from '../../build/types/truffle-types'
const BigNumber = require('bignumber.js')
const { expectEvent } = require('@openzeppelin/test-helpers')
const WETH9 = artifacts.require('WETH9.sol')

contract('WETH9', ([sender]) => {
  let weth: WETH9Instance

  before('Deployment', async () => {
    // deploy USDC token
    weth = await WETH9.new()
  })

  describe('Send ETH', () => {
    it('should increase WETH balance and total supply when sending a transaction to contract', async () => {
      const balanceBefore = new BigNumber(await weth.balanceOf(sender))
      const totalSuppluBefore = new BigNumber(await weth.totalSupply())

      const value = new BigNumber(web3.utils.toWei('1', 'ether'))

      await web3.eth.sendTransaction({
        from: sender,
        to: weth.address,
        value: value,
      })

      const balanceAfter = new BigNumber(await weth.balanceOf(sender))
      const totalSupplyAfter = new BigNumber(await weth.totalSupply())

      assert.equal(
        value.toString(),
        balanceAfter.minus(balanceBefore).toString(),
        'Wrapped ETH amount mismatch when calling fallback',
      )
      assert.equal(
        value.toString(),
        totalSupplyAfter.minus(totalSuppluBefore).toString(),
        'Total supply mismatch when calling fallback',
      )
    })

    it('should increase WETH and total supply when depositing ETH', async () => {
      const balanceBefore = new BigNumber(await weth.balanceOf(sender))
      const totalSuppluBefore = new BigNumber(await weth.totalSupply())

      const value = new BigNumber(web3.utils.toWei('1', 'ether'))

      await weth.deposit({ from: sender, value: value })

      const balanceAfter = new BigNumber(await weth.balanceOf(sender))
      const totalSupplyAfter = new BigNumber(await weth.totalSupply())

      assert.equal(
        value.toString(),
        balanceAfter.minus(balanceBefore).toString(),
        'Wrapped ETH amount mismatch when calling deposit',
      )
      assert.equal(
        value.toString(),
        totalSupplyAfter.minus(totalSuppluBefore).toString(),
        'Total supply mismatch when calling deposit',
      )
    })
  })

  describe('Withdraw ETH', () => {
    it('should decrease WETH balance, total supply and increase ETH when withdrawing', async () => {
      const balanceBefore = new BigNumber(await weth.balanceOf(sender))
      const totalSuppluBefore = new BigNumber(await weth.totalSupply())

      const value = new BigNumber(web3.utils.toWei('1', 'ether'))

      const tx = await weth.withdraw(value, { from: sender })

      expectEvent(tx, 'Withdrawal', {
        src: sender,
        wad: value.toString(),
      })

      const balanceAfter = new BigNumber(await weth.balanceOf(sender))
      const totalSupplyAfter = new BigNumber(await weth.totalSupply())

      assert.equal(
        value.toString(),
        balanceBefore.minus(balanceAfter).toString(),
        'Wrapped ETH amount mismatch when calling withdraw',
      )
      assert.equal(
        value.toString(),
        totalSuppluBefore.minus(totalSupplyAfter).toString(),
        'Total supply mismatch when calling withdraw',
      )
    })
  })
})
