import {
  MockERC20Instance,
  MockAddressBookInstance,
  WETH9Instance,
  MarginPoolInstance,
  MockDumbERC20Instance,
} from '../../build/types/truffle-types'
import BigNumber from 'bignumber.js'

const { expectRevert, ether } = require('@openzeppelin/test-helpers')

const MockERC20 = artifacts.require('MockERC20.sol')
const MockDumbERC20 = artifacts.require('MockDumbERC20.sol')
const MockAddressBook = artifacts.require('MockAddressBook.sol')
const WETH9 = artifacts.require('WETH9.sol')
const MarginPool = artifacts.require('MarginPool.sol')

// address(0)
const ZERO_ADDR = '0x0000000000000000000000000000000000000000'

contract('MarginPool', ([owner, controllerAddress, farmer, user1, random]) => {
  const usdcToMint = ether('1000')
  const wethToMint = ether('50')
  // ERC20 mocks
  let usdc: MockERC20Instance
  let weth: WETH9Instance
  // DumbER20: Return false when transfer fail.
  let dumbToken: MockDumbERC20Instance
  // addressbook module mock
  let addressBook: MockAddressBookInstance
  // margin pool
  let marginPool: MarginPoolInstance

  before('Deployment', async () => {
    // deploy USDC token
    usdc = await MockERC20.new('USDC', 'USDC', 6)
    // deploy WETH token for testing
    weth = await WETH9.new()
    // deploy dumb erc20
    dumbToken = await MockDumbERC20.new('DUSDC', 'DUSDC', 6)
    // deploy AddressBook mock
    addressBook = await MockAddressBook.new()
    // set Controller module address
    await addressBook.setController(controllerAddress)
    // deploy MarginPool module
    marginPool = await MarginPool.new(addressBook.address)

    // mint usdc
    await usdc.mint(user1, usdcToMint)
    // wrap ETH in Controller module level
    await weth.deposit({ from: controllerAddress, value: wethToMint })

    // controller approving infinite amount of WETH to pool
    await weth.approve(marginPool.address, wethToMint, { from: controllerAddress })
  })

  describe('MarginPool initialization', () => {
    it('should revert if initilized with 0 addressBook address', async () => {
      await expectRevert(MarginPool.new(ZERO_ADDR), 'Invalid address book')
    })
  })

  describe('Transfer to pool', () => {
    const usdcToTransfer = ether('250')
    const wethToTransfer = ether('25')

    it('should revert transfering to pool from caller other than controller address', async () => {
      // user approve USDC transfer
      await usdc.approve(marginPool.address, usdcToTransfer, { from: user1 })

      await expectRevert(
        marginPool.transferToPool(usdc.address, user1, usdcToTransfer, { from: random }),
        'MarginPool: Sender is not Controller',
      )
    })

    it('should revert transfering to pool an amount equal to zero', async () => {
      // user approve USDC transfer
      await usdc.approve(marginPool.address, usdcToTransfer, { from: user1 })

      await expectRevert(
        marginPool.transferToPool(usdc.address, user1, ether('0'), { from: controllerAddress }),
        'MarginPool: transferToPool amount is equal to 0',
      )
    })

    it('should revert transfering to pool if the address of the sender is the margin pool', async () => {
      // user approve USDC transfer
      await usdc.approve(marginPool.address, usdcToTransfer, { from: user1 })

      await expectRevert(
        marginPool.transferToPool(usdc.address, marginPool.address, ether('1'), { from: controllerAddress }),
        'ERC20: transfer amount exceeds balance',
      )
    })

    it('should transfer to pool from user when called by the controller address', async () => {
      const userBalanceBefore = new BigNumber(await usdc.balanceOf(user1))
      const poolBalanceBefore = new BigNumber(await usdc.balanceOf(marginPool.address))

      // user approve USDC transfer
      await usdc.approve(marginPool.address, usdcToTransfer, { from: user1 })

      await marginPool.transferToPool(usdc.address, user1, usdcToTransfer, { from: controllerAddress })

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

      await marginPool.transferToPool(weth.address, controllerAddress, wethToTransfer, { from: controllerAddress })

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

    it('should revert when transferFrom return false on dumbERC20', async () => {
      await expectRevert(
        marginPool.transferToPool(dumbToken.address, user1, ether('1'), { from: controllerAddress }),
        'SafeERC20: ERC20 operation did not succeed',
      )
    })
  })

  describe('Transfer to user', () => {
    const usdcToTransfer = ether('250')
    const wethToTransfer = ether('25')

    it('should revert transfering to user from caller other than controller address', async () => {
      await expectRevert(
        marginPool.transferToUser(usdc.address, user1, usdcToTransfer, { from: random }),
        'MarginPool: Sender is not Controller',
      )
    })

    it('should revert transfering to user if the user address is the margin pool addres', async () => {
      await expectRevert(
        marginPool.transferToUser(usdc.address, marginPool.address, usdcToTransfer, { from: controllerAddress }),
        'MarginPool: cannot transfer assets to oneself',
      )
    })

    it('should transfer an ERC-20 to user from pool when called by the controller address', async () => {
      const userBalanceBefore = new BigNumber(await usdc.balanceOf(user1))
      const poolBalanceBefore = new BigNumber(await usdc.balanceOf(marginPool.address))

      await marginPool.transferToUser(usdc.address, user1, usdcToTransfer, { from: controllerAddress })

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
      await marginPool.transferToUser(weth.address, controllerAddress, wethToTransfer, { from: controllerAddress })
      // unwrap WETH to ETH
      await weth.withdraw(wethToTransfer, { from: controllerAddress })
      // send ETH to user
      await web3.eth.sendTransaction({ from: controllerAddress, to: user1, value: wethToTransfer })

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

    it('should revert when transfer return false on dumbERC20', async () => {
      await dumbToken.mint(user1, ether('1'))
      await dumbToken.approve(marginPool.address, ether('1'), { from: user1 })
      await marginPool.transferToPool(dumbToken.address, user1, ether('1'), { from: controllerAddress })
      // let the transfer failed
      await dumbToken.setLocked(true)
      await expectRevert(
        marginPool.transferToUser(dumbToken.address, user1, ether('1'), { from: controllerAddress }),
        'SafeERC20: ERC20 operation did not succeed',
      )
      await dumbToken.setLocked(false)
    })
  })

  describe('Transfer multiple assets to pool', () => {
    const usdcToTransfer = ether('250')
    const wethToTransfer = ether('25')

    it('should revert transfering an array to pool from caller other than controller address', async () => {
      // user approve USDC and WETH transfer
      await usdc.approve(marginPool.address, usdcToTransfer, { from: user1 })
      await weth.approve(marginPool.address, wethToTransfer, { from: user1 })

      await expectRevert(
        marginPool.batchTransferToPool([usdc.address, weth.address], [user1, user1], [usdcToTransfer, wethToTransfer], {
          from: random,
        }),
        'MarginPool: Sender is not Controller',
      )
    })
    it('should revert transfering to pool an array with an amount equal to zero', async () => {
      // user approve USDC transfer
      await usdc.approve(marginPool.address, usdcToTransfer, { from: user1 })
      await weth.approve(marginPool.address, wethToTransfer, { from: user1 })

      await expectRevert(
        marginPool.batchTransferToPool([usdc.address, weth.address], [user1, user1], [ether('0'), wethToTransfer], {
          from: controllerAddress,
        }),
        'MarginPool: transferToPool amount is equal to 0',
      )
    })

    it('should revert with different size arrays', async () => {
      await expectRevert(
        marginPool.batchTransferToPool(
          [usdc.address, weth.address],
          [user1, user1],
          [usdcToTransfer, usdcToTransfer, usdcToTransfer],
          { from: controllerAddress },
        ),
        'MarginPool: batchTransferToPool array lengths are not equal',
      )
    })

    it('should transfer an array including weth and usdc to pool from user/controller when called by the controller address', async () => {
      const userUsdcBalanceBefore = new BigNumber(await usdc.balanceOf(user1))
      const poolUsdcBalanceBefore = new BigNumber(await usdc.balanceOf(marginPool.address))
      const controllerWethBalanceBefore = new BigNumber(await weth.balanceOf(controllerAddress))
      const poolWethBalanceBefore = new BigNumber(await weth.balanceOf(marginPool.address))

      // user approve USDC and WETH transfer
      await usdc.approve(marginPool.address, usdcToTransfer, { from: user1 })
      await weth.approve(marginPool.address, wethToTransfer, { from: user1 })

      await marginPool.batchTransferToPool(
        [usdc.address, weth.address],
        [user1, controllerAddress],
        [usdcToTransfer, wethToTransfer],
        { from: controllerAddress },
      )

      const userUsdcBalanceAfter = new BigNumber(await usdc.balanceOf(user1))
      const poolUsdcBalanceAfter = new BigNumber(await usdc.balanceOf(marginPool.address))
      const controllerWethBalanceAfter = new BigNumber(await weth.balanceOf(controllerAddress))
      const poolWethBalanceAfter = new BigNumber(await weth.balanceOf(marginPool.address))

      assert.equal(
        new BigNumber(usdcToTransfer).toString(),
        userUsdcBalanceBefore.minus(userUsdcBalanceAfter).toString(),
        'USDC value transfered from user mismatch',
      )

      assert.equal(
        new BigNumber(usdcToTransfer).toString(),
        poolUsdcBalanceAfter.minus(poolUsdcBalanceBefore).toString(),
        'USDC value transfered into pool mismatch',
      )

      assert.equal(
        new BigNumber(wethToTransfer).toString(),
        controllerWethBalanceBefore.minus(controllerWethBalanceAfter).toString(),
        'WETH value transfered from controller mismatch',
      )

      assert.equal(
        new BigNumber(wethToTransfer).toString(),
        poolWethBalanceAfter.minus(poolWethBalanceBefore).toString(),
        'WETH value transfered into pool mismatch',
      )
    })
  })

  describe('Transfer multiple assets to user', () => {
    const usdcToTransfer = ether('250')
    const wethToTransfer = ether('25')

    it('should revert transfering to user from caller other than controller address', async () => {
      await expectRevert(
        marginPool.batchTransferToUser([usdc.address, weth.address], [user1, user1], [usdcToTransfer, wethToTransfer], {
          from: random,
        }),
        'MarginPool: Sender is not Controller',
      )
    })

    it('should revert with different size arrays', async () => {
      await expectRevert(
        marginPool.batchTransferToUser(
          [usdc.address, weth.address],
          [user1, user1],
          [usdcToTransfer, usdcToTransfer, usdcToTransfer],
          { from: controllerAddress },
        ),
        'MarginPool: batchTransferToUser array lengths are not equal',
      )
    })

    it('should batch transfer to users when called from controller', async () => {
      const userUsdcBalanceBefore = new BigNumber(await usdc.balanceOf(user1))
      const poolUsdcBalanceBefore = new BigNumber(await usdc.balanceOf(marginPool.address))
      const controllerWethBalanceBefore = new BigNumber(await weth.balanceOf(controllerAddress))
      const poolWethBalanceBefore = new BigNumber(await weth.balanceOf(marginPool.address))

      await marginPool.batchTransferToUser(
        [usdc.address, weth.address],
        [user1, controllerAddress],
        [poolUsdcBalanceBefore, poolWethBalanceBefore],
        { from: controllerAddress },
      )

      const userUsdcBalanceAfter = new BigNumber(await usdc.balanceOf(user1))
      const poolUsdcBalanceAfter = new BigNumber(await usdc.balanceOf(marginPool.address))
      const controllerWethBalanceAfter = new BigNumber(await weth.balanceOf(controllerAddress))
      const poolWethBalanceAfter = new BigNumber(await weth.balanceOf(marginPool.address))

      assert.equal(
        poolUsdcBalanceBefore.toString(),
        userUsdcBalanceAfter.minus(userUsdcBalanceBefore).toString(),
        'USDC value transfered to user mismatch',
      )

      assert.equal(
        poolUsdcBalanceBefore.toString(),
        poolUsdcBalanceBefore.minus(poolUsdcBalanceAfter).toString(),
        'USDC value transfered from pool mismatch',
      )

      assert.equal(
        poolWethBalanceBefore.toString(),
        controllerWethBalanceAfter.minus(controllerWethBalanceBefore).toString(),
        'WETH value transfered to controller mismatch',
      )

      assert.equal(
        poolWethBalanceBefore.toString(),
        poolWethBalanceBefore.minus(poolWethBalanceAfter).toString(),
        'WETH value transfered from pool mismatch',
      )
    })
  })

  describe('Farming', () => {
    before(async () => {
      // send more usdc to pool
      await usdc.mint(marginPool.address, new BigNumber('100'))
    })

    it('should revert setting farmer address from non-owner', async () => {
      await expectRevert(marginPool.setFarmer(farmer, { from: random }), 'Ownable: caller is not the owner')
    })

    it('should set farmer address when called from owner', async () => {
      await marginPool.setFarmer(farmer, { from: owner })

      assert.equal(await marginPool.farmer(), farmer, 'farmer address mismatch')
    })

    it('should revert farming when receiver address is equal to zero', async () => {
      const poolStoredBalanceBefore = new BigNumber(await marginPool.getStoredBalance(usdc.address))
      const poolBlanaceBefore = new BigNumber(await usdc.balanceOf(marginPool.address))
      const amountToFarm = poolBlanaceBefore.minus(poolStoredBalanceBefore)

      await expectRevert(
        marginPool.farm(usdc.address, ZERO_ADDR, amountToFarm, { from: farmer }),
        'MarginPool: invalid receiver address',
      )
    })

    it('should revert farming when sender is not farmer address', async () => {
      const poolStoredBalanceBefore = new BigNumber(await marginPool.getStoredBalance(usdc.address))
      const poolBlanaceBefore = new BigNumber(await usdc.balanceOf(marginPool.address))
      const amountToFarm = poolBlanaceBefore.minus(poolStoredBalanceBefore)

      await expectRevert(
        marginPool.farm(usdc.address, random, amountToFarm, { from: random }),
        'MarginPool: Sender is not farmer',
      )
    })

    it('should farm additional USDC', async () => {
      const poolStoredBalanceBefore = new BigNumber(await marginPool.getStoredBalance(usdc.address))
      const poolBlanaceBefore = new BigNumber(await usdc.balanceOf(marginPool.address))
      const farmerBalanceBefore = new BigNumber(await usdc.balanceOf(farmer))
      const amountToFarm = poolBlanaceBefore.minus(poolStoredBalanceBefore)

      await marginPool.farm(usdc.address, farmer, amountToFarm, { from: farmer })

      const poolStoredBalanceAfter = new BigNumber(await marginPool.getStoredBalance(usdc.address))
      const poolBlanaceAfter = new BigNumber(await usdc.balanceOf(marginPool.address))
      const farmerBalanceAfter = new BigNumber(await usdc.balanceOf(farmer))

      assert.equal(
        poolStoredBalanceBefore.toString(),
        poolStoredBalanceAfter.toString(),
        'Pool stored balance mismatch',
      )
      assert.equal(
        poolBlanaceBefore.minus(poolBlanaceAfter).toString(),
        amountToFarm.toString(),
        'Pool balance mismatch',
      )
      assert.equal(
        farmerBalanceAfter.minus(farmerBalanceBefore).toString(),
        amountToFarm.toString(),
        'Farmer balance mismatch',
      )
    })

    it('should revert farming when amount is greater than available balance to farm', async () => {
      const amountToFarm = new BigNumber('100000000000')

      await expectRevert(
        marginPool.farm(usdc.address, farmer, amountToFarm, { from: farmer }),
        'MarginPool: amount to farm exceeds limit',
      )
    })

    it('should revert farming when transfer return false for dumbERC20', async () => {
      const amountExcess = ether('1')
      await dumbToken.mint(marginPool.address, amountExcess)
      await dumbToken.setLocked(true)

      await expectRevert(
        marginPool.farm(dumbToken.address, farmer, amountExcess, { from: farmer }),
        'SafeERC20: ERC20 operation did not succeed',
      )
    })
  })
})
