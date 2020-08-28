import {
  MockMarginCalculatorInstance,
  MockOtokenInstance,
  MockERC20Instance,
  MockOracleInstance,
  MockChainlinkOracleInstance,
  MockAddressBookInstance,
  MockWhitelistModuleInstance,
  MarginPoolInstance,
  ControllerInstance,
} from '../build/types/truffle-types'
import BigNumber from 'bignumber.js'

const {expectRevert, time} = require('@openzeppelin/test-helpers')

const MockERC20 = artifacts.require('MockERC20.sol')
const MockOtoken = artifacts.require('MockOtoken.sol')
const MockOracle = artifacts.require('MockOracle.sol')
const MockChainlinkOracle = artifacts.require('MockChainlinkOracle.sol')
const MockMarginCalculator = artifacts.require('MockMarginCalculator.sol')
const MockWhitelistModule = artifacts.require('MockWhitelistModule.sol')
const MockAddressBook = artifacts.require('MockAddressBook.sol')
const MarginPool = artifacts.require('MarginPool.sol')
const Controller = artifacts.require('Controller.sol')

// address(0)
const ZERO_ADDR = '0x0000000000000000000000000000000000000000'

enum ActionType {
  OpenVault,
  MintShortOption,
  BurnShortOption,
  DepositLongOption,
  WithdrawLongOption,
  DepositCollateral,
  WithdrawCollateral,
  SettleVault,
  Exercise,
  Call,
}

