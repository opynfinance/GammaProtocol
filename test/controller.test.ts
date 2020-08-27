import {
  MockOtokenInstance,
  MockERC20Instance,
  MockOracleInstance,
  MockChainlinkOracleInstance,
  MockAddressBookInstance,
  ControllerInstance,
} from '../build/types/truffle-types'
import BigNumber from 'bignumber.js'

const {expectRevert} = require('@openzeppelin/test-helpers')

const MockERC20 = artifacts.require('MockERC20.sol')
const MockOtoken = artifacts.require('MockOtoken.sol')
const MockOracle = artifacts.require('MockOracle.sol')
const MockChainlinkOracle = artifacts.require('MockChainlinkOracle.sol')
const MockAddressBook = artifacts.require('MockAddressBook.sol')
const Controller = artifacts.require('Controller.sol')

// address(0)
const ZERO_ADDR = '0x0000000000000000000000000000000000000000'

contract('Controller', ([owner, accountOwner1, accountOperator1, random]) => {
  const batch = web3.utils.asciiToHex('ETHUSDCUSDC1596218762')
  // ERC20 mock
  let usdc: MockERC20Instance
  let weth: MockERC20Instance
  // Otoken mock
  let otoken: MockOtokenInstance
  // Chainlink mock instance
  let batchOracle: MockChainlinkOracleInstance
  // Oracle module
  let oracle: MockOracleInstance
  // addressbook module mock
  let addressBook: MockAddressBookInstance
  // controller module
  let controller: ControllerInstance

  before('Deployment', async () => {
    // ERC20 deployment
    usdc = await MockERC20.new('USDC', 'USDC')
    weth = await MockERC20.new('WETH', 'WETH')
    // Otoken deployment
    otoken = await MockOtoken.new()
    // init otoken
    await otoken.init(
      weth.address,
      usdc.address,
      usdc.address,
      new BigNumber(200).times(new BigNumber(10).exponentiatedBy(18)),
      1753776000, // 07/29/2025 @ 8:00am (UTC)
      true,
    )
    // addressbook
    addressBook = await MockAddressBook.new()
    // deploy price feed mock
    batchOracle = await MockChainlinkOracle.new({from: owner})
    // deploy Oracle module
    oracle = await MockOracle.new(addressBook.address, {from: owner})
    // set oracle in AddressBook
    await addressBook.setOracle(oracle.address)
    // deploy Controller module
    controller = await Controller.new(addressBook.address)
    // set controller address in AddressBook
    await addressBook.setController(controller.address, {from: owner})

    assert.equal(await controller.systemPaused(), false, 'System is paused')
  })

  describe('Controller initialization', () => {
    it('should revert if initilized with 0 addressBook address', async () => {
      await expectRevert(Controller.new(ZERO_ADDR), 'Invalid address book')
    })
  })

  describe('Account operator', () => {
    it('should set operator', async () => {
      await controller.setOperator(accountOperator1, true, {from: accountOwner1})

      assert.equal(await controller.isOperator(accountOwner1, accountOperator1), true, 'Operator address mismatch')
    })
  })

  describe('Vault', () => {
    // will be improved in later PR
    it('should get vault', async () => {
      const vaultId = new BigNumber(0)
      await controller.getVault(accountOwner1, vaultId)
    })

    // will be improved in later PR
    it('should get vault balance', async () => {
      const vaultId = new BigNumber(0)
      await controller.getVaultBalances(accountOwner1, vaultId)
    })
  })

  describe('Price', () => {
    before(async () => {
      const batch = await controller.getBatch(otoken.address)
      const expiryTimestampMock = new BigNumber('1598374220')
      const priceMock = new BigNumber('200')
      const disputePeriod = new BigNumber(60) // 1min

      await oracle.setBatchOracle(batch, batchOracle.address)
      await oracle.setDisputePeriod(batchOracle.address, disputePeriod)
      await oracle.setBatchUnderlyingPrice(batch, expiryTimestampMock, priceMock)
    })

    it('should check if price is finalized or not', async () => {
      const batch = await controller.getBatch(otoken.address)
      const otokenExpiryTimestamp = new BigNumber('1598374220')

      const expectedResutl = await oracle.isDisputePeriodOver(batch, otokenExpiryTimestamp)
      assert.equal(await controller.isPriceFinalized(otoken.address), expectedResutl, 'Price is not finalized')
    })
  })

  describe('Expiry', () => {
    it('should return false for non expired otoken', async () => {
      assert.equal(await controller.isExpired(otoken.address), false, 'Otoken expiry check mismatch')
    })

    it('should return true for  expired otoken', async () => {
      // Otoken deployment
      const expiredOtoken = await MockOtoken.new()
      // init otoken
      await expiredOtoken.init(
        weth.address,
        usdc.address,
        usdc.address,
        new BigNumber(200).times(new BigNumber(10).exponentiatedBy(18)),
        1219835219,
        true,
      )

      assert.equal(await controller.isExpired(expiredOtoken.address), true, 'Otoken expiry check mismatch')
    })
  })

  describe('Pause system', () => {
    it('should revert when pausing the system from non-owner', async () => {
      await expectRevert(controller.setSystemPaused(true, {from: random}), 'Ownable: caller is not the owner')
    })

    it('should pause system', async () => {
      const stateBefore = await controller.systemPaused()
      assert.equal(stateBefore, false, 'System already paused')

      await controller.setSystemPaused(true)

      const stateAfter = await controller.systemPaused()
      assert.equal(stateAfter, true, 'System not paused')
    })
  })
})
