import {
  MockERC20Instance,
  MockAddressBookInstance,
  WETH9Instance,
  MarginPoolInstance,
} from '../build/types/truffle-types'

const BigNumber = require('bignumber.js')
const {expectEvent, expectRevert, ether} = require('@openzeppelin/test-helpers')

const MockERC20 = artifacts.require('MockERC20.sol')
const MockAddressBook = artifacts.require('MockAddressBook.sol')
const WETH9 = artifacts.require('WETH9.sol')
const MarginPool = artifacts.require('MarginPool.sol')

// address(0)
const ZERO_ADDR = '0x0000000000000000000000000000000000000000'

contract('MarginPool', ([controllerAddress, user1, random]) => {
  const usdcToMint = ether('1000')
  const wethToMint = ether('50')
  // ERC20 mocks
  let usdc: MockERC20Instance
  let weth: WETH9Instance
  // addressbook module mock
  let addressBook: MockAddressBookInstance
  // margin pool
  let marginPool: MarginPoolInstance

  before('Deployment', async () => {
    // deploy USDC token
    usdc = await MockERC20.new('USDC', 'USDC')
    // deploy WETH token for testing
    weth = await WETH9.new()
    // deploy AddressBook mock
    addressBook = await MockAddressBook.new()
    // set Controller module address
    await addressBook.setController(controllerAddress)
    // set WETH address
    // await addressBook.setWeth(weth.address)
    // deploy MarginPool module
    marginPool = await MarginPool.new(addressBook.address)

    // mint usdc
    await usdc.mint(user1, usdcToMint)
    // wrap ETH in Controller module level
    await weth.deposit({from: controllerAddress, value: wethToMint})
    //await weth.withdraw(ether("5"), {from: controllerAddress});

    // controller approving infinite amount of WETH to pool
    await weth.approve(marginPool.address, wethToMint, {from: controllerAddress})
  })

  describe('Transfer to pool', () => {
    const usdcToTransfer = ether('250')
    const wethToTransfer = ether('25')

    it('should revert transfering to pool from caller other than controller address', async () => {
      // user approve USDC transfer
      await usdc.approve(marginPool.address, usdcToTransfer, {from: user1})

      await expectRevert(
        marginPool.transferToPool(usdc.address, user1, usdcToTransfer, {from: random}),
        'MarginPool: Sender is not Controller',
      )
    })

    it('should revert transfering to pool an amount equal to zero', async () => {
      // user approve USDC transfer
      await usdc.approve(marginPool.address, usdcToTransfer, {from: user1})

      await expectRevert(
        marginPool.transferToPool(usdc.address, user1, ether('0'), {from: controllerAddress}),
        'MarginPool: transferToPool amount is below 0',
      )
    })

    it('should transfer to pool from user when called by the controller address', async () => {
      const userBalanceBefore = new BigNumber(await usdc.balanceOf(user1))
      const poolBalanceBefore = new BigNumber(await usdc.balanceOf(marginPool.address))

      // user approve USDC transfer
      await usdc.approve(marginPool.address, usdcToTransfer, {from: user1})

      await marginPool.transferToPool(usdc.address, user1, usdcToTransfer, {from: controllerAddress})

      const userBalanceAfter = new BigNumber(await usdc.balanceOf(user1))
      const poolBalanceAfter = new BigNumber(await usdc.balanceOf(marginPool.address))

      assert.equal(
        new BigNumber(usdcToTransfer).toString(),
        userBalanceBefore.minus(userBalanceAfter).toString(),
        'USDC value transfered from user mismatch',
      )

      assert.equal(
        new BigNumber(usdcToTransfer).toString(),
        poolBalanceAfter.minus(poolBalanceBefore).toString(),
        'USDC value transfered into pool mismatch',
      )
    })

    it('should transfer WETH to pool from controller when called by the controller address', async () => {
      const controllerBalanceBefore = new BigNumber(await weth.balanceOf(controllerAddress))
      const poolBalanceBefore = new BigNumber(await weth.balanceOf(marginPool.address))

      await marginPool.transferToPool(weth.address, controllerAddress, wethToTransfer, {from: controllerAddress})

      const controllerBalanceAfter = new BigNumber(await weth.balanceOf(controllerAddress))
      const poolBalanceAfter = new BigNumber(await weth.balanceOf(marginPool.address))

      assert.equal(
        new BigNumber(wethToTransfer).toString(),
        controllerBalanceBefore.minus(controllerBalanceAfter).toString(),
        'WETH value transfered from controller mismatch',
      )

      assert.equal(
        new BigNumber(wethToTransfer).toString(),
        poolBalanceAfter.minus(poolBalanceBefore).toString(),
        'WETH value transfered into pool mismatch',
      )
    })
  })

  describe('Transfer to user', () => {
    const usdcToTransfer = ether('250')
    const wethToTransfer = ether('25')

    it('should revert transfering to user from caller other than controller address', async () => {
      await expectRevert(
        marginPool.transferToUser(usdc.address, user1, usdcToTransfer, {from: random}),
        'MarginPool: Sender is not Controller',
      )
    })

    it('should revert transfering to user an amount equal to zero', async () => {
      await expectRevert(
        marginPool.transferToUser(usdc.address, user1, ether('0'), {from: controllerAddress}),
        'MarginPool: transferToUser amount is below 0',
      )
    })

    it('should transfer to user from pool when called by the controller address', async () => {
      const userBalanceBefore = new BigNumber(await usdc.balanceOf(user1))
      const poolBalanceBefore = new BigNumber(await usdc.balanceOf(marginPool.address))

      await marginPool.transferToUser(usdc.address, user1, usdcToTransfer, {from: controllerAddress})

      const userBalanceAfter = new BigNumber(await usdc.balanceOf(user1))
      const poolBalanceAfter = new BigNumber(await usdc.balanceOf(marginPool.address))

      assert.equal(
        new BigNumber(usdcToTransfer).toString(),
        userBalanceAfter.minus(userBalanceBefore).toString(),
        'USDC value transfered to user mismatch',
      )

      assert.equal(
        new BigNumber(usdcToTransfer).toString(),
        poolBalanceBefore.minus(poolBalanceAfter).toString(),
        'USDC value transfered from pool mismatch',
      )
    })

    it('should transfer WETH to controller from pool, unwrap it and transfer ETH to user when called by the controller address', async () => {
      const poolBalanceBefore = new BigNumber(await weth.balanceOf(marginPool.address))
      const userBalanceBefore = new BigNumber(await web3.eth.getBalance(user1))

      // transfer to controller
      await marginPool.transferToUser(weth.address, controllerAddress, wethToTransfer, {from: controllerAddress})
      // unwrap WETH to ETH
      await weth.withdraw(wethToTransfer)
      // send ETH to user
      await web3.eth.sendTransaction({from: controllerAddress, to: user1, value: wethToTransfer})

      const poolBalanceAfter = new BigNumber(await weth.balanceOf(marginPool.address))
      const userBalanceAfter = new BigNumber(await web3.eth.getBalance(user1))

      assert.equal(
        new BigNumber(wethToTransfer).toString(),
        poolBalanceBefore.minus(poolBalanceAfter).toString(),
        'WETH value un-wrapped from pool mismatch',
      )

      assert.equal(
        new BigNumber(wethToTransfer).toString(),
        userBalanceAfter.minus(userBalanceBefore).toString(),
        'ETH value transfered to user mismatch',
      )
    })
  })
})