contract('Controller', ([owner, accountOwner1, accountOperator1, random]) => {
  // ERC20 mock
  let usdc: MockERC20Instance
  let weth: MockERC20Instance
  // Otoken mock
  let otoken: MockOtokenInstance
  // Chainlink mock instance
  let batchOracle: MockChainlinkOracleInstance
  // Oracle module
  let oracle: MockOracleInstance
  // calculator module
  let calculator: MockMarginCalculatorInstance
  // margin pool module
  let marginPool: MarginPoolInstance
  // whitelist module mock
  let whitelist: MockWhitelistModuleInstance
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
    // addressbook deployment
    addressBook = await MockAddressBook.new()
    // deploy price feed mock
    batchOracle = await MockChainlinkOracle.new({from: owner})
    // deploy Oracle module
    oracle = await MockOracle.new(addressBook.address, {from: owner})
    // calculator deployment
    calculator = await MockMarginCalculator.new()
    // margin pool deployment
    marginPool = await MarginPool.new(addressBook.address)
    // whitelist module
    whitelist = await MockWhitelistModule.new()
    // set margin pool in addressbook
    await addressBook.setMarginPool(marginPool.address)
    // set calculator in addressbook
    await addressBook.setMarginCalculator(calculator.address)
    // set oracle in AddressBook
    await addressBook.setOracle(oracle.address)
    // set whitelist module address
    await addressBook.setWhitelist(whitelist.address)
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
      assert.equal(
        await controller.isOperator(accountOwner1, accountOperator1),
        false,
        'Address is already an operator',
      )

      await controller.setOperator(accountOperator1, true, {from: accountOwner1})

      assert.equal(await controller.isOperator(accountOwner1, accountOperator1), true, 'Operator address mismatch')
    })

    it('should be able to remove operator', async () => {
      await controller.setOperator(accountOperator1, false, {from: accountOwner1})

      assert.equal(await controller.isOperator(accountOwner1, accountOperator1), false, 'Operator address mismatch')
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

  describe('Open vault', () => {
    it('should revert opening a vault an an account from random address', async () => {
      const actionArgs = [
        {
          actionType: ActionType.OpenVault,
          owner: accountOwner1,
          sender: random,
          asset: ZERO_ADDR,
          vaultId: '1',
          amount: '0',
          index: '0',
          data: ZERO_ADDR,
        },
      ]
      await expectRevert(
        controller.operate(actionArgs, {from: random}),
        'Controller: msg.sender is not authorized to run action',
      )
    })

    it('should revert opening a vault a vault with id equal to zero', async () => {
      const actionArgs = [
        {
          actionType: ActionType.OpenVault,
          owner: accountOwner1,
          sender: accountOwner1,
          asset: ZERO_ADDR,
          vaultId: '0',
          amount: '0',
          index: '0',
          data: ZERO_ADDR,
        },
      ]
      await expectRevert(
        controller.operate(actionArgs, {from: accountOwner1}),
        'Controller: can not run actions on inexistent vault',
      )
    })

    it('should open vault', async () => {
      const vaultCounterBefore = new BigNumber(await controller.getAccountVaultCounter(accountOwner1))
      assert.equal(vaultCounterBefore.toString(), '0', 'vault counter before mismatch')

      const actionArgs = [
        {
          actionType: ActionType.OpenVault,
          owner: accountOwner1,
          sender: accountOwner1,
          asset: ZERO_ADDR,
          vaultId: vaultCounterBefore.toNumber() + 1,
          amount: '0',
          index: '0',
          data: ZERO_ADDR,
        },
      ]
      await controller.operate(actionArgs, {from: accountOwner1})

      const vaultCounterAfter = new BigNumber(await controller.getAccountVaultCounter(accountOwner1))
      assert.equal(vaultCounterAfter.minus(vaultCounterBefore).toString(), '1', 'vault counter after mismatch')
    })

    it('should open vault from account operator', async () => {
      await controller.setOperator(accountOperator1, true, {from: accountOwner1})
      assert.equal(await controller.isOperator(accountOwner1, accountOperator1), true, 'Operator address mismatch')

      const vaultCounterBefore = new BigNumber(await controller.getAccountVaultCounter(accountOwner1))

      const actionArgs = [
        {
          actionType: ActionType.OpenVault,
          owner: accountOwner1,
          sender: accountOperator1,
          asset: ZERO_ADDR,
          vaultId: vaultCounterBefore.toNumber() + 1,
          amount: '0',
          index: '0',
          data: ZERO_ADDR,
        },
      ]
      await controller.operate(actionArgs, {from: accountOperator1})

      const vaultCounterAfter = new BigNumber(await controller.getAccountVaultCounter(accountOwner1))
      assert.equal(vaultCounterAfter.minus(vaultCounterBefore).toString(), '1', 'vault counter after mismatch')
    })
  })

  describe('Long otoken', () => {
    let longOtoken: MockOtokenInstance

    before(async () => {
      const expiryTime = new BigNumber(60 * 60 * 24) // after 1 day

      longOtoken = await MockOtoken.new()
      // init otoken
      await longOtoken.init(
        weth.address,
        usdc.address,
        usdc.address,
        new BigNumber(200).times(new BigNumber(10).exponentiatedBy(18)),
        new BigNumber(await time.latest()).plus(expiryTime),
        true,
      )

      await longOtoken.mint(accountOwner1, new BigNumber('100'))
      await longOtoken.mint(accountOperator1, new BigNumber('100'))
    })

    describe('deposit long otoken', () => {
      it('should revert depositing a non-whitelisted long otoken into vault', async () => {
        const vaultCounter = new BigNumber(await controller.getAccountVaultCounter(accountOwner1))
        const collateralToDeposit = new BigNumber('20')
        const actionArgs = [
          {
            actionType: ActionType.DepositLongOption,
            owner: accountOwner1,
            sender: accountOwner1,
            asset: longOtoken.address,
            vaultId: vaultCounter.toNumber(),
            amount: collateralToDeposit.toNumber(),
            index: '0',
            data: ZERO_ADDR,
          },
        ]

        await longOtoken.approve(marginPool.address, collateralToDeposit, {from: accountOwner1})
        await expectRevert(
          controller.operate(actionArgs, {from: accountOwner1}),
          'Controller: otoken is not whitelisted to be used as collateral',
        )
      })

      it('should deposit long otoken into vault from account owner', async () => {
        // whitelist otoken
        await whitelist.whitelistOtoken(longOtoken.address)

        const vaultCounter = new BigNumber(await controller.getAccountVaultCounter(accountOwner1))
        const collateralToDeposit = new BigNumber('20')
        const actionArgs = [
          {
            actionType: ActionType.DepositLongOption,
            owner: accountOwner1,
            sender: accountOwner1,
            asset: longOtoken.address,
            vaultId: vaultCounter.toNumber(),
            amount: collateralToDeposit.toNumber(),
            index: '0',
            data: ZERO_ADDR,
          },
        ]
        const marginPoolBalanceBefore = new BigNumber(await longOtoken.balanceOf(marginPool.address))
        const senderBalanceBefore = new BigNumber(await longOtoken.balanceOf(accountOwner1))

        await longOtoken.approve(marginPool.address, collateralToDeposit, {from: accountOwner1})
        await controller.operate(actionArgs, {from: accountOwner1})

        const marginPoolBalanceAfter = new BigNumber(await longOtoken.balanceOf(marginPool.address))
        const senderBalanceAfter = new BigNumber(await longOtoken.balanceOf(accountOwner1))
        const vaultAfter = await controller.getVault(accountOwner1, vaultCounter)

        assert.equal(
          marginPoolBalanceAfter.minus(marginPoolBalanceBefore).toString(),
          collateralToDeposit.toString(),
          'Margin pool balance long otoken balance mismatch',
        )
        assert.equal(
          senderBalanceBefore.minus(senderBalanceAfter).toString(),
          collateralToDeposit.toString(),
          'Sender balance long otoken balance mismatch',
        )
        assert.equal(vaultAfter.longOtokens.length, 1, 'Vault long otoken array length mismatch')
        assert.equal(vaultAfter.longOtokens[0], longOtoken.address, 'Long otoken address deposited into vault mismatch')
        assert.equal(
          new BigNumber(vaultAfter.longAmounts[0]).toString(),
          collateralToDeposit.toString(),
          'Long otoken amount deposited into vault mismatch',
        )
      })

      it('should deposit long otoken into vault from account operator', async () => {
        assert.equal(await controller.isOperator(accountOwner1, accountOperator1), true, 'Operator address mismatch')

        const vaultCounter = new BigNumber(await controller.getAccountVaultCounter(accountOwner1))
        const collateralToDeposit = new BigNumber('20')
        const actionArgs = [
          {
            actionType: ActionType.DepositLongOption,
            owner: accountOwner1,
            sender: accountOperator1,
            asset: longOtoken.address,
            vaultId: vaultCounter.toNumber(),
            amount: collateralToDeposit.toNumber(),
            index: '0',
            data: ZERO_ADDR,
          },
        ]
        const marginPoolBalanceBefore = new BigNumber(await longOtoken.balanceOf(marginPool.address))
        const senderBalanceBefore = new BigNumber(await longOtoken.balanceOf(accountOperator1))
        const vaultBefore = await controller.getVault(accountOwner1, vaultCounter)

        await longOtoken.approve(marginPool.address, collateralToDeposit, {from: accountOperator1})
        await controller.operate(actionArgs, {from: accountOperator1})

        const marginPoolBalanceAfter = new BigNumber(await longOtoken.balanceOf(marginPool.address))
        const senderBalanceAfter = new BigNumber(await longOtoken.balanceOf(accountOperator1))
        const vaultAfter = await controller.getVault(accountOwner1, vaultCounter)

        assert.equal(
          marginPoolBalanceAfter.minus(marginPoolBalanceBefore).toString(),
          collateralToDeposit.toString(),
          'Margin pool balance long otoken balance mismatch',
        )
        assert.equal(
          senderBalanceBefore.minus(senderBalanceAfter).toString(),
          collateralToDeposit.toString(),
          'Sender balance long otoken balance mismatch',
        )
        assert.equal(vaultAfter.longOtokens.length, 1, 'Vault long otoken array length mismatch')
        assert.equal(vaultAfter.longOtokens[0], longOtoken.address, 'Long otoken address deposited into vault mismatch')
        assert.equal(
          new BigNumber(vaultAfter.longAmounts[0]).minus(new BigNumber(vaultBefore.longAmounts[0])).toString(),
          collateralToDeposit.toString(),
          'Long otoken amount deposited into vault mismatch',
        )
      })

      it('should revert depositing long otoken from a sender different than arg.from', async () => {
        const vaultCounter = new BigNumber(await controller.getAccountVaultCounter(accountOwner1))
        const collateralToDeposit = new BigNumber('20')
        const actionArgs = [
          {
            actionType: ActionType.DepositLongOption,
            owner: accountOwner1,
            sender: accountOwner1,
            asset: longOtoken.address,
            vaultId: vaultCounter.toNumber(),
            amount: collateralToDeposit.toNumber(),
            index: '0',
            data: ZERO_ADDR,
          },
        ]

        await longOtoken.approve(marginPool.address, collateralToDeposit, {from: accountOperator1})
        await expectRevert(
          controller.operate(actionArgs, {from: accountOperator1}),
          'Controller: depositor address and msg.sender address mismatch',
        )
      })

      it('should revert depositing long otoken with amount equal to zero', async () => {
        const vaultCounter = new BigNumber(await controller.getAccountVaultCounter(accountOwner1))
        const collateralToDeposit = new BigNumber('20')
        const actionArgs = [
          {
            actionType: ActionType.DepositLongOption,
            owner: accountOwner1,
            sender: accountOwner1,
            asset: longOtoken.address,
            vaultId: vaultCounter.toNumber(),
            amount: '0',
            index: '0',
            data: ZERO_ADDR,
          },
        ]

        await longOtoken.approve(marginPool.address, collateralToDeposit, {from: accountOwner1})
        await expectRevert(
          controller.operate(actionArgs, {from: accountOwner1}),
          'MarginAccount: invalid long otoken amount',
        )
      })

      it('should revert depositing an expired long otoken', async () => {
        // deploy expired Otoken
        const expiredLongOtoken: MockOtokenInstance = await MockOtoken.new()
        // init otoken
        await expiredLongOtoken.init(
          weth.address,
          usdc.address,
          usdc.address,
          new BigNumber(200).times(new BigNumber(10).exponentiatedBy(18)),
          '1219926985', // 2008
          true,
        )
        await expiredLongOtoken.mint(accountOwner1, new BigNumber('100'))

        // whitelist otoken
        await whitelist.whitelistOtoken(expiredLongOtoken.address)

        const vaultCounter = new BigNumber(await controller.getAccountVaultCounter(accountOwner1))
        const collateralToDeposit = new BigNumber('20')
        const actionArgs = [
          {
            actionType: ActionType.DepositLongOption,
            owner: accountOwner1,
            sender: accountOwner1,
            asset: expiredLongOtoken.address,
            vaultId: vaultCounter.toNumber(),
            amount: collateralToDeposit.toNumber(),
            index: '0',
            data: ZERO_ADDR,
          },
        ]

        await expiredLongOtoken.approve(marginPool.address, collateralToDeposit, {from: accountOwner1})
        await expectRevert(
          controller.operate(actionArgs, {from: accountOwner1}),
          'Controller: otoken used as collateral is already expired',
        )
      })
    })
  })

  describe('Check if price is finalized', () => {
    let expiredOtoken: MockOtokenInstance

    before(async () => {
      const lockingPeriod = new BigNumber(60) // 1min
      const disputePeriod = new BigNumber(60) // 1min

      expiredOtoken = await MockOtoken.new()
      // init otoken
      await expiredOtoken.init(
        weth.address,
        usdc.address,
        usdc.address,
        new BigNumber(200).times(new BigNumber(10).exponentiatedBy(18)),
        new BigNumber(await time.latest()),
        true,
      )

      const batch = (await controller.getBatchDetails(expiredOtoken.address))[0]
      // set batch oracle
      await oracle.setBatchOracle(batch, batchOracle.address)
      // set locking and dispute period
      await oracle.setLockingPeriod(batchOracle.address, lockingPeriod)
      await oracle.setDisputePeriod(batchOracle.address, disputePeriod)
    })

    it('should return false when price is not pushed to Oracle yet', async () => {
      assert.equal(
        await controller.isPriceFinalized(expiredOtoken.address),
        false,
        'Price is not finalized because it is not stored yet',
      )
    })

    it('should return false when price is pushed and dispute period not over yet', async () => {
      //const expiryTimestampMock = new BigNumber(await time.latest())
      const priceMock = new BigNumber('200')
      const batch = (await controller.getBatchDetails(expiredOtoken.address))[0]
      const expiryTimestampMock = (await controller.getBatchDetails(expiredOtoken.address))[4]

      // increase time after locking period
      await time.increase(61)
      await oracle.setBatchUnderlyingPrice(batch, expiryTimestampMock, priceMock)

      const expectedResutl = false
      assert.equal(
        await controller.isPriceFinalized(expiredOtoken.address),
        expectedResutl,
        'Price is not finalized because dispute period is not over yet',
      )
    })

    describe('Finalized price', () => {
      it('should return true when price is finalized', async () => {
        expiredOtoken = await MockOtoken.new()
        // init otoken
        await expiredOtoken.init(
          weth.address,
          usdc.address,
          usdc.address,
          new BigNumber(200).times(new BigNumber(10).exponentiatedBy(18)),
          new BigNumber(await time.latest()),
          true,
        )

        const batch = (await controller.getBatchDetails(expiredOtoken.address))[0]
        // set batch oracle
        await oracle.setBatchOracle(batch, batchOracle.address)
        // set locking and dispute period
        await oracle.setLockingPeriod(batchOracle.address, new BigNumber(60))
        await oracle.setDisputePeriod(batchOracle.address, new BigNumber(60))

        //const expiryTimestampMock = new BigNumber(await time.latest())
        const priceMock = new BigNumber('200')
        const expiryTimestampMock = (await controller.getBatchDetails(expiredOtoken.address))[4]

        // increase time after locking period
        await time.increase(61)
        await oracle.setBatchUnderlyingPrice(batch, expiryTimestampMock, priceMock)
        // increase time after dispute period
        await time.increase(100)

        const expectedResutl = true
        assert.equal(await controller.isPriceFinalized(expiredOtoken.address), expectedResutl, 'Price is not finalized')
      })
    })
  })

  describe('Expiry', () => {
    it('should return false for non expired otoken', async () => {
      assert.equal(await controller.isExpired(otoken.address), false, 'Otoken expiry check mismatch')
    })

    it('should return true for expired otoken', async () => {
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
