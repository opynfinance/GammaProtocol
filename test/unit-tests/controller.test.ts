import { ethers, web3 } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { assert } from 'chai'

import {
  CallTester,
  MarginCalculator,
  MockOtoken,
  MockERC20,
  MockOracle,
  MockWhitelistModule,
  MarginPool,
  Controller,
  AddressBook,
  OwnedUpgradeabilityProxy,
  OtokenImplV1,
  MarginVaultTester,
  UpgradeabilityProxy,
} from '../../typechain'
//import BigNumber from 'bignumber.js'
import { createTokenAmount, createScaledNumber, getLatestTime } from '../utils'
import { ContractFactory } from 'ethers'
let provider: typeof ethers.provider

const { expectRevert, expectEvent, time } = require('@openzeppelin/test-helpers')

enum ActionType {
  OpenVault,
  MintShortOption,
  BurnShortOption,
  DepositLongOption,
  WithdrawLongOption,
  DepositCollateral,
  WithdrawCollateral,
  SettleVault,
  Redeem,
  Call,
  InvalidAction,
}

describe('Controller', function () {
  //accounts
  let owner: SignerWithAddress
  let accountOwner1: SignerWithAddress
  let accountOwner2: SignerWithAddress
  let accountOperator1: SignerWithAddress
  let holder1: SignerWithAddress
  let partialPauser: SignerWithAddress
  let fullPauser: SignerWithAddress
  let random: SignerWithAddress
  let donor: SignerWithAddress

  // ERC20 mock
  let usdc: MockERC20
  let weth: MockERC20
  let weth2: MockERC20
  // Oracle module
  let oracle: MockOracle
  // calculator module
  let calculator: MarginCalculator
  // margin pool module
  let marginPool: MarginPool
  // whitelist module mock
  let whitelist: MockWhitelistModule
  // addressbook module mock
  let addressBook: AddressBook
  // controller module
  let controllerImplementation: Controller
  let controllerProxy: Controller

  let accounts: SignerWithAddress[] = []

  //address(0)
  const ZERO_ADDR = '0x0000000000000000000000000000000000000000'

  let CallTester: ContractFactory
  let MockERC20: ContractFactory

  let OtokenImplV1: ContractFactory
  let MockCToken: ContractFactory
  let CompoundPricer: ContractFactory
  let MockOracle: ContractFactory
  let OwnedUpgradeabilityProxy: ContractFactory
  let MarginCalculator: ContractFactory
  let MockWhitelistModule: ContractFactory
  let AddressBook: ContractFactory
  let MockOtoken: ContractFactory
  let MarginPool: ContractFactory
  let Controller: ContractFactory
  let MarginVault: ContractFactory

  const BigNumber = ethers.BigNumber

  const usdcDecimals = 6
  const wethDecimals = 18

  this.beforeAll('Set up account', async () => {
    accounts = await ethers.getSigners()
    const [
      _owner,
      _accountOwner1,
      _accountOwner2,
      _accountOperator1,
      _holder1,
      _partialPauser,
      _fullPauser,
      _random,
      _donor,
    ] = accounts

    owner = _owner
    accountOwner1 = _accountOwner1
    accountOwner2 = _accountOwner2
    accountOperator1 = _accountOperator1
    holder1 = _holder1
    partialPauser = _partialPauser
    fullPauser = _fullPauser
    random = _random
    donor = _donor
  })

  this.beforeAll('Initialize Contract Factory', async () => {
    CallTester = await ethers.getContractFactory('CallTester')
    MockERC20 = await ethers.getContractFactory('MockERC20')
    OtokenImplV1 = await ethers.getContractFactory('OtokenImplV1')
    MockOtoken = await ethers.getContractFactory('MockOtoken')
    MockOracle = await ethers.getContractFactory('MockOracle', owner)
    OwnedUpgradeabilityProxy = await ethers.getContractFactory('OwnedUpgradeabilityProxy')
    MarginCalculator = await ethers.getContractFactory('MarginCalculator', owner)
    MockWhitelistModule = await ethers.getContractFactory('MockWhitelistModule', owner)
    AddressBook = await ethers.getContractFactory('AddressBook', owner)
    MarginPool = await ethers.getContractFactory('MarginPool', owner)
    //Controller = await ethers.getContractFactory('Controller')
    MarginVault = await ethers.getContractFactory('MarginVault')
  })

  this.beforeAll('Deployment to blockchain', async () => {
    // addressbook deployment
    addressBook = (await AddressBook.deploy()) as AddressBook
    addressBook = await addressBook.deployed()

    // ERC20 deployment
    usdc = (await MockERC20.deploy('USDC', 'USDC', usdcDecimals)) as MockERC20
    usdc = await usdc.deployed()

    weth = (await MockERC20.deploy('WETH', 'WETH', wethDecimals)) as MockERC20
    weth = await weth.deployed()

    weth2 = (await MockERC20.deploy('WETH', 'WETH', wethDecimals)) as MockERC20
    weth2 = await weth2.deployed()

    // deploy Oracle module
    //const oracleDeployed = await MockOracle.deploy(addressBook.address, { from: owner }) as MockOracle
    oracle = (await MockOracle.deploy()) as MockOracle
    oracle = await oracle.deployed()

    // calculator deployment
    calculator = (await MarginCalculator.deploy(oracle.address)) as MarginCalculator
    calculator = await calculator.deployed()

    // margin pool deployment
    marginPool = (await MarginPool.deploy(addressBook.address)) as MarginPool
    marginPool = await marginPool.deployed()
    // whitelist module

    whitelist = (await MockWhitelistModule.deploy()) as MockWhitelistModule
    whitelist = await whitelist.deployed()

    // set margin pool in addressbook
    await addressBook.setMarginPool(marginPool.address)
    // set calculator in addressbook
    await addressBook.setMarginCalculator(calculator.address)
    // set oracle in AddressBook
    await addressBook.setOracle(oracle.address)
    // set whitelist module address
    await addressBook.setWhitelist(whitelist.address)

    // deploy Controller module
    let lib: MarginVaultTester
    MarginVault = await ethers.getContractFactory('MarginVault')
    lib = (await MarginVault.deploy()) as MarginVaultTester
    lib = await lib.deployed()

    Controller = await ethers.getContractFactory('Controller', {
      libraries: {
        MarginVault: lib.address,
      },
    })

    controllerImplementation = (await Controller.deploy()) as Controller
    controllerImplementation = await controllerImplementation.deployed()

    // set controller address in AddressBook
    await addressBook.connect(owner).setController(controllerImplementation.address)

    // check controller deployment
    const controllerProxyAddress = await addressBook.getController()
    controllerProxy = (await ethers.getContractAt('Controller', controllerProxyAddress)) as Controller
    const proxy: OwnedUpgradeabilityProxy = (await ethers.getContractAt(
      'OwnedUpgradeabilityProxy',
      controllerProxyAddress,
    )) as OwnedUpgradeabilityProxy

    assert.equal(await proxy.proxyOwner(), addressBook.address, 'Proxy owner address mismatch')
    assert.equal(await controllerProxy.owner(), owner.address, 'Controller owner address mismatch')
    assert.equal(await controllerProxy.systemPartiallyPaused(), false, 'system is partially paused')

    // make everyone rich
    await usdc.mint(accountOwner1.address, createTokenAmount(10000, usdcDecimals))
    await usdc.mint(accountOperator1.address, createTokenAmount(10000, usdcDecimals))
    await usdc.mint(random.address, createTokenAmount(10000, usdcDecimals))
    await usdc.mint(donor.address, createTokenAmount(10000, usdcDecimals))
  })

  describe('Controller initialization', () => {
    it('should revert when calling initialize if it is already initalized', async () => {
      await expectRevert(
        controllerProxy.initialize(addressBook.address, owner.address),
        'Contract instance has already been initialized',
      )
    })

    it('should revert when calling initialize with addressbook equal to zero', async () => {
      //const controllerImplementationDeployed = await Controller.deploy();
      //const controllerImplementation = await controllerImplementationDeployed.deployed();

      await expectRevert(controllerImplementation.initialize(ZERO_ADDR, owner.address), 'C7')
    })

    it('should revert when calling initialize with owner equal to zero', async () => {
      //const controllerImplementationDeployed = await Controller.deploy();
      //const controllerImplementation = await controllerImplementationDeployed.deployed();

      await expectRevert(controllerImplementation.initialize(addressBook.address, ZERO_ADDR), 'C8')
    })
  })

  describe('Account operator', () => {
    it('should set operator', async () => {
      assert.equal(
        await controllerProxy.isOperator(accountOwner1.address, accountOperator1.address),
        false,
        'Address is already an operator',
      )

      await controllerProxy.connect(accountOwner1).setOperator(accountOperator1.address, true)

      assert.equal(
        await controllerProxy.isOperator(accountOwner1.address, accountOperator1.address),
        true,
        'Operator address mismatch',
      )
    })

    it('should revert when set an already operator', async () => {
      await expectRevert(controllerProxy.connect(accountOwner1).setOperator(accountOperator1.address, true), 'C9')
    })

    it('should be able to remove operator', async () => {
      await controllerProxy.connect(accountOwner1).setOperator(accountOperator1.address, false)

      assert.equal(
        await controllerProxy.isOperator(accountOwner1.address, accountOperator1.address),
        false,
        'Operator address mismatch',
      )
    })

    it('should revert when removing an already removed operator', async () => {
      await expectRevert(controllerProxy.connect(accountOwner1).setOperator(accountOperator1.address, false), 'C9')
    })
  })

  describe('Vault', () => {
    it('should get vault', async () => {
      const vaultId = BigNumber.from(0)
      await controllerProxy.getVault(accountOwner1.address, vaultId.toString())
    })

    it('should get vault balance', async () => {
      const vaultId = BigNumber.from(0)
      const proceed = await controllerProxy.getProceed(accountOwner1.address, vaultId.toString())
      assert.equal(proceed.toString(), '0')
    })
  })

  describe('Open vault', () => {
    it('should revert opening a vault an an account from random address', async () => {
      const actionArgs = [
        {
          actionType: ActionType.OpenVault,
          owner: accountOwner1.address,
          secondAddress: random.address,
          asset: ZERO_ADDR,
          vaultId: '1',
          amount: '0',
          index: '0',
          data: ZERO_ADDR,
        },
      ]
      await expectRevert(controllerProxy.connect(random).operate(actionArgs), 'C6')
    })

    it('should revert opening a vault a vault with id equal to zero', async () => {
      const actionArgs = [
        {
          actionType: ActionType.OpenVault,
          owner: accountOwner1.address,
          secondAddress: accountOwner1.address,
          asset: ZERO_ADDR,
          vaultId: '0',
          amount: '0',
          index: '0',
          data: ZERO_ADDR,
        },
      ]
      await expectRevert(controllerProxy.connect(accountOwner1).operate(actionArgs), 'C15')
    })

    it('should revert opening multiple vaults in the same operate call', async () => {
      const actionArgs = [
        {
          actionType: ActionType.OpenVault,
          owner: accountOwner1.address,
          secondAddress: accountOwner1.address,
          asset: ZERO_ADDR,
          vaultId: '1',
          amount: '0',
          index: '0',
          data: ZERO_ADDR,
        },
        {
          actionType: ActionType.OpenVault,
          owner: accountOwner1.address,
          secondAddress: accountOwner1.address,
          asset: ZERO_ADDR,
          vaultId: '2',
          amount: '0',
          index: '0',
          data: ZERO_ADDR,
        },
      ]

      await expectRevert(controllerProxy.connect(accountOwner1).operate(actionArgs), 'C13')
    })

    it('should revert opening a vault with vault type other than 0 or 1', async () => {
      const invalidVault = web3.eth.abi.encodeParameter('uint256', 2)

      const actionArgs = [
        {
          actionType: ActionType.OpenVault,
          owner: accountOwner1.address,
          secondAddress: accountOwner1.address,
          asset: ZERO_ADDR,
          vaultId: '1',
          amount: '0',
          index: '0',
          data: invalidVault,
        },
      ]

      await expectRevert(controllerProxy.connect(accountOwner1).operate(actionArgs), 'A3')
    })

    it('should revert opening multiple vaults for different owners in the same operate call', async () => {
      await controllerProxy.connect(accountOwner2).setOperator(accountOwner1.address, true)
      const actionArgs = [
        {
          actionType: ActionType.OpenVault,
          owner: accountOwner1.address,
          secondAddress: accountOwner1.address,
          asset: ZERO_ADDR,
          vaultId: '0',
          amount: '0',
          index: '0',
          data: ZERO_ADDR,
        },
        {
          actionType: ActionType.OpenVault,
          owner: accountOwner2.address,
          secondAddress: accountOwner1.address,
          asset: ZERO_ADDR,
          vaultId: '1',
          amount: '0',
          index: '0',
          data: ZERO_ADDR,
        },
      ]

      await expectRevert(controllerProxy.connect(accountOwner1).operate(actionArgs), 'C12')
    })

    it('should open vault', async () => {
      const vaultCounterBefore = BigNumber.from(await controllerProxy.getAccountVaultCounter(accountOwner1.address))
      assert.equal(vaultCounterBefore.toString(), '0', 'vault counter before mismatch')

      const actionArgs = [
        {
          actionType: ActionType.OpenVault,
          owner: accountOwner1.address,
          secondAddress: accountOwner1.address,
          asset: ZERO_ADDR,
          vaultId: vaultCounterBefore.toNumber() + 1,
          amount: '0',
          index: '0',
          data: ZERO_ADDR,
        },
      ]
      await controllerProxy.connect(accountOwner1).operate(actionArgs)

      const vaultCounterAfter = ethers.BigNumber.from(
        await controllerProxy.getAccountVaultCounter(accountOwner1.address),
      )

      console.log("answer ", (vaultCounterAfter.sub(vaultCounterBefore)).toString())
      assert.equal((vaultCounterAfter.sub(vaultCounterBefore)).toString(), '1', 'vault counter after mismatch')
    })

    it('should open vault from account operator', async () => {
      await controllerProxy.connect(accountOwner1).setOperator(accountOperator1.address, true)
      assert.equal(
        await controllerProxy.isOperator(accountOwner1.address, accountOperator1.address),
        true,
        'Operator address mismatch',
      )

      const vaultCounterBefore = ethers.BigNumber.from(
        await controllerProxy.getAccountVaultCounter(accountOwner1.address),
      )

      const actionArgs = [
        {
          actionType: ActionType.OpenVault,
          owner: accountOwner1.address,
          secondAddress: accountOperator1.address,
          asset: ZERO_ADDR,
          vaultId: vaultCounterBefore.toNumber() + 1,
          amount: '0',
          index: '0',
          data: ZERO_ADDR,
        },
      ]
      await controllerProxy.connect(accountOperator1).operate(actionArgs)

      const vaultCounterAfter = ethers.BigNumber.from(
        (await controllerProxy.getAccountVaultCounter(accountOwner1.address)).toString(),
      )
      assert.equal(vaultCounterAfter.sub(vaultCounterBefore).toString(), '1', 'vault counter after mismatch')
    })
  })

  describe('Long otoken', () => {
    let longOtoken: MockOtoken

    this.beforeAll('Before all long otokens', async () => {
      const expiryTime = ethers.BigNumber.from(60 * 60 * 24) // after 1 day

      const longOtokenDeployed = (await MockOtoken.deploy()) as MockOtoken
      longOtoken = await longOtokenDeployed.deployed()

      console.log('value', ethers.BigNumber.from((await getLatestTime()).toString()).add(expiryTime.toString()))

      const t = await getLatestTime()
      // init otoken
      await longOtoken.init(
        addressBook.address,
        weth.address,
        usdc.address,
        usdc.address,
        createTokenAmount(200),
        ethers.BigNumber.from(await getLatestTime()).add(expiryTime),
        true,
      )

      await longOtoken.mintOtoken(accountOwner1.address, createTokenAmount(100))
      await longOtoken.mintOtoken(accountOperator1.address, createTokenAmount(100))
    })

    describe('deposit long otoken', () => {
      it('should revert depositing a non-whitelisted long otoken into vault', async () => {
        const vaultCounter = BigNumber.from(await controllerProxy.getAccountVaultCounter(accountOwner1.address))
        const longToDeposit = createTokenAmount(20)
        const actionArgs = [
          {
            actionType: ActionType.DepositLongOption,
            owner: accountOwner1.address,
            secondAddress: accountOwner1.address,
            asset: longOtoken.address,
            vaultId: vaultCounter.toNumber(),
            amount: longToDeposit,
            index: '0',
            data: ZERO_ADDR,
          },
        ]

        await longOtoken.connect(accountOwner1).approve(marginPool.address, longToDeposit)
        await expectRevert(controllerProxy.connect(accountOwner1).operate(actionArgs), 'C17')
      })

      it('should revert depositing long with invalid vault id', async () => {
        // whitelist otoken
        await whitelist.connect(owner).whitelistOtoken(longOtoken.address)

        const vaultCounter = BigNumber.from('100')

        const longToDeposit = createTokenAmount(20)
        const actionArgs = [
          {
            actionType: ActionType.DepositLongOption,
            owner: accountOwner1.address,
            secondAddress: accountOwner1.address,
            asset: longOtoken.address,
            vaultId: vaultCounter.toNumber(),
            amount: longToDeposit,
            index: '0',
            data: ZERO_ADDR,
          },
        ]

        await longOtoken.connect(accountOwner1).approve(marginPool.address, longToDeposit)
        await expectRevert(controllerProxy.connect(accountOwner1).operate(actionArgs), 'C35')
      })

      it('should revert depositing long from an address that is not the msg.sender nor the owner account address', async () => {
        const vaultCounter = BigNumber.from(await controllerProxy.getAccountVaultCounter(accountOwner1.address))

        const longToDeposit = createTokenAmount(20)
        const actionArgs = [
          {
            actionType: ActionType.DepositLongOption,
            owner: accountOwner1.address,
            secondAddress: random.address,
            asset: longOtoken.address,
            vaultId: vaultCounter.toNumber(),
            amount: longToDeposit,
            index: '0',
            data: ZERO_ADDR,
          },
        ]

        await longOtoken.connect(random).approve(marginPool.address, longToDeposit)
        await longOtoken.connect(accountOperator1).approve(marginPool.address, longToDeposit)
        await expectRevert(controllerProxy.connect(accountOperator1).operate(actionArgs), 'C16')
      })

      it('should deposit long otoken into vault from account owner', async () => {
        const vaultCounter = BigNumber.from(await controllerProxy.getAccountVaultCounter(accountOwner1.address))
        const longToDeposit = BigNumber.from(createTokenAmount(20))
        const actionArgs = [
          {
            actionType: ActionType.DepositLongOption,
            owner: accountOwner1.address,
            secondAddress: accountOwner1.address,
            asset: longOtoken.address,
            vaultId: vaultCounter.toNumber(),
            amount: longToDeposit.toNumber(),
            index: '0',
            data: ZERO_ADDR,
          },
        ]
        const marginPoolBalanceBefore = BigNumber.from(await longOtoken.balanceOf(marginPool.address))
        const senderBalanceBefore = BigNumber.from(await longOtoken.balanceOf(accountOwner1.address))

        await longOtoken.connect(accountOwner1).approve(marginPool.address, longToDeposit.toNumber())
        await controllerProxy.connect(accountOwner1).operate(actionArgs)

        const marginPoolBalanceAfter = BigNumber.from(await longOtoken.balanceOf(marginPool.address))
        const senderBalanceAfter = BigNumber.from(await longOtoken.balanceOf(accountOwner1.address))
        const vaultAfter = await controllerProxy.getVault(accountOwner1.address, vaultCounter)

        assert.equal(
          (marginPoolBalanceAfter.sub(marginPoolBalanceBefore)).toString(),
          longToDeposit.toString(),
          'Margin pool balance long otoken balance mismatch',
        )
        assert.equal(
          (senderBalanceBefore.sub(senderBalanceAfter)).toString(),
          longToDeposit.toString(),
          'Sender balance long otoken balance mismatch',
        )
        assert.equal(vaultAfter.longOtokens.length, 1, 'Vault long otoken array length mismatch')
        assert.equal(vaultAfter.longOtokens[0], longOtoken.address, 'Long otoken address deposited into vault mismatch')
        assert.equal(
          BigNumber.from(vaultAfter.longAmounts[0]).toString(),
          BigNumber.from(longToDeposit).toString(),
          'Long otoken amount deposited into vault mismatch',
        )
      })

      it('should deposit long otoken into vault from account operator', async () => {
        assert.equal(
          await controllerProxy.isOperator(accountOwner1.address, accountOperator1.address),
          true,
          'Operator address mismatch',
        )

        const vaultCounter = ethers.BigNumber.from(await controllerProxy.getAccountVaultCounter(accountOwner1.address))
        const longToDeposit = createTokenAmount(20)
        const actionArgs = [
          {
            actionType: ActionType.DepositLongOption,
            owner: accountOwner1.address,
            secondAddress: accountOperator1.address,
            asset: longOtoken.address,
            vaultId: vaultCounter.toNumber(),
            amount: longToDeposit,
            index: '0',
            data: ZERO_ADDR,
          },
        ]
        const marginPoolBalanceBefore = ethers.BigNumber.from(await longOtoken.balanceOf(marginPool.address))
        const senderBalanceBefore = ethers.BigNumber.from(await longOtoken.balanceOf(accountOperator1.address))
        const vaultBefore = await controllerProxy.getVault(accountOwner1.address, vaultCounter)

        await longOtoken.connect(accountOperator1).approve(marginPool.address, longToDeposit)
        await controllerProxy.connect(accountOperator1).operate(actionArgs)

        const marginPoolBalanceAfter = ethers.BigNumber.from(await longOtoken.balanceOf(marginPool.address))
        const senderBalanceAfter = ethers.BigNumber.from(await longOtoken.balanceOf(accountOperator1.address))
        const vaultAfter = await controllerProxy.getVault(accountOwner1.address, vaultCounter)

        assert.equal(
          marginPoolBalanceAfter.sub(marginPoolBalanceBefore).toString(),
          longToDeposit.toString(),
          'Margin pool balance long otoken balance mismatch',
        )
        assert.equal(
          senderBalanceBefore.sub(senderBalanceAfter).toString(),
          longToDeposit.toString(),
          'Sender balance long otoken balance mismatch',
        )
        assert.equal(vaultAfter.longOtokens.length, 1, 'Vault long otoken array length mismatch')
        assert.equal(vaultAfter.longOtokens[0], longOtoken.address, 'Long otoken address deposited into vault mismatch')
        assert.equal(
          ethers.BigNumber.from(vaultAfter.longAmounts[0]).sub(BigNumber.from(vaultBefore.longAmounts[0])).toString(),
          longToDeposit.toString(),
          'Long otoken amount deposited into vault mismatch',
        )
      })

      it('should execute depositing long otoken into vault in multiple actions', async () => {
        const vaultCounter = BigNumber.from(await controllerProxy.getAccountVaultCounter(accountOwner1.address))
        const longToDeposit = BigNumber.from(createTokenAmount(20))
        const actionArgs = [
          {
            actionType: ActionType.DepositLongOption,
            owner: accountOwner1.address,
            secondAddress: accountOwner1.address,
            asset: longOtoken.address,
            vaultId: vaultCounter.toNumber(),
            amount: longToDeposit.toNumber(),
            index: '0',
            data: ZERO_ADDR,
          },
          {
            actionType: ActionType.DepositLongOption,
            owner: accountOwner1.address,
            secondAddress: accountOwner1.address,
            asset: longOtoken.address,
            vaultId: vaultCounter.toNumber(),
            amount: longToDeposit.toNumber(),
            index: '0',
            data: ZERO_ADDR,
          },
        ]
        const marginPoolBalanceBefore = BigNumber.from(await longOtoken.balanceOf(marginPool.address))
        const senderBalanceBefore = BigNumber.from(await longOtoken.balanceOf(accountOwner1.address))
        const vaultBefore = await controllerProxy.getVault(accountOwner1.address, vaultCounter)

        await longOtoken.connect(accountOwner1).approve(marginPool.address, longToDeposit.mul(2))
        await controllerProxy.connect(accountOwner1).operate(actionArgs)

        const marginPoolBalanceAfter = BigNumber.from(await longOtoken.balanceOf(marginPool.address))
        const senderBalanceAfter = BigNumber.from(await longOtoken.balanceOf(accountOwner1.address))
        const vaultAfter = await controllerProxy.getVault(accountOwner1.address, vaultCounter)

        assert.equal(
          (marginPoolBalanceAfter.sub(marginPoolBalanceBefore)).toString(),
          (longToDeposit.mul(2)).toString(),
          'Margin pool balance long otoken balance mismatch',
        )
        assert.equal(
          (senderBalanceBefore.sub(senderBalanceAfter)).toString(),
          (longToDeposit.mul(2)).toString(),
          'Sender balance long otoken balance mismatch',
        )
        assert.equal(vaultAfter.longOtokens.length, 1, 'Vault long otoken array length mismatch')
        assert.equal(vaultAfter.longOtokens[0], longOtoken.address, 'Long otoken address deposited into vault mismatch')
        assert.equal(
          ((vaultAfter.longAmounts[0])
            .sub(vaultBefore.longAmounts[0])).toString(),
          (longToDeposit.mul(2)).toString(),
          'Long otoken amount deposited into vault mismatch',
        )
      })

      it('should revert depositing long otoken with amount equal to zero', async () => {
        const vaultCounter = ethers.BigNumber.from(await controllerProxy.getAccountVaultCounter(accountOwner1.address))
        const longToDeposit = createTokenAmount(20)
        const actionArgs = [
          {
            actionType: ActionType.DepositLongOption,
            owner: accountOwner1.address,
            secondAddress: accountOwner1.address,
            asset: longOtoken.address,
            vaultId: vaultCounter.toNumber(),
            amount: '0',
            index: '0',
            data: ZERO_ADDR,
          },
        ]

        await longOtoken.connect(accountOwner1).approve(marginPool.address, longToDeposit)
        await expectRevert(controllerProxy.connect(accountOwner1).operate(actionArgs), 'V4')
      })

      it('should revert depositing an expired long otoken', async () => {
        // deploy expired Otoken
        const expiredLongOtokenDeployed: MockOtoken = (await MockOtoken.deploy()) as MockOtoken
        const expiredLongOtoken = await expiredLongOtokenDeployed.deployed()

        // init otoken
        await expiredLongOtoken.init(
          addressBook.address,
          weth.address,
          usdc.address,
          usdc.address,
          createTokenAmount(200),
          '1219926985', // 2008
          true,
        )
        await expiredLongOtoken.mintOtoken(accountOwner1.address, ethers.BigNumber.from('100'))

        // whitelist otoken
        await whitelist.connect(owner).whitelistOtoken(expiredLongOtoken.address)

        const vaultCounter = BigNumber.from(await controllerProxy.getAccountVaultCounter(accountOwner1.address))
        const longToDeposit = createTokenAmount(20)
        const actionArgs = [
          {
            actionType: ActionType.DepositLongOption,
            owner: accountOwner1.address,
            secondAddress: accountOwner1.address,
            asset: expiredLongOtoken.address,
            vaultId: vaultCounter.toNumber(),
            amount: longToDeposit,
            index: '0',
            data: ZERO_ADDR,
          },
        ]

        await expiredLongOtoken.connect(accountOwner1).approve(marginPool.address, longToDeposit)
        await expectRevert(controllerProxy.connect(accountOwner1).operate(actionArgs), 'C18')
      })

      it('should revert when vault have more than 1 long otoken', async () => {
        const expiryTime = ethers.BigNumber.from(60 * 60) // after 1 hour
        const longToDeposit = createTokenAmount(20)
        // deploy second Otoken
        const secondLongOtokenDeployed: MockOtoken = (await MockOtoken.deploy()) as MockOtoken
        const secondLongOtoken = await secondLongOtokenDeployed.deployed()
        // init otoken
        await secondLongOtoken.init(
          addressBook.address,
          weth.address,
          usdc.address,
          usdc.address,
          createTokenAmount(200),
          ethers.BigNumber.from(await getLatestTime())
            .add(expiryTime)
            .toString(),
          true,
        )
        await secondLongOtoken.mintOtoken(accountOwner1.address, longToDeposit)
        // whitelist otoken
        await whitelist.connect(owner).whitelistOtoken(secondLongOtoken.address)
        const vaultCounter = ethers.BigNumber.from(await controllerProxy.getAccountVaultCounter(accountOwner1.address))
        const actionArgs = [
          {
            actionType: ActionType.DepositLongOption,
            owner: accountOwner1.address,
            secondAddress: accountOwner1.address,
            asset: secondLongOtoken.address,
            vaultId: vaultCounter.toNumber(),
            amount: longToDeposit,
            index: '1',
            data: ZERO_ADDR,
          },
        ]

        await secondLongOtoken.connect(accountOwner1).approve(marginPool.address, longToDeposit)
        await expectRevert(
          controllerProxy.connect(accountOwner1).operate(actionArgs),
          'MarginCalculator: Too many long otokens in the vault',
        )
      })

      it('should revert deposting long from controller implementation contract instead of the controller proxy', async () => {
        await controllerImplementation.initialize(addressBook.address, owner.address)
        const longToDeposit = createTokenAmount(20)
        const actionArgs = [
          {
            actionType: ActionType.OpenVault,
            owner: accountOwner1.address,
            secondAddress: random.address,
            asset: ZERO_ADDR,
            vaultId: '1',
            amount: '0',
            index: '0',
            data: ZERO_ADDR,
          },
          {
            actionType: ActionType.DepositLongOption,
            owner: accountOwner1.address,
            secondAddress: accountOwner1.address,
            asset: longOtoken.address,
            vaultId: 1,
            amount: longToDeposit,
            index: '0',
            data: ZERO_ADDR,
          },
        ]

        await longOtoken.connect(accountOwner1).approve(marginPool.address, longToDeposit)
        await expectRevert(
          controllerImplementation.connect(accountOwner1).operate(actionArgs),
          'MarginPool: Sender is not Controller',
        )
      })
    })

    describe('withdraw long otoken', () => {
      it('should revert withdrawing long otoken with wrong index from a vault', async () => {
        const vaultCounter = ethers.BigNumber.from(await controllerProxy.getAccountVaultCounter(accountOwner1.address))
        assert.isAbove(vaultCounter.toNumber(), 0, 'Account owner have no vault')

        const longToWithdraw = createTokenAmount(20)
        const actionArgs = [
          {
            actionType: ActionType.WithdrawLongOption,
            owner: accountOwner1.address,
            secondAddress: accountOwner1.address,
            asset: longOtoken.address,
            vaultId: vaultCounter.toNumber(),
            amount: longToWithdraw.toString(),
            index: '1',
            data: ZERO_ADDR,
          },
        ]

        await expectRevert(controllerProxy.connect(accountOwner1).operate(actionArgs), 'V5')
      })

      it('should revert withdrawing long otoken from random address other than account owner or operator', async () => {
        const vaultCounter = ethers.BigNumber.from(await controllerProxy.getAccountVaultCounter(accountOwner1.address))
        assert.isAbove(vaultCounter.toNumber(), 0, 'Account owner have no vault')

        const longToWithdraw = createTokenAmount(20)
        const actionArgs = [
          {
            actionType: ActionType.WithdrawLongOption,
            owner: accountOwner1.address,
            secondAddress: accountOwner1.address,
            asset: longOtoken.address,
            vaultId: vaultCounter.toNumber(),
            amount: longToWithdraw,
            index: '0',
            data: ZERO_ADDR,
          },
        ]

        await expectRevert(controllerProxy.connect(random).operate(actionArgs), 'C6')
      })

      it('should revert withdrawing long otoken amount greater than the vault balance', async () => {
        const vaultCounter = ethers.BigNumber.from(await controllerProxy.getAccountVaultCounter(accountOwner1.address))
        assert.isAbove(vaultCounter.toNumber(), 0, 'Account owner have no vault')

        const vaultBefore = await controllerProxy.getVault(accountOwner1.address, vaultCounter)
        const longToWithdraw = ethers.BigNumber.from(vaultBefore.longAmounts[0]).add(1).toString()
        const actionArgs = [
          {
            actionType: ActionType.WithdrawLongOption,
            owner: accountOwner1.address,
            secondAddress: accountOwner1.address,
            asset: longOtoken.address,
            vaultId: vaultCounter.toNumber(),
            amount: longToWithdraw.toString(),
            index: '0',
            data: ZERO_ADDR,
          },
        ]

        await expectRevert(controllerProxy.connect(accountOwner1).operate(actionArgs), 'SafeMath: subtraction overflow')
      })

      it('should revert withdrawing long with invalid vault id', async () => {
        const vaultCounter = ethers.BigNumber.from('100')

        const longToWithdraw = createTokenAmount(10)
        const actionArgs = [
          {
            actionType: ActionType.WithdrawLongOption,
            owner: accountOwner1.address,
            secondAddress: accountOwner1.address,
            asset: longOtoken.address,
            vaultId: vaultCounter.toNumber(),
            amount: longToWithdraw,
            index: '0',
            data: ZERO_ADDR,
          },
        ]

        await expectRevert(controllerProxy.connect(accountOwner1).operate(actionArgs), 'C35')
      })

      it('should withdraw long otoken to any random address where msg.sender is account owner', async () => {
        const vaultCounter = BigNumber.from(await controllerProxy.getAccountVaultCounter(accountOwner1.address))
        assert.isAbove(vaultCounter.toNumber(), 0, 'Account owner have no vault')

        const longToWithdraw = BigNumber.from(createTokenAmount(10))
        const actionArgs = [
          {
            actionType: ActionType.WithdrawLongOption,
            owner: accountOwner1.address,
            secondAddress: random.address,
            asset: longOtoken.address,
            vaultId: vaultCounter.toNumber(),
            amount: longToWithdraw.toNumber(),
            index: '0',
            data: ZERO_ADDR,
          },
        ]
        const marginPoolBalanceBefore = BigNumber.from(await longOtoken.balanceOf(marginPool.address))
        const receiverBalanceBefore = BigNumber.from(await longOtoken.balanceOf(random.address))
        const vaultBefore = await controllerProxy.getVault(accountOwner1.address, vaultCounter)

        await controllerProxy.connect(accountOwner1).operate(actionArgs)

        const marginPoolBalanceAfter = BigNumber.from(await longOtoken.balanceOf(marginPool.address))
        const receiverBalanceAfter = BigNumber.from(await longOtoken.balanceOf(random.address))
        const vaultAfter = await controllerProxy.getVault(accountOwner1.address, vaultCounter)

        assert.equal(
          (marginPoolBalanceBefore.sub(marginPoolBalanceAfter)).toString(),
          longToWithdraw.toString(),
          'Margin pool balance long otoken balance mismatch',
        )
        assert.equal(
          (receiverBalanceAfter.sub(receiverBalanceBefore)).toString(),
          longToWithdraw.toString(),
          'Receiver long otoken balance mismatch',
        )
        assert.equal(vaultAfter.longOtokens.length, 1, 'Vault long otoken array length mismatch')



        assert.equal(

          ((BigNumber.from(vaultBefore.longAmounts[0]))
            .sub(BigNumber.from(vaultAfter.longAmounts[0])))
            .toString(),

          longToWithdraw.toString(),
          'Long otoken amount in vault after withdraw mismatch',
        )
      })

      it('should withdraw long otoken to any random address where msg.sender is account operator', async () => {
        assert.equal(
          await controllerProxy.isOperator(accountOwner1.address, accountOperator1.address),
          true,
          'Operator address mismatch',
        )

        const vaultCounter = BigNumber.from(await controllerProxy.getAccountVaultCounter(accountOwner1.address))
        assert.isAbove(vaultCounter.toNumber(), 0, 'Account owner have no vault')

        const longToWithdraw = BigNumber.from(createTokenAmount(10))
        const actionArgs = [
          {
            actionType: ActionType.WithdrawLongOption,
            owner: accountOwner1.address,
            secondAddress: random.address,
            asset: longOtoken.address,
            vaultId: vaultCounter.toNumber(),
            amount: longToWithdraw.toNumber(),
            index: '0',
            data: ZERO_ADDR,
          },
        ]
        const marginPoolBalanceBefore = BigNumber.from(await longOtoken.balanceOf(marginPool.address))
        const receiverBalanceBefore = BigNumber.from(await longOtoken.balanceOf(random.address))
        const vaultBefore = await controllerProxy.getVault(accountOwner1.address, vaultCounter)

        await controllerProxy.connect(accountOperator1).operate(actionArgs)

        const marginPoolBalanceAfter = BigNumber.from(await longOtoken.balanceOf(marginPool.address))
        const receiverBalanceAfter = BigNumber.from(await longOtoken.balanceOf(random.address))
        const vaultAfter = await controllerProxy.getVault(accountOwner1.address, vaultCounter)

        assert.equal(
          (marginPoolBalanceBefore.sub(marginPoolBalanceAfter)).toString(),
          longToWithdraw.toString(),
          'Margin pool balance long otoken balance mismatch',
        )
        assert.equal(
          (receiverBalanceAfter.sub(receiverBalanceBefore)).toString(),
          longToWithdraw.toString(),
          'Receiver long otoken balance mismatch',
        )
        assert.equal(vaultAfter.longOtokens.length, 1, 'Vault long otoken array length mismatch')
        assert.equal((vaultBefore.longAmounts[0]
            .sub((vaultAfter.longAmounts[0]))).toString(),
          longToWithdraw.toString(),
          'Long otoken amount in vault after withdraw mismatch',
        )
      })

      it('should execute withdrawing long otoken in mutliple actions', async () => {
        const vaultCounter = ethers.BigNumber.from(await controllerProxy.getAccountVaultCounter(accountOwner1.address))
        assert.isAbove(vaultCounter.toNumber(), 0, 'Account owner have no vault')

        const longToWithdraw = ethers.BigNumber.from(createTokenAmount(10))
        const actionArgs = [
          {
            actionType: ActionType.WithdrawLongOption,
            owner: accountOwner1.address,
            secondAddress: accountOwner1.address,
            asset: longOtoken.address,
            vaultId: vaultCounter.toNumber(),
            amount: longToWithdraw.toString(),
            index: '0',
            data: ZERO_ADDR,
          },
          {
            actionType: ActionType.WithdrawLongOption,
            owner: accountOwner1.address,
            secondAddress: accountOwner1.address,
            asset: longOtoken.address,
            vaultId: vaultCounter.toNumber(),
            amount: longToWithdraw.toString(),
            index: '0',
            data: ZERO_ADDR,
          },
        ]
        const marginPoolBalanceBefore = ethers.BigNumber.from(await longOtoken.balanceOf(marginPool.address))
        const receiverBalanceBefore = ethers.BigNumber.from(await longOtoken.balanceOf(accountOwner1.address))
        const vaultBefore = await controllerProxy.getVault(accountOwner1.address, vaultCounter)

        await controllerProxy.connect(accountOwner1).operate(actionArgs)

        const marginPoolBalanceAfter = ethers.BigNumber.from(await longOtoken.balanceOf(marginPool.address))
        const receiverBalanceAfter = ethers.BigNumber.from(await longOtoken.balanceOf(accountOwner1.address))
        const vaultAfter = await controllerProxy.getVault(accountOwner1.address, vaultCounter.toString())

        assert.equal(
          marginPoolBalanceBefore.sub(marginPoolBalanceAfter).toString(),
          longToWithdraw.mul(2).toString(),
          'Margin pool balance long otoken balance mismatch',
        )
        assert.equal(
          receiverBalanceAfter.sub(receiverBalanceBefore).toString(),
          longToWithdraw.mul(2).toString(),
          'Receiver long otoken balance mismatch',
        )
        assert.equal(vaultAfter.longOtokens.length, 1, 'Vault long otoken array length mismatch')
        assert.equal(
          ethers.BigNumber.from(vaultBefore.longAmounts[0])
            .sub(ethers.BigNumber.from(vaultAfter.longAmounts[0]))
            .toString(),
          longToWithdraw.mul(2).toString(),
          'Long otoken amount in vault after withdraw mismatch',
        )
      })

      it('should remove otoken address from otoken array if amount is equal to zero after withdrawing', async () => {
        const vaultCounter = ethers.BigNumber.from(await controllerProxy.getAccountVaultCounter(accountOwner1.address))
        assert.isAbove(vaultCounter.toNumber(), 0, 'Account owner have no vault')

        const vaultBefore = await controllerProxy.getVault(accountOwner1.address, vaultCounter)

        const longToWithdraw = ethers.BigNumber.from(vaultBefore.longAmounts[0])
        const actionArgs = [
          {
            actionType: ActionType.WithdrawLongOption,
            owner: accountOwner1.address,
            secondAddress: accountOwner1.address,
            asset: longOtoken.address,
            vaultId: vaultCounter.toNumber(),
            amount: longToWithdraw.toString(),
            index: '0',
            data: ZERO_ADDR,
          },
        ]
        const marginPoolBalanceBefore = ethers.BigNumber.from(await longOtoken.balanceOf(marginPool.address))
        const receiverBalanceBefore = ethers.BigNumber.from(await longOtoken.balanceOf(accountOwner1.address))

        await controllerProxy.connect(accountOwner1).operate(actionArgs)

        const marginPoolBalanceAfter = ethers.BigNumber.from(await longOtoken.balanceOf(marginPool.address))
        const receiverBalanceAfter = ethers.BigNumber.from(await longOtoken.balanceOf(accountOwner1.address))
        const vaultAfter = await controllerProxy.getVault(accountOwner1.address, vaultCounter)

        assert.equal(
          marginPoolBalanceBefore.sub(marginPoolBalanceAfter).toString(),
          longToWithdraw.toString(),
          'Margin pool balance long otoken balance mismatch',
        )
        assert.equal(
          receiverBalanceAfter.sub(receiverBalanceBefore).toString(),
          longToWithdraw.toString(),
          'Receiver long otoken balance mismatch',
        )
        assert.equal(vaultAfter.longOtokens.length, 1, 'Vault long otoken array length mismatch')
        assert.equal(vaultAfter.longOtokens[0], ZERO_ADDR, 'Vault long otoken address after clearing mismatch')
        assert.equal(
          ethers.BigNumber.from(vaultBefore.longAmounts[0])
            .sub(ethers.BigNumber.from(vaultAfter.longAmounts[0]))
            .toString(),
          longToWithdraw.toString(),
          'Long otoken amount in vault after withdraw mismatch',
        )
      })

      describe('withdraw expired long otoken', () => {
        let expiredLongOtoken: MockOtoken

        this.beforeAll('withdraw otokens beforeall hook', async () => {
          const expiryTime = BigNumber.from(60 * 60) // after 1 hour
          const expiredLongOtokenDeployed = (await MockOtoken.deploy()) as MockOtoken
          expiredLongOtoken = await expiredLongOtokenDeployed.deployed()
          // init otoken
          await expiredLongOtoken.init(
            addressBook.address,
            weth.address,
            usdc.address,
            usdc.address,
            BigNumber.from(createTokenAmount(200)).toNumber(),
            (BigNumber.from(await getLatestTime()).add(expiryTime)).toNumber(),
            true,
          )
          // some free money for the account owner
          const longToDeposit = BigNumber.from(createTokenAmount(100)).toNumber()
          await expiredLongOtoken.mintOtoken(accountOwner1.address, longToDeposit)
          // whitelist otoken
          await whitelist.connect(owner).whitelistOtoken(expiredLongOtoken.address)
          // deposit long otoken into vault
          const vaultId = BigNumber.from('1')
          const actionArgs = [
            //added the open vault action
            {
              actionType: ActionType.OpenVault,
              owner: accountOwner1.address,
              secondAddress: accountOwner1.address,
              asset: ZERO_ADDR,
              vaultId: vaultId,
              amount: '0',
              index: '0',
              data: ZERO_ADDR,
            },
            {
              actionType: ActionType.DepositLongOption,
              owner: accountOwner1.address,
              secondAddress: accountOwner1.address,
              asset: expiredLongOtoken.address,
              vaultId: vaultId.toNumber(),
              amount: longToDeposit,
              index: '0',
              data: ZERO_ADDR,
            },
          ]
          await expiredLongOtoken.connect(accountOwner1).approve(marginPool.address, longToDeposit)
          
          await controllerProxy.connect(accountOwner1).operate(actionArgs)
          const vaultAfter = await controllerProxy.getVault(accountOwner1.address, vaultId)
          assert.equal(vaultAfter.longOtokens.length, 1, 'Vault long otoken array length mismatch')
          assert.equal(
            vaultAfter.longOtokens[0],
            expiredLongOtoken.address,
            'Long otoken address deposited into vault mismatch',
          )
          assert.equal(
            vaultAfter.longAmounts[0].toString(),
            longToDeposit.toString(),
            'Long otoken amount deposited into vault mismatch',
          )
        })

        it('should revert withdrawing an expired long otoken', async () => {
          // increment time after expiredLongOtoken expiry
          // increase time with one hour in seconds
          await ethers.provider.send('evm_increaseTime', [3601])
          await ethers.provider.send('evm_mine', []);
          const vaultId = BigNumber.from('1')
          const vault = await controllerProxy.getVault(accountOwner1.address, vaultId.toNumber())
          const longToWithdraw = vault.longAmounts[0]
          const actionArgs = [
            {
              actionType: ActionType.WithdrawLongOption,
              owner: accountOwner1.address,
              secondAddress: accountOwner1.address,
              asset: expiredLongOtoken.address,
              vaultId: vaultId.toNumber(),
              amount: longToWithdraw.toString(),
              index: '0',
              data: ZERO_ADDR,
            },
          ]

          assert.equal(
            await controllerProxy.hasExpired(expiredLongOtoken.address),
            true,
            'Long otoken is not expired yet',
          )

          await expectRevert(controllerProxy.connect(accountOwner1).operate(actionArgs), 'C19')
        })
      })
    })
  })

  describe('Collateral asset', () => {
    describe('Deposit collateral asset', () => {
      it('should deposit a whitelisted collateral asset from account owner', async () => {
       
        const vaultCounter = BigNumber.from(await controllerProxy.getAccountVaultCounter(accountOwner1.address))
        assert.isAbove(vaultCounter.toNumber(), 0, 'Account owner have no vault')

        const collateralToDeposit = BigNumber.from(createTokenAmount(10, usdcDecimals))
        const actionArgs = [
          {
            actionType: ActionType.DepositCollateral,
            owner: accountOwner1.address,
            secondAddress: accountOwner1.address,
            asset: usdc.address,
            vaultId: vaultCounter.toNumber(),
            amount: collateralToDeposit.toNumber(),
            index: '0',
            data: ZERO_ADDR,
          },
        ]

        const marginPoolBalanceBefore = BigNumber.from(await usdc.balanceOf(marginPool.address))
        const senderBalanceBefore =   BigNumber.from(await usdc.balanceOf(accountOwner1.address))

        await usdc.connect(accountOwner1).approve(marginPool.address, collateralToDeposit)
        await controllerProxy.connect(accountOwner1).operate(actionArgs)

        const marginPoolBalanceAfter = BigNumber.from(await usdc.balanceOf(marginPool.address))
        const senderBalanceAfter = BigNumber.from(await usdc.balanceOf(accountOwner1.address))
        const vaultAfter = await controllerProxy.getVault(accountOwner1.address, vaultCounter)

        assert.equal(
          (marginPoolBalanceAfter.sub(marginPoolBalanceBefore)).toString(),
          collateralToDeposit.toString(),
          'Margin pool balance collateral asset balance mismatch',
        )
        assert.equal(
          (senderBalanceBefore.sub(senderBalanceAfter)).toString(),
          collateralToDeposit.toString(),
          'Sender balance collateral asset balance mismatch',
        )
        assert.equal(vaultAfter.collateralAssets.length, 1, 'Vault collateral assets array length mismatch')
        assert.equal(
          vaultAfter.collateralAssets[0],
          usdc.address,
          'Collateral asset address deposited into vault mismatch',
        )
        assert.equal(
         vaultAfter.collateralAmounts[0].toString(),
          collateralToDeposit.toString(),
          'Collateral asset amount deposited into vault mismatch',
        )
      })

      it('should deposit a whitelisted collateral asset from account operator', async () => {
        const vaultCounter = ethers.BigNumber.from(await controllerProxy.getAccountVaultCounter(accountOwner1.address))
        assert.isAbove(vaultCounter.toNumber(), 0, 'Account owner have no vault')

        const collateralToDeposit = createTokenAmount(10, usdcDecimals)
        const actionArgs = [
          {
            actionType: ActionType.DepositCollateral,
            owner: accountOwner1.address,
            secondAddress: accountOperator1.address,
            asset: usdc.address,
            vaultId: vaultCounter.toNumber(),
            amount: collateralToDeposit,
            index: '0',
            data: ZERO_ADDR,
          },
        ]

        const marginPoolBalanceBefore = ethers.BigNumber.from(await usdc.balanceOf(marginPool.address))
        const senderBalanceBefore = ethers.BigNumber.from(await usdc.balanceOf(accountOperator1.address))
        const vaultBefore = await controllerProxy.getVault(accountOwner1.address, vaultCounter)

        await usdc.connect(accountOperator1).approve(marginPool.address, collateralToDeposit)
        await controllerProxy.connect(accountOperator1).operate(actionArgs)

        const marginPoolBalanceAfter = ethers.BigNumber.from(await usdc.balanceOf(marginPool.address))
        const senderBalanceAfter = ethers.BigNumber.from(await usdc.balanceOf(accountOperator1.address))
        const vaultAfter = await controllerProxy.getVault(accountOwner1.address, vaultCounter)

        assert.equal(
          marginPoolBalanceAfter.sub(marginPoolBalanceBefore).toString(),
          collateralToDeposit.toString(),
          'Margin pool balance collateral asset balance mismatch',
        )
        assert.equal(
          senderBalanceBefore.sub(senderBalanceAfter).toString(),
          collateralToDeposit.toString(),
          'Sender balance collateral asset balance mismatch',
        )
        assert.equal(vaultAfter.collateralAssets.length, 1, 'Vault collateral assets array length mismatch')
        assert.equal(
          vaultAfter.collateralAssets[0],
          usdc.address,
          'Collateral asset address deposited into vault mismatch',
        )
        assert.equal(
          ethers.BigNumber.from(vaultAfter.collateralAmounts[0])
            .sub(ethers.BigNumber.from(vaultBefore.collateralAmounts[0]))
            .toString(),
          collateralToDeposit.toString(),
          'Long otoken amount deposited into vault mismatch',
        )
      })

      it('should revert depositing collateral asset with invalid vault id', async () => {
        const vaultCounter = ethers.BigNumber.from('100')

        const collateralToDeposit = createTokenAmount(10, usdcDecimals)
        const actionArgs = [
          {
            actionType: ActionType.DepositCollateral,
            owner: accountOwner1.address,
            secondAddress: accountOwner1.address,
            asset: usdc.address,
            vaultId: vaultCounter.toNumber(),
            amount: collateralToDeposit,
            index: '0',
            data: ZERO_ADDR,
          },
        ]

        await usdc.connect(accountOwner1).approve(marginPool.address, collateralToDeposit)
        await expectRevert(controllerProxy.connect(accountOwner1).operate(actionArgs), 'C35')
      })

      it('should revert depositing long from an address that is not the msg.sender nor the owner account address', async () => {
        const vaultCounter = ethers.BigNumber.from(await controllerProxy.getAccountVaultCounter(accountOwner1.address))

        const collateralToDeposit = createTokenAmount(10, usdcDecimals)
        const actionArgs = [
          {
            actionType: ActionType.DepositCollateral,
            owner: accountOwner1.address,
            secondAddress: random.address,
            asset: usdc.address,
            vaultId: vaultCounter.toNumber(),
            amount: collateralToDeposit,
            index: '0',
            data: ZERO_ADDR,
          },
        ]

        await usdc.connect(random).approve(marginPool.address, collateralToDeposit)
        await usdc.connect(accountOperator1).approve(marginPool.address, collateralToDeposit)
        await expectRevert(controllerProxy.connect(accountOperator1).operate(actionArgs), 'C20')
      })

      it('should revert depositing a collateral asset with amount equal to zero', async () => {
        const vaultCounter = ethers.BigNumber.from(await controllerProxy.getAccountVaultCounter(accountOwner1.address))
        assert.isAbove(vaultCounter.toNumber(), 0, 'Account owner have no vault')

        const collateralToDeposit = createTokenAmount(0, usdcDecimals)
        const actionArgs = [
          {
            actionType: ActionType.DepositCollateral,
            owner: accountOwner1.address,
            secondAddress: accountOwner1.address,
            asset: usdc.address,
            vaultId: vaultCounter.toNumber(),
            amount: collateralToDeposit,
            index: '0',
            data: ZERO_ADDR,
          },
        ]

        await usdc.connect(accountOwner1).approve(marginPool.address, collateralToDeposit)
        await expectRevert(controllerProxy.connect(accountOwner1).operate(actionArgs), 'V7')
      })

      it('should execute depositing collateral into vault in multiple actions', async () => {
        const vaultCounter = BigNumber.from(await controllerProxy.getAccountVaultCounter(accountOwner1.address))
        const collateralToDeposit = BigNumber.from(createTokenAmount(20, usdcDecimals))
        const actionArgs = [
          {
            actionType: ActionType.DepositCollateral,
            owner: accountOwner1.address,
            secondAddress: accountOwner1.address,
            asset: usdc.address,
            vaultId: vaultCounter.toNumber(),
            amount: collateralToDeposit.toNumber(),
            index: '0',
            data: ZERO_ADDR,
          },
          {
            actionType: ActionType.DepositCollateral,
            owner: accountOwner1.address,
            secondAddress: accountOwner1.address,
            asset: usdc.address,
            vaultId: vaultCounter.toNumber(),
            amount: collateralToDeposit.toNumber(),
            index: '0',
            data: ZERO_ADDR,
          },
        ]
        const marginPoolBalanceBefore = BigNumber.from(await usdc.balanceOf(marginPool.address))
        const senderBalanceBefore = BigNumber.from(await usdc.balanceOf(accountOwner1.address))
        const vaultBefore = await controllerProxy.getVault(accountOwner1.address, vaultCounter)

        await usdc
          .connect(accountOwner1)
          .approve(marginPool.address, (collateralToDeposit).mul(2))

        await controllerProxy.connect(accountOwner1).operate(actionArgs)

        const marginPoolBalanceAfter = BigNumber.from(await usdc.balanceOf(marginPool.address))
        const senderBalanceAfter = BigNumber.from(await usdc.balanceOf(accountOwner1.address))
        const vaultAfter = await controllerProxy.getVault(accountOwner1.address, vaultCounter)

        assert.equal(
          (marginPoolBalanceAfter.sub(marginPoolBalanceBefore)).toString(),
          (collateralToDeposit.mul(2)).toString(),
          'Margin pool collateral balance mismatch',
        )
        assert.equal(
          (senderBalanceBefore.sub(senderBalanceAfter)).toString(),
          (collateralToDeposit.mul(2)).toString(),
          'Sender collateral asset balance mismatch',
        )
        assert.equal(vaultAfter.collateralAmounts.length, 1, 'Vault collateral asset array length mismatch')
        assert.equal(
          vaultAfter.collateralAssets[0],
          usdc.address,
          'Collateral asset address deposited into vault mismatch',
        )
        assert.equal(
          ((vaultAfter.collateralAmounts[0])
            .sub((vaultBefore.collateralAmounts[0])))
            .toString(),
          (collateralToDeposit.mul(2)).toString(),
          'Collateral asset amount deposited into vault mismatch',
        )
      })

      describe('Deposit un-whitelisted collateral asset', () => {
        it('should revert depositing a collateral asset that is not whitelisted', async () => {
          // deploy a shitcoin
          const trxDeployed: MockERC20 = (await MockERC20.deploy('TRX', 'TRX', 18)) as MockERC20
          const trx = await trxDeployed.deployed()
          await trx.mint(accountOwner1.address, ethers.BigNumber.from('1000'))

          const vaultCounter = ethers.BigNumber.from(
            await controllerProxy.getAccountVaultCounter(accountOwner1.address),
          )
          assert.isAbove(vaultCounter.toNumber(), 0, 'Account owner have no vault')

          const collateralDeposit = createTokenAmount(10, wethDecimals)
          const actionArgs = [
            {
              actionType: ActionType.DepositCollateral,
              owner: accountOwner1.address,
              secondAddress: accountOwner1.address,
              asset: trx.address,
              vaultId: vaultCounter.toNumber(),
              amount: collateralDeposit,
              index: '0',
              data: ZERO_ADDR,
            },
          ]

          await trx.connect(accountOwner1).approve(marginPool.address, collateralDeposit)
          await expectRevert(controllerProxy.connect(accountOwner1).operate(actionArgs), 'C21')
        })
      })

      it('should revert when vault have more than 1 collateral type', async () => {
        const collateralToDeposit = createTokenAmount(10, wethDecimals)
        //whitelist weth to use in this test
        await whitelist.whitelistCollateral(weth.address)
        await weth.mint(accountOwner1.address, collateralToDeposit)

        const vaultCounter = ethers.BigNumber.from(await controllerProxy.getAccountVaultCounter(accountOwner1.address))
        const actionArgs = [
          {
            actionType: ActionType.DepositCollateral,
            owner: accountOwner1.address,
            secondAddress: accountOwner1.address,
            asset: weth.address,
            vaultId: vaultCounter.toNumber(),
            amount: collateralToDeposit,
            index: '1',
            data: ZERO_ADDR,
          },
        ]

        await weth.connect(accountOwner1).approve(marginPool.address, collateralToDeposit)
        await expectRevert(
          controllerProxy.connect(accountOwner1).operate(actionArgs),
          'MarginCalculator: Too many collateral assets in the vault',
        )
      })
    })

    describe('withdraw collateral', () => {
      it('should revert withdrawing collateral asset with wrong index from a vault', async () => {
        const vaultCounter = ethers.BigNumber.from(await controllerProxy.getAccountVaultCounter(accountOwner1.address))
        assert.isAbove(vaultCounter.toNumber(), 0, 'Account owner have no vault')

        const collateralToWithdraw = createTokenAmount(20, usdcDecimals)
        const actionArgs = [
          {
            actionType: ActionType.WithdrawCollateral,
            owner: accountOwner1.address,
            secondAddress: accountOwner1.address,
            asset: usdc.address,
            vaultId: vaultCounter.toNumber(),
            amount: collateralToWithdraw,
            index: '1',
            data: ZERO_ADDR,
          },
        ]

        await expectRevert(controllerProxy.connect(accountOwner1).operate(actionArgs), 'V8')
      })

      it('should revert withdrawing collateral asset from an invalid id', async () => {
        const vaultCounter = ethers.BigNumber.from(await controllerProxy.getAccountVaultCounter(accountOwner1.address))
        assert.isAbove(vaultCounter.toNumber(), 0, 'Account owner have no vault')

        const collateralToWithdraw = createTokenAmount(20, usdcDecimals)
        const actionArgs = [
          {
            actionType: ActionType.WithdrawCollateral,
            owner: accountOwner1.address,
            secondAddress: accountOwner1.address,
            asset: usdc.address,
            vaultId: '1350',
            amount: collateralToWithdraw,
            index: '1',
            data: ZERO_ADDR,
          },
        ]

        await expectRevert(controllerProxy.connect(accountOwner1).operate(actionArgs), 'C35')
      })

      it('should revert withdrawing collateral asset amount greater than the vault balance', async () => {
        const vaultCounter = ethers.BigNumber.from(await controllerProxy.getAccountVaultCounter(accountOwner1.address))
        assert.isAbove(vaultCounter.toNumber(), 0, 'Account owner have no vault')

        const vaultBefore = await controllerProxy.getVault(accountOwner1.address, vaultCounter)
        const collateralToWithdraw = vaultBefore.collateralAmounts[0].add(1)
        const actionArgs = [
          {
            actionType: ActionType.WithdrawCollateral,
            owner: accountOwner1.address,
            secondAddress: accountOwner1.address,
            asset: usdc.address,
            vaultId: vaultCounter.toNumber(),
            amount: collateralToWithdraw.toNumber(),
            index: '0',
            data: ZERO_ADDR,
          },
        ]

        await expectRevert(controllerProxy.connect(accountOwner1).operate(actionArgs), 'SafeMath: subtraction overflow')
      })

      it('should withdraw collateral to any random address where msg.sender is account owner', async () => {
        const vaultCounter = ethers.BigNumber.from(await controllerProxy.getAccountVaultCounter(accountOwner1.address))
        assert.isAbove(vaultCounter.toNumber(), 0, 'Account owner have no vault')

        const collateralToWithdraw = createTokenAmount(10, usdcDecimals)
        const actionArgs = [
          {
            actionType: ActionType.WithdrawCollateral,
            owner: accountOwner1.address,
            secondAddress: random.address,
            asset: usdc.address,
            vaultId: vaultCounter.toNumber(),
            amount: collateralToWithdraw,
            index: '0',
            data: ZERO_ADDR,
          },
        ]
        const marginPoolBalanceBefore = ethers.BigNumber.from(await usdc.balanceOf(marginPool.address))
        const receiverBalanceBefore = ethers.BigNumber.from(await usdc.balanceOf(random.address))
        const vaultBefore = await controllerProxy.getVault(accountOwner1.address, vaultCounter)

        await controllerProxy.connect(accountOwner1).operate(actionArgs)

        const marginPoolBalanceAfter = ethers.BigNumber.from(await usdc.balanceOf(marginPool.address))
        const receiverBalanceAfter = ethers.BigNumber.from((await usdc.balanceOf(random.address)).toString())
        const vaultAfter = await controllerProxy.getVault(accountOwner1.address, vaultCounter)

        assert.equal(
          marginPoolBalanceBefore.sub(marginPoolBalanceAfter).toString(),
          collateralToWithdraw.toString(),
          'Margin pool collateral asset balance mismatch',
        )
        assert.equal(
          receiverBalanceAfter.sub(receiverBalanceBefore).toString(),
          collateralToWithdraw.toString(),
          'Receiver collateral asset balance mismatch',
        )
        assert.equal(vaultAfter.collateralAssets.length, 1, 'Vault collateral asset array length mismatch')
        assert.equal(
          vaultBefore.collateralAmounts[0].sub(vaultAfter.collateralAmounts[0]).toString(),
          collateralToWithdraw.toString(),
          'Collateral asset amount in vault after withdraw mismatch',
        )
      })

      it('should withdraw collateral asset to any random address where msg.sender is account operator', async () => {
        assert.equal(
          await controllerProxy.isOperator(accountOwner1.address, accountOperator1.address),
          true,
          'Operator address mismatch',
        )

        const vaultCounter = await controllerProxy.getAccountVaultCounter(accountOwner1.address)
        assert.isAbove(vaultCounter.toNumber(), 0, 'Account owner have no vault')

        const collateralToWithdraw = createTokenAmount(10, usdcDecimals)
        const actionArgs = [
          {
            actionType: ActionType.WithdrawCollateral,
            owner: accountOwner1.address,
            secondAddress: random.address,
            asset: usdc.address,
            vaultId: vaultCounter.toNumber(),
            amount: collateralToWithdraw,
            index: '0',
            data: ZERO_ADDR,
          },
        ]
        const marginPoolBalanceBefore = ethers.BigNumber.from(await usdc.balanceOf(marginPool.address))
        const receiverBalanceBefore = ethers.BigNumber.from(await usdc.balanceOf(random.address))
        const vaultBefore = await controllerProxy.getVault(accountOwner1.address, vaultCounter)

        await controllerProxy.connect(accountOperator1).operate(actionArgs)

        const marginPoolBalanceAfter = ethers.BigNumber.from(await usdc.balanceOf(marginPool.address))
        const receiverBalanceAfter = ethers.BigNumber.from(await usdc.balanceOf(random.address))
        const vaultAfter = await controllerProxy.getVault(accountOwner1.address, vaultCounter)

        assert.equal(
          marginPoolBalanceBefore.sub(marginPoolBalanceAfter).toString(),
          collateralToWithdraw.toString(),
          'Margin pool collateral asset balance mismatch',
        )
        assert.equal(
          receiverBalanceAfter.sub(receiverBalanceBefore).toString(),
          collateralToWithdraw.toString(),
          'Receiver collateral asset balance mismatch',
        )
        assert.equal(vaultAfter.collateralAssets.length, 1, 'Vault collateral asset array length mismatch')
        assert.equal(
          vaultBefore.collateralAmounts[0].sub(vaultAfter.collateralAmounts[0]).toString(),
          collateralToWithdraw.toString(),
          'Collateral asset amount in vault after withdraw mismatch',
        )
      })

      it('should execute withdrawing collateral asset in mutliple actions', async () => {
        const vaultCounter = BigNumber.from(await controllerProxy.getAccountVaultCounter(accountOwner1.address))
        assert.isAbove(vaultCounter.toNumber(), 0, 'Account owner have no vault')

        const collateralToWithdraw = BigNumber.from(createTokenAmount(10, usdcDecimals))
        const actionArgs = [
          {
            actionType: ActionType.WithdrawCollateral,
            owner: accountOwner1.address,
            secondAddress: accountOwner1.address,
            asset: usdc.address,
            vaultId: vaultCounter.toNumber(),
            amount: collateralToWithdraw.toString(),
            index: '0',
            data: ZERO_ADDR,
          },
          {
            actionType: ActionType.WithdrawCollateral,
            owner: accountOwner1.address,
            secondAddress: accountOwner1.address,
            asset: usdc.address,
            vaultId: vaultCounter.toNumber(),
            amount: collateralToWithdraw.toString(),
            index: '0',
            data: ZERO_ADDR,
          },
        ]
        const marginPoolBalanceBefore = ethers.BigNumber.from(await usdc.balanceOf(marginPool.address))
        const receiverBalanceBefore = ethers.BigNumber.from(await usdc.balanceOf(accountOwner1.address))
        const vaultBefore = await controllerProxy.getVault(accountOwner1.address, vaultCounter.toString())

        await controllerProxy.connect(accountOwner1).operate(actionArgs)

        const marginPoolBalanceAfter = ethers.BigNumber.from(await usdc.balanceOf(marginPool.address))
        const receiverBalanceAfter = ethers.BigNumber.from(await usdc.balanceOf(accountOwner1.address))
        const vaultAfter = await controllerProxy.getVault(accountOwner1.address, vaultCounter.toString())

        assert.equal(
          marginPoolBalanceBefore.sub(marginPoolBalanceAfter).toString(),
          collateralToWithdraw.mul(2).toString(),
          'Margin pool collateral asset balance mismatch',
        )
        assert.equal(
          receiverBalanceAfter.sub(receiverBalanceBefore).toString(),
          collateralToWithdraw.mul(2).toString(),
          'Receiver collateral asset balance mismatch',
        )
        assert.equal(vaultAfter.collateralAssets.length, 1, 'Vault long otoken array length mismatch')
        assert.equal(
          vaultBefore.collateralAmounts[0].sub(vaultAfter.collateralAmounts[0]).toString(),
          collateralToWithdraw.mul(2).toString(),
          'Collateral asset amount in vault after withdraw mismatch',
        )
      })

      it('should remove collateral asset address from collateral array if amount is equal to zero after withdrawing', async () => {
        const vaultCounter = ethers.BigNumber.from(await controllerProxy.getAccountVaultCounter(accountOwner1.address))
        assert.isAbove(vaultCounter.toNumber(), 0, 'Account owner have no vault')

        const vaultBefore = await controllerProxy.getVault(accountOwner1.address, vaultCounter)

        const collateralToWithdraw = vaultBefore.collateralAmounts[0]
        const actionArgs = [
          {
            actionType: ActionType.WithdrawCollateral,
            owner: accountOwner1.address,
            secondAddress: accountOwner1.address,
            asset: usdc.address,
            vaultId: vaultCounter.toNumber(),
            amount: collateralToWithdraw.toNumber(),
            index: '0',
            data: ZERO_ADDR,
          },
        ]
        const marginPoolBalanceBefore = ethers.BigNumber.from(await usdc.balanceOf(marginPool.address))
        const receiverBalanceBefore = ethers.BigNumber.from(await usdc.balanceOf(accountOwner1.address))

        await controllerProxy.connect(accountOwner1).operate(actionArgs)

        const marginPoolBalanceAfter = ethers.BigNumber.from(await usdc.balanceOf(marginPool.address))
        const receiverBalanceAfter = ethers.BigNumber.from(await usdc.balanceOf(accountOwner1.address))
        const vaultAfter = await controllerProxy.getVault(accountOwner1.address, vaultCounter.toString())

        assert.equal(
          marginPoolBalanceBefore.sub(marginPoolBalanceAfter).toString(),
          collateralToWithdraw.toString(),
          'Margin pool balance long otoken balance mismatch',
        )
        assert.equal(
          receiverBalanceAfter.sub(receiverBalanceBefore).toString(),
          collateralToWithdraw.toString(),
          'Receiver long otoken balance mismatch',
        )
        assert.equal(vaultAfter.collateralAssets.length, 1, 'Vault collateral asset array length mismatch')
        assert.equal(vaultAfter.collateralAssets[0], ZERO_ADDR, 'Vault collater asset address after clearing mismatch')
        assert.equal(
          vaultBefore.collateralAmounts[0].sub(vaultAfter.collateralAmounts[0]).toString(),
          collateralToWithdraw.toString(),
          'Collateral asset amount in vault after withdraw mismatch',
        )
      })
    })
  })

  describe('Short otoken', () => {
    let longOtoken: MockOtoken
    let shortOtoken: MockOtoken

    this.beforeAll('before all short otokens', async () => {
      const expiryTime = ethers.BigNumber.from(60 * 60 * 24) // after 1 day
      const longOtokenDeployed = (await MockOtoken.deploy()) as MockOtoken
      longOtoken = await longOtokenDeployed.deployed()

      const shortOtokenDeployed = (await MockOtoken.deploy()) as MockOtoken
      shortOtoken = await shortOtokenDeployed.deployed()

      // init otoken
      await longOtoken.init(
        addressBook.address,
        weth.address,
        usdc.address,
        usdc.address,
        createTokenAmount(250),
        ethers.BigNumber.from(await getLatestTime()).add(expiryTime),
        true,
      )
      await shortOtoken.init(
        addressBook.address,
        weth.address,
        usdc.address,
        usdc.address,
        createTokenAmount(200),
        ethers.BigNumber.from(await getLatestTime()).add(expiryTime),
        true,
      )

      // whitelist short otoken to be used in the protocol
      await whitelist.connect(owner).whitelistOtoken(shortOtoken.address)

      // give free money
      await longOtoken.mintOtoken(accountOwner1.address, ethers.BigNumber.from('100'))
      await longOtoken.mintOtoken(accountOperator1.address, ethers.BigNumber.from('100'))
      await usdc.mint(accountOwner1.address, ethers.BigNumber.from('1000000'))
      await usdc.mint(accountOperator1.address, ethers.BigNumber.from('1000000'))
      await usdc.mint(random.address, ethers.BigNumber.from('1000000'))
    })

    describe('Mint short otoken', () => {
      it('should revert minting from random address other than owner or operator', async () => {
        const vaultCounter = ethers.BigNumber.from(await controllerProxy.getAccountVaultCounter(accountOwner1.address))
        assert.isAbove(vaultCounter.toNumber(), 0, 'Account owner have no vault')

        const amountToMint = createTokenAmount(1)
        const actionArgs = [
          {
            actionType: ActionType.MintShortOption,
            owner: accountOwner1.address,
            secondAddress: random.address,
            asset: shortOtoken.address,
            vaultId: vaultCounter.toNumber(),
            amount: amountToMint,
            index: '0',
            data: ZERO_ADDR,
          },
        ]

        await expectRevert(controllerProxy.connect(random).operate(actionArgs), 'C6')
      })

      it('should revert minting using un-marginable collateral asset', async () => {
        const vaultCounter = BigNumber.from(await controllerProxy.getAccountVaultCounter(accountOwner1.address))
        assert.isAbove(vaultCounter.toNumber(), 0, 'Account owner have no vault')

        const collateralToDeposit = ethers.BigNumber.from(await shortOtoken.strikePrice()).div(1e8)
        const amountToMint = createTokenAmount(1, wethDecimals)
        const actionArgs = [
          {
            actionType: ActionType.MintShortOption,
            owner: accountOwner1.address,
            secondAddress: accountOwner1.address,
            asset: shortOtoken.address,
            vaultId: vaultCounter.toNumber(),
            amount: amountToMint,
            index: '0',
            data: ZERO_ADDR,
          },
          {
            actionType: ActionType.DepositCollateral,
            owner: accountOwner1.address,
            secondAddress: accountOwner1.address,
            asset: weth.address,
            vaultId: vaultCounter.toNumber(),
            amount: collateralToDeposit.toString(),
            index: '0',
            data: ZERO_ADDR,
          },
        ]

        // free money
        await weth.mint(accountOwner1.address, collateralToDeposit.toString())

        await weth.connect(accountOwner1).approve(marginPool.address, collateralToDeposit.toString())
        await expectRevert(
          controllerProxy.connect(accountOwner1).operate(actionArgs),
          'MarginCalculator: collateral asset not marginable for short asset',
        )
      })

      it('should revert minting short with invalid vault id', async () => {
        const vaultCounter = ethers.BigNumber.from('100')

        const amountToMint = createTokenAmount(1)
        const actionArgs = [
          {
            actionType: ActionType.MintShortOption,
            owner: accountOwner1.address,
            secondAddress: accountOwner1.address,
            asset: shortOtoken.address,
            vaultId: vaultCounter.toNumber(),
            amount: amountToMint,
            index: '0',
            data: ZERO_ADDR,
          },
        ]

        await expectRevert(controllerProxy.connect(accountOwner1).operate(actionArgs), 'C35')
      })

      it('mint naked short otoken from owner', async () => {
        const vaultCounter = BigNumber.from(await controllerProxy.getAccountVaultCounter(accountOwner1.address))
        assert.isAbove(vaultCounter.toNumber(), 0, 'Account owner have no vault')

        const collateralToDeposit = BigNumber.from(await shortOtoken.strikePrice()).div(100)
        
        const amountToMint = BigNumber.from(createTokenAmount(1))
     
        const actionArgs = [
          {
            actionType: ActionType.MintShortOption,
            owner: accountOwner1.address,
            secondAddress: accountOwner1.address,
            asset: shortOtoken.address,
            vaultId: vaultCounter.toNumber(),
            amount: amountToMint.toNumber(),
            index: '0',
            data: ZERO_ADDR,
          },
          {
            actionType: ActionType.DepositCollateral,
            owner: accountOwner1.address,
            secondAddress: accountOwner1.address,
            asset: usdc.address,
            vaultId: vaultCounter.toNumber(),
            amount: collateralToDeposit.toNumber(),
            index: '0',
            data: ZERO_ADDR,
          },
        ]

        const marginPoolBalanceBefore = BigNumber.from(await usdc.balanceOf(marginPool.address))
        const senderBalanceBefore  =     BigNumber.from(await usdc.balanceOf(accountOwner1.address))
        const senderShortBalanceBefore = BigNumber.from(await shortOtoken.balanceOf(accountOwner1.address))
        const vaultBefore = await controllerProxy.getVault(accountOwner1.address, vaultCounter)

        await usdc.connect(accountOwner1).approve(marginPool.address, collateralToDeposit)
        await controllerProxy.connect(accountOwner1).operate(actionArgs)

        const marginPoolBalanceAfter = BigNumber.from(await usdc.balanceOf(marginPool.address))
        const senderBalanceAfter =  BigNumber.from(await usdc.balanceOf(accountOwner1.address))
        const senderShortBalanceAfter = BigNumber.from(await shortOtoken.balanceOf(accountOwner1.address))
        const vaultAfter = await controllerProxy.getVault(accountOwner1.address, vaultCounter)

        assert.equal(
          (marginPoolBalanceAfter.sub(marginPoolBalanceBefore)).toString(),
          collateralToDeposit.toString(),
          'Margin pool collateral asset balance mismatch',
        )
        assert.equal(
          (senderBalanceBefore.sub(senderBalanceAfter)).toString(),
          collateralToDeposit.toString(),
          'Sender collateral asset balance mismatch',
        )
        assert.equal(vaultAfter.collateralAssets.length, 1, 'Vault collateral asset array length mismatch')
        assert.equal(vaultAfter.shortOtokens.length, 1, 'Vault short otoken array length mismatch')
        assert.equal(
          vaultAfter.collateralAssets[0],
          usdc.address,
          'Collateral asset address deposited into vault mismatch',
        )
        assert.equal(
          vaultAfter.shortOtokens[0],
          shortOtoken.address,
          'Short otoken address deposited into vault mismatch',
        )
        assert.equal(
          (senderShortBalanceAfter.sub(senderShortBalanceBefore)).toString(),
          amountToMint.toString(),
          'Short otoken amount minted mismatch',
        )
        assert.equal(
          (vaultAfter.collateralAmounts[0]
            .sub(vaultBefore.collateralAmounts[0]))
            .toString(),
          collateralToDeposit.toString(),
          'Collateral asset amount deposited into vault mismatch',
        )
        assert.equal(
          (vaultAfter.shortAmounts[0]).toString(),
          amountToMint.toString(),
          'Short otoken amount minted into vault mismatch',
        )
      })

      it('mint naked short otoken from operator', async () => {
        const vaultCounter = BigNumber.from(await controllerProxy.getAccountVaultCounter(accountOwner1.address))
        assert.isAbove(vaultCounter.toNumber(), 0, 'Account owner have no vault')
        const collateralToDeposit = (await shortOtoken.strikePrice()).div(100)
        const amountToMint = createTokenAmount(1)
        const actionArgs = [
          {
            actionType: ActionType.MintShortOption,
            owner: accountOwner1.address,
            secondAddress: accountOperator1.address,
            asset: shortOtoken.address,
            vaultId: vaultCounter.toNumber(),
            amount: amountToMint,
            index: '0',
            data: ZERO_ADDR,
          },
          {
            actionType: ActionType.DepositCollateral,
            owner: accountOwner1.address,
            secondAddress: accountOperator1.address,
            asset: usdc.address,
            vaultId: vaultCounter.toNumber(),
            amount: collateralToDeposit.toNumber(),
            index: '0',
            data: ZERO_ADDR,
          },
        ]
       
        const marginPoolBalanceBefore = BigNumber.from(await usdc.balanceOf(marginPool.address))
      
        const senderBalanceBefore = BigNumber.from(await usdc.balanceOf(accountOperator1.address))

        const senderShortBalanceBefore = BigNumber.from(await shortOtoken.balanceOf(accountOperator1.address))
    
        const vaultBefore = await controllerProxy.getVault(accountOwner1.address, vaultCounter)
       
        await usdc.connect(accountOperator1).approve(marginPool.address, collateralToDeposit)
        await controllerProxy.connect(accountOperator1).operate(actionArgs)
        
        const marginPoolBalanceAfter = BigNumber.from(await usdc.balanceOf(marginPool.address))
        const senderBalanceAfter = BigNumber.from(await usdc.balanceOf(accountOperator1.address))
        const senderShortBalanceAfter = BigNumber.from(await shortOtoken.balanceOf(accountOperator1.address))
        const vaultAfter = await controllerProxy.getVault(accountOwner1.address, vaultCounter)
       
        assert.equal(
          (marginPoolBalanceAfter.sub(marginPoolBalanceBefore)).toString(),
          collateralToDeposit.toString(),
          'Margin pool collateral asset balance mismatch',
        )
       
        assert.equal(
          (senderBalanceBefore.sub(senderBalanceAfter)).toString(),
          collateralToDeposit.toString(),
          'Sender collateral asset balance mismatch',
        )
      
        assert.equal(vaultAfter.collateralAssets.length, 1, 'Vault collateral asset array length mismatch')
        assert.equal(vaultAfter.shortOtokens.length, 1, 'Vault short otoken array length mismatch')
        assert.equal(
          vaultAfter.collateralAssets[0],
          usdc.address,
          'Collateral asset address deposited into vault mismatch',
        )
        assert.equal(
          vaultAfter.shortOtokens[0],
          shortOtoken.address,
          'Short otoken address deposited into vault mismatch',
        )
        assert.equal(
          (senderShortBalanceAfter.sub(senderShortBalanceBefore)).toString(),
          amountToMint.toString(),
          'Short otoken amount minted mismatch',
        )

        assert.equal(
          (vaultAfter.collateralAmounts[0]
            .sub(vaultBefore.collateralAmounts[0]))
            .toString(),
          collateralToDeposit.toString(),
          'Collateral asset amount deposited into vault mismatch',
        )
     
        assert.equal(
          (vaultAfter.shortAmounts[0]
            .sub(vaultBefore.shortAmounts[0]))
            .toString(),
          amountToMint.toString(),
          'Short otoken amount minted into vault mismatch',
        )
      })

      it('should revert withdrawing collateral from naked short position when net value is equal to zero', async () => {
        const vaultCounter = BigNumber.from(await controllerProxy.getAccountVaultCounter(accountOwner1.address))
        assert.isAbove(vaultCounter.toNumber(), 0, 'Account owner have no vault')

        const vaultBefore = await controllerProxy.getVaultWithDetails(accountOwner1.address, vaultCounter)

        const [netValue, isExcess] = await calculator.getExcessCollateral(vaultBefore[0], vaultBefore[1])

        const proceed = await controllerProxy.getProceed(accountOwner1.address, vaultCounter.toString())
        assert.equal(netValue.toString(), proceed.toString())

        assert.equal(netValue.toString(), '0', 'Position net value mistmatch')
        assert.equal(isExcess, true, 'Position collateral excess mismatch')

        const collateralToWithdraw = vaultBefore[0].collateralAmounts[0]
        const actionArgs = [
          {
            actionType: ActionType.WithdrawCollateral,
            owner: accountOwner1.address,
            secondAddress: accountOwner1.address,
            asset: usdc.address,
            vaultId: vaultCounter.toNumber(),
            amount: collateralToWithdraw.toNumber(),
            index: '0',
            data: ZERO_ADDR,
          },
        ]

        await expectRevert(controllerProxy.connect(accountOwner1).operate(actionArgs), 'C14')
      })

      it('should withdraw exceeded collateral from naked short position when net value > 0 ', async () => {
        const vaultCounter = BigNumber.from(await controllerProxy.getAccountVaultCounter(accountOwner1.address))
        assert.isAbove(vaultCounter.toNumber(), 0, 'Account owner have no vault')

        // deposit more collateral
        const excessCollateralToDeposit = createTokenAmount(50, usdcDecimals)
        const firstActionArgs = [
          {
            actionType: ActionType.DepositCollateral,
            owner: accountOwner1.address,
            secondAddress: accountOwner1.address,
            asset: usdc.address,
            vaultId: vaultCounter.toNumber(),
            amount: excessCollateralToDeposit,
            index: '0',
            data: ZERO_ADDR,
          },
        ]
        await usdc.connect(accountOwner1).approve(marginPool.address, excessCollateralToDeposit)
        await controllerProxy.connect(accountOwner1).operate(firstActionArgs)

        const vaultBefore = await controllerProxy.getVaultWithDetails(accountOwner1.address, vaultCounter.toString())
        const marginPoolBalanceBefore = BigNumber.from((await usdc.balanceOf(marginPool.address)).toString())
        const withdrawerBalanceBefore = BigNumber.from((await usdc.balanceOf(accountOwner1.address)).toString())

        const [netValue, isExcess] = await calculator.getExcessCollateral(vaultBefore[0], vaultBefore[1])

        const proceed = await controllerProxy.getProceed(accountOwner1.address, vaultCounter.toString())
        assert.equal(netValue.toString(), proceed.toString())

        assert.equal(netValue.toString(), excessCollateralToDeposit.toString(), 'Position net value mistmatch')
        assert.equal(isExcess, true, 'Position collateral excess mismatch')

        const secondActionArgs = [
          {
            actionType: ActionType.WithdrawCollateral,
            owner: accountOwner1.address,
            secondAddress: accountOwner1.address,
            asset: usdc.address,
            vaultId: vaultCounter.toNumber(),
            amount: excessCollateralToDeposit,
            index: '0',
            data: ZERO_ADDR,
          },
        ]

        await controllerProxy.connect(accountOwner1).operate(secondActionArgs)

        const vaultAfter = await controllerProxy.getVault(accountOwner1.address, vaultCounter)
        const marginPoolBalanceAfter = BigNumber.from(await usdc.balanceOf(marginPool.address))
        const withdrawerBalanceAfter = BigNumber.from(await usdc.balanceOf(accountOwner1.address))

        assert.equal(
          marginPoolBalanceBefore.sub(marginPoolBalanceAfter).toString(),
          excessCollateralToDeposit.toString(),
          'Margin pool collateral asset balance mismatch',
        )
        assert.equal(
          withdrawerBalanceAfter.sub(withdrawerBalanceBefore).toString(),
          excessCollateralToDeposit.toString(),
          'Receiver collateral asset balance mismatch',
        )
        assert.equal(vaultAfter.collateralAssets.length, 1, 'Vault collateral asset array length mismatch')
        assert.equal(
          vaultBefore[0].collateralAmounts[0].sub(vaultAfter.collateralAmounts[0]).toString(),
          excessCollateralToDeposit.toString(),
          'Collateral asset amount in vault after withdraw mismatch',
        )
      })

      it('should revert when vault have more than 1 short otoken', async () => {
        const vaultCounter = BigNumber.from(await controllerProxy.getAccountVaultCounter(accountOwner1.address))
        assert.isAbove(vaultCounter.toNumber(), 0, 'Account owner have no vault')

        await whitelist.connect(owner).whitelistOtoken(longOtoken.address)

        const amountToMint = '1'

        const actionArgs = [
          {
            actionType: ActionType.MintShortOption,
            owner: accountOwner1.address,
            secondAddress: accountOwner1.address,
            asset: longOtoken.address,
            vaultId: vaultCounter.toNumber(),
            amount: amountToMint,
            index: '1',
            data: ZERO_ADDR,
          },
        ]

        await expectRevert(
          controllerProxy.connect(accountOwner1).operate(actionArgs),
          'MarginCalculator: Too many short otokens in the vault',
        )
      })

      describe('Mint un-whitelisted short otoken', () => {
        it('should revert minting an otoken that is not whitelisted in Whitelist module', async () => {
          const expiryTime = BigNumber.from(60 * 60 * 24) // after 1 day

          const notWhitelistedShortOtokenDeployed: MockOtoken = (await MockOtoken.deploy()) as MockOtoken

          const notWhitelistedShortOtoken = await notWhitelistedShortOtokenDeployed.deployed()

          await notWhitelistedShortOtoken.init(
            addressBook.address,
            weth.address,
            usdc.address,
            usdc.address,
            createTokenAmount(200),
            ethers.BigNumber.from(await getLatestTime()).add(expiryTime),
            true,
          )

          const collateralToDeposit = BigNumber.from(await notWhitelistedShortOtoken.strikePrice()).div(100)
          const amountToMint = createTokenAmount(1)
          const actionArgs = [
            {
              actionType: ActionType.OpenVault,
              owner: accountOperator1.address,
              secondAddress: accountOperator1.address,
              asset: ZERO_ADDR,
              vaultId: '1',
              amount: '0',
              index: '0',
              data: ZERO_ADDR,
            },
            {
              actionType: ActionType.MintShortOption,
              owner: accountOperator1.address,
              secondAddress: accountOperator1.address,
              asset: notWhitelistedShortOtoken.address,
              vaultId: '1',
              amount: amountToMint,
              index: '0',
              data: ZERO_ADDR,
            },
            {
              actionType: ActionType.DepositCollateral,
              owner: accountOperator1.address,
              secondAddress: accountOperator1.address,
              asset: usdc.address,
              vaultId: '1',
              amount: collateralToDeposit.toNumber(),
              index: '0',
              data: ZERO_ADDR,
            },
          ]

          await usdc.connect(accountOperator1).approve(marginPool.address, collateralToDeposit.toString())
          await expectRevert(controllerProxy.connect(accountOperator1).operate(actionArgs), 'C23')
        })
      })

      describe('Mint negligible amount', () => {
        let oneDollarPut: MockOtoken
        let smallestPut: MockOtoken

        this.beforeAll('create options with small strike price', async () => {
          const oneDollarPutDeployed = (await MockOtoken.deploy()) as MockOtoken
          oneDollarPut = await oneDollarPutDeployed.deployed()

          const smallestPutDeployed = (await MockOtoken.deploy()) as MockOtoken
          smallestPut = await smallestPutDeployed.deployed()
          // init otoken
          await oneDollarPut.init(
            addressBook.address,
            weth.address,
            usdc.address,
            usdc.address,
            createTokenAmount(1),
            ethers.BigNumber.from(await getLatestTime()).add(86400),
            true,
          )
          await smallestPut.init(
            addressBook.address,
            weth.address,
            usdc.address,
            usdc.address,
            1,
            ethers.BigNumber.from(await getLatestTime()).add(86400),
            true,
          )
          await whitelist.connect(owner).whitelistOtoken(oneDollarPut.address)
          await whitelist.connect(owner).whitelistOtoken(smallestPut.address)
        })
        it('should revert if trying to mint 1 wei of oToken with strikePrice = 1 USD without putting collateral', async () => {
          const vaultId = (await controllerProxy.getAccountVaultCounter(accountOwner2.address)).toNumber() + 1
          const actionArgs = [
            {
              actionType: ActionType.OpenVault,
              owner: accountOwner2.address,
              secondAddress: accountOwner2.address,
              asset: ZERO_ADDR,
              vaultId: vaultId,
              amount: '0',
              index: '0',
              data: ZERO_ADDR,
            },
            {
              actionType: ActionType.MintShortOption,
              owner: accountOwner2.address,
              secondAddress: accountOwner2.address,
              asset: oneDollarPut.address,
              vaultId: vaultId,
              amount: '1',
              index: '0',
              data: ZERO_ADDR,
            },
          ]
          await expectRevert(controllerProxy.connect(accountOwner2).operate(actionArgs), 'C14')
        })

        it('should revert minting 1 wei of oToken with minimal strikePrice without putting collateral', async () => {
          const vaultId = (await controllerProxy.getAccountVaultCounter(accountOwner2.address)).toNumber() + 1
          const actionArgs = [
            {
              actionType: ActionType.OpenVault,
              owner: accountOwner2.address,
              secondAddress: accountOwner2.address,
              asset: ZERO_ADDR,
              vaultId: vaultId,
              amount: '0',
              index: '0',
              data: ZERO_ADDR,
            },
            {
              actionType: ActionType.MintShortOption,
              owner: accountOwner2.address,
              secondAddress: accountOwner2.address,
              asset: smallestPut.address,
              vaultId: vaultId,
              amount: '1',
              index: '0',
              data: ZERO_ADDR,
            },
          ]

          await expectRevert(controllerProxy.connect(accountOwner2).operate(actionArgs), 'C14')
        })
      })
    })

    describe('Burn short otoken', () => {
      it('should revert burning short otoken with wrong index from a vault', async () => {
        const vaultCounter = BigNumber.from(await controllerProxy.getAccountVaultCounter(accountOwner1.address))
        assert.isAbove(vaultCounter.toNumber(), 0, 'Account owner have no vault')

        const shortOtokenToBurn = await shortOtoken.balanceOf(accountOwner1.address)
        const actionArgs = [
          {
            actionType: ActionType.BurnShortOption,
            owner: accountOwner1.address,
            secondAddress: accountOwner1.address,
            asset: shortOtoken.address,
            vaultId: vaultCounter.toNumber(),
            amount: shortOtokenToBurn.toString(),
            index: '1',
            data: ZERO_ADDR,
          },
        ]

        await expectRevert(controllerProxy.connect(accountOwner1).operate(actionArgs), 'V2')
      })

      it('should revert burning when there is no enough balance', async () => {
        // transfer operator balance
        const operatorShortBalance = BigNumber.from(await shortOtoken.balanceOf(accountOperator1.address))
        await shortOtoken.connect(accountOperator1).transfer(accountOwner1.address, operatorShortBalance)

        const vaultCounter = BigNumber.from(await controllerProxy.getAccountVaultCounter(accountOwner1.address))
        assert.isAbove(vaultCounter.toNumber(), 0, 'Account owner have no vault')

        const shortOtokenToBurn = BigNumber.from(await shortOtoken.balanceOf(accountOwner1.address))
        const actionArgs = [
          {
            actionType: ActionType.BurnShortOption,
            owner: accountOwner1.address,
            secondAddress: accountOperator1.address,
            asset: shortOtoken.address,
            vaultId: vaultCounter.toNumber(),
            amount: shortOtokenToBurn.toString(),
            index: '0',
            data: ZERO_ADDR,
          },
        ]

        await expectRevert(
          controllerProxy.connect(accountOperator1).operate(actionArgs),
          'ERC20: burn amount exceeds balance',
        )

        // transfer back
        await shortOtoken.connect(accountOwner1).transfer(accountOperator1.address, operatorShortBalance.toString())
      })

      it('should revert burning when called from an address other than account owner or operator', async () => {
        const vaultCounter = BigNumber.from(await controllerProxy.getAccountVaultCounter(accountOwner1.address))
        assert.isAbove(vaultCounter.toNumber(), 0, 'Account owner have no vault')

        const shortOtokenToBurn = BigNumber.from(await shortOtoken.balanceOf(accountOwner1.address))
        const actionArgs = [
          {
            actionType: ActionType.BurnShortOption,
            owner: accountOwner1.address,
            secondAddress: accountOwner1.address,
            asset: usdc.address,
            vaultId: vaultCounter.toNumber(),
            amount: shortOtokenToBurn.toString(),
            index: '1',
            data: ZERO_ADDR,
          },
        ]

        await expectRevert(controllerProxy.connect(random).operate(actionArgs), 'C6')
      })

      it('should revert minting short with invalid vault id', async () => {
        const vaultCounter = BigNumber.from('100')

        const shortOtokenToBurn = BigNumber.from(await shortOtoken.balanceOf(accountOperator1.address))
        const actionArgs = [
          {
            actionType: ActionType.BurnShortOption,
            owner: accountOwner1.address,
            secondAddress: accountOperator1.address,
            asset: shortOtoken.address,
            vaultId: vaultCounter.toNumber(),
            amount: shortOtokenToBurn.toString(),
            index: '0',
            data: ZERO_ADDR,
          },
        ]

        await expectRevert(controllerProxy.connect(accountOwner1).operate(actionArgs), 'C35')
      })

      it('should revert depositing long from an address that is not the msg.sender nor the owner account address', async () => {
        const vaultCounter = BigNumber.from(await controllerProxy.getAccountVaultCounter(accountOwner1.address))

        const shortOtokenToBurn = BigNumber.from(await shortOtoken.balanceOf(accountOperator1.address))
        const actionArgs = [
          {
            actionType: ActionType.BurnShortOption,
            owner: accountOwner1.address,
            secondAddress: random.address,
            asset: shortOtoken.address,
            vaultId: vaultCounter.toNumber(),
            amount: shortOtokenToBurn.toString(),
            index: '0',
            data: ZERO_ADDR,
          },
        ]

        await expectRevert(controllerProxy.connect(accountOperator1).operate(actionArgs), 'C25')
      })

      it('should burn short otoken when called from account operator', async () => {
        const vaultCounter = BigNumber.from(await controllerProxy.getAccountVaultCounter(accountOwner1.address))
        assert.isAbove(vaultCounter.toNumber(), 0, 'Account owner have no vault')

        const vaultBefore = await controllerProxy.getVault(accountOwner1.address, vaultCounter)

        const shortOtokenToBurn = BigNumber.from(await shortOtoken.balanceOf(accountOperator1.address))
        const actionArgs = [
          {
            actionType: ActionType.BurnShortOption,
            owner: accountOwner1.address,
            secondAddress: accountOperator1.address,
            asset: shortOtoken.address,
            vaultId: vaultCounter.toNumber(),
            amount: shortOtokenToBurn.toNumber(),
            index: '0',
            data: ZERO_ADDR,
          },
        ]
        const sellerBalanceBefore = BigNumber.from(await shortOtoken.balanceOf(accountOperator1.address))

        await controllerProxy.connect(accountOperator1).operate(actionArgs)

        const sellerBalanceAfter = BigNumber.from(await shortOtoken.balanceOf(accountOperator1.address))
        const vaultAfter = await controllerProxy.getVault(accountOwner1.address, vaultCounter)

        assert.equal(
          (sellerBalanceBefore.sub(sellerBalanceAfter)).toString(),
          shortOtokenToBurn.toString(),
          'Short otoken burned amount mismatch',
        )
        assert.equal(vaultAfter.shortOtokens.length, 1, 'Vault short otoken array length mismatch')
        assert.equal(
          vaultAfter.shortOtokens[0],
          shortOtoken.address,
          'Vault short otoken address after burning mismatch',
        )
        assert.equal(
          (vaultBefore.shortAmounts[0].sub(vaultAfter.shortAmounts[0])).toString(),
          shortOtokenToBurn.toString(),
          'Short otoken amount in vault after burn mismatch',
        )
      })

      it('should remove short otoken address from short otokens array if amount is equal to zero after burning', async () => {
        // send back all short otoken to owner
        const operatorShortBalance = BigNumber.from(await shortOtoken.balanceOf(accountOperator1.address))
        await shortOtoken.connect(accountOperator1).transfer(accountOwner1.address, operatorShortBalance)

        const vaultCounter = await controllerProxy.getAccountVaultCounter(accountOwner1.address)

        assert.isAbove(vaultCounter.toNumber(), 0, 'Account owner have no vault')

        const vaultBefore = await controllerProxy.getVault(accountOwner1.address, vaultCounter)

        const shortOtokenToBurn = vaultBefore.shortAmounts[0]
        const actionArgs = [
          {
            actionType: ActionType.BurnShortOption,
            owner: accountOwner1.address,
            secondAddress: accountOwner1.address,
            asset: shortOtoken.address,
            vaultId: vaultCounter.toNumber(),
            amount: shortOtokenToBurn.toNumber(),
            index: '0',
            data: ZERO_ADDR,
          },
        ]
        const sellerBalanceBefore = BigNumber.from(await shortOtoken.balanceOf(accountOwner1.address))

        await controllerProxy.connect(accountOwner1).operate(actionArgs)

        const sellerBalanceAfter = BigNumber.from(await shortOtoken.balanceOf(accountOwner1.address))
        const vaultAfter = await controllerProxy.getVault(accountOwner1.address, vaultCounter)

        assert.equal(
          (sellerBalanceBefore.sub(sellerBalanceAfter)).toString(),
          shortOtokenToBurn.toString(),
          'Short otoken burned amount mismatch',
        )
        assert.equal(vaultAfter.shortOtokens.length, 1, 'Vault short otoken array length mismatch')
        assert.equal(vaultAfter.shortOtokens[0], ZERO_ADDR, 'Vault short otoken address after clearing mismatch')
        assert.equal(
          (vaultBefore.shortAmounts[0].sub(vaultAfter.shortAmounts[0])).toString(),
          shortOtokenToBurn.toString(),
          'Short otoken amount in vault after burn mismatch',
        )
      })

      it('should mint and burn at the same transaction', async () => {
        const vaultCounter = BigNumber.from(
          await controllerProxy.getAccountVaultCounter(accountOwner1.address),
        ).add(1)
        
        const amountToMint = BigNumber.from(createScaledNumber(1))
        const actionArgs = [
          {
            actionType: ActionType.OpenVault,
            owner: accountOwner1.address,
            secondAddress: accountOwner1.address,
            asset: ZERO_ADDR,
            vaultId: vaultCounter.toNumber(),
            amount: '0',
            index: '0',
            data: ZERO_ADDR,
          },
          {
            actionType: ActionType.MintShortOption,
            owner: accountOwner1.address,
            secondAddress: accountOwner1.address,
            asset: shortOtoken.address,
            vaultId: vaultCounter.toNumber(),
            amount: amountToMint.toNumber(),
            index: '0',
            data: ZERO_ADDR,
          },
          {
            actionType: ActionType.BurnShortOption,
            owner: accountOwner1.address,
            secondAddress: accountOwner1.address,
            asset: shortOtoken.address,
            vaultId: vaultCounter.toNumber(),
            amount: amountToMint.toNumber(),
            index: '0',
            data: ZERO_ADDR,
          },
        ]
        const senderShortBalanceBefore = BigNumber.from(await shortOtoken.balanceOf(accountOwner1.address))

        await controllerProxy.connect(accountOwner1).operate(actionArgs)
        const senderShortBalanceAfter = BigNumber.from(await shortOtoken.balanceOf(accountOwner1.address))
        const vaultAfter = await controllerProxy.getVault(accountOwner1.address, vaultCounter)
        assert.equal(vaultAfter.shortOtokens.length, 1, 'Vault short otoken array length mismatch')
        assert.equal(vaultAfter.shortOtokens[0], ZERO_ADDR)
        assert.equal(
          senderShortBalanceBefore.toString(),
          senderShortBalanceAfter.toString(),
          'Sender short otoken amount mismatch',
        )
      })

      describe('Expired otoken', () => {
        let expiredShortOtoken: MockOtoken

        this.beforeAll('beforeall expired tokens', async () => {
          const vaultCounterBefore = BigNumber.from(await controllerProxy.getAccountVaultCounter(accountOwner1.address))
          const expiryTime = ethers.BigNumber.from(60 * 60) // after 1 hour
          const expiredShortOtokenDeployed = (await MockOtoken.deploy()) as MockOtoken
          expiredShortOtoken = await expiredShortOtokenDeployed.deployed()
          // init otoken
          await expiredShortOtoken.init(
            addressBook.address,
            weth.address,
            usdc.address,
            usdc.address,
            createTokenAmount(200),
            ethers.BigNumber.from(await getLatestTime()).add(expiryTime),
            true,
          )

          // whitelist otoken to be minted
          await whitelist.connect(owner).whitelistOtoken(expiredShortOtoken.address)
          await whitelist.connect(owner).whitelistCollateral(usdc.address)

          const collateralToDeposit = ethers.BigNumber.from(await expiredShortOtoken.strikePrice()).div(100)
          const amountToMint = createTokenAmount(1)
          const actionArgs = [
            {
              actionType: ActionType.OpenVault,
              owner: accountOwner1.address,
              secondAddress: accountOwner1.address,
              asset: ZERO_ADDR,
              vaultId: vaultCounterBefore.toNumber() + 1,
              amount: '0',
              index: '0',
              data: ZERO_ADDR,
            },
            {
              actionType: ActionType.MintShortOption,
              owner: accountOwner1.address,
              secondAddress: accountOwner1.address,
              asset: expiredShortOtoken.address,
              vaultId: vaultCounterBefore.toNumber() + 1,
              amount: amountToMint,
              index: '0',
              data: ZERO_ADDR,
            },
            {
              actionType: ActionType.DepositCollateral,
              owner: accountOwner1.address,
              secondAddress: accountOwner1.address,
              asset: usdc.address,
              vaultId: vaultCounterBefore.toNumber() + 1,
              amount: collateralToDeposit.toNumber(),
              index: '0',
              data: ZERO_ADDR,
            },
          ]

          const marginPoolBalanceBefore = BigNumber.from(await usdc.balanceOf(marginPool.address))
          const senderBalanceBefore = BigNumber.from(await usdc.balanceOf(accountOwner1.address))

          await usdc.connect(accountOwner1).approve(marginPool.address, collateralToDeposit.toString())
          await controllerProxy.connect(accountOwner1).operate(actionArgs)

          const marginPoolBalanceAfter = ethers.BigNumber.from(await usdc.balanceOf(marginPool.address))
          const senderBalanceAfter = ethers.BigNumber.from(await usdc.balanceOf(accountOwner1.address))

          assert.equal(
            marginPoolBalanceAfter.sub(marginPoolBalanceBefore).toString(),
            collateralToDeposit.toString(),
            'Margin pool collateral asset balance mismatch',
          )
          assert.equal(
            senderBalanceBefore.sub(senderBalanceAfter).toString(),
            collateralToDeposit.toString(),
            'Sender collateral asset balance mismatch',
          )
        })

        it('should revert burning an expired short otoken', async () => {
          // increment time after expiredLongOtoken expiry
          await ethers.provider.send('evm_increaseTime', [3601])
          await ethers.provider.send("evm_mine", []);
          // increase time with one hour in seconds

          const vaultId = BigNumber.from(await controllerProxy.getAccountVaultCounter(accountOwner1.address))
          const shortAmountToBurn = BigNumber.from('1')
          const actionArgs = [
            {
              actionType: ActionType.BurnShortOption,
              owner: accountOwner1.address,
              secondAddress: accountOwner1.address,
              asset: expiredShortOtoken.address,
              vaultId: vaultId.toNumber(),
              amount: shortAmountToBurn.toNumber(),
              index: '0',
              data: ZERO_ADDR,
            },
          ]

          assert.equal(
            await controllerProxy.hasExpired(expiredShortOtoken.address),
            true,
            'Long otoken is not expired yet',
          )

          await expectRevert(controllerProxy.connect(accountOwner1).operate(actionArgs), 'C26')
        })

        it('should revert minting an expired short otoken', async () => {
          const vaultCounter = ethers.BigNumber.from(
            await controllerProxy.getAccountVaultCounter(accountOwner1.address),
          )
          assert.isAbove(vaultCounter.toNumber(), 0, 'Account owner have no vault')

          const collateralToDeposit = ethers.BigNumber.from(await expiredShortOtoken.strikePrice()).div(100)
          const amountToMint = createTokenAmount(1)
          const actionArgs = [
            {
              actionType: ActionType.MintShortOption,
              owner: accountOwner1.address,
              secondAddress: accountOwner1.address,
              asset: expiredShortOtoken.address,
              vaultId: vaultCounter.toNumber(),
              amount: amountToMint,
              index: '0',
              data: ZERO_ADDR,
            },
            {
              actionType: ActionType.DepositCollateral,
              owner: accountOwner1.address,
              secondAddress: accountOwner1.address,
              asset: usdc.address,
              vaultId: vaultCounter.toNumber(),
              amount: collateralToDeposit.toNumber(),
              index: '0',
              data: ZERO_ADDR,
            },
          ]

          await usdc.connect(accountOperator1).approve(marginPool.address, collateralToDeposit.toString())
          await expectRevert(controllerProxy.connect(accountOwner1).operate(actionArgs), 'C24')
        })

        it('should revert withdraw collateral from a vault with an expired short otoken', async () => {
          const vaultCounter = BigNumber.from(
            await controllerProxy.getAccountVaultCounter(accountOwner1.address),
          )
          assert.isAbove(vaultCounter.toNumber(), 0, 'Account owner have no vault')

          const collateralToWithdraw = BigNumber.from(createTokenAmount(10, usdcDecimals))
          const actionArgs = [
            {
              actionType: ActionType.WithdrawCollateral,
              owner: accountOwner1.address,
              secondAddress: accountOwner1.address,
              asset: usdc.address,
              vaultId: vaultCounter.toNumber(),
              amount: collateralToWithdraw.toNumber(),
              index: '0',
              data: ZERO_ADDR,
            },
          ]

          await expectRevert(controllerProxy.connect(accountOwner1).operate(actionArgs), 'C22')
        })
      })
    })
  })

  describe('Redeem', async () => {
    let shortOtoken: MockOtoken
    let fakeOtoken: MockOtoken

    this.beforeAll('Before all hook redeem', async () => {
      const expiryTime = ethers.BigNumber.from(60 * 60 * 24) // after 1 day
      const shortOtokenDeployed = (await MockOtoken.deploy()) as MockOtoken
      shortOtoken = await shortOtokenDeployed.deployed()
      // init otoken
      await shortOtoken.init(
        addressBook.address,
        weth.address,
        usdc.address,
        usdc.address,
        createTokenAmount(200),
        ethers.BigNumber.from(await getLatestTime()).add(ethers.BigNumber.from(expiryTime)),
        true,
      )

      const fakeOtokenDeployed = (await MockOtoken.deploy()) as MockOtoken
      fakeOtoken = await fakeOtokenDeployed.deployed()
      // init otoken
      await fakeOtoken.init(
        addressBook.address,
        weth.address,
        usdc.address,
        usdc.address,
        createTokenAmount(200),
        ethers.BigNumber.from(await getLatestTime()).add(ethers.BigNumber.from(expiryTime)),
        true,
      )

      // whitelist short otoken to be used in the protocol
      await whitelist.connect(owner).whitelistOtoken(shortOtoken.address)
      // open new vault, mintnaked short, sell it to holder 1
      const vaultCounter = ethers.BigNumber.from(
        (await controllerProxy.getAccountVaultCounter(accountOwner1.address)).add(1),
      )
      const collateralToDeposit = ethers.BigNumber.from((await shortOtoken.strikePrice()).toString()).div(100)
      const amountToMint = createTokenAmount(1)
      const actionArgs = [
        {
          actionType: ActionType.OpenVault,
          owner: accountOwner1.address,
          secondAddress: accountOwner1.address,
          asset: ZERO_ADDR,
          vaultId: vaultCounter.toNumber(),
          amount: '0',
          index: '0',
          data: ZERO_ADDR,
        },
        {
          actionType: ActionType.MintShortOption,
          owner: accountOwner1.address,
          secondAddress: accountOwner1.address,
          asset: shortOtoken.address,
          vaultId: vaultCounter.toNumber(),
          amount: amountToMint,
          index: '0',
          data: ZERO_ADDR,
        },
        {
          actionType: ActionType.DepositCollateral,
          owner: accountOwner1.address,
          secondAddress: accountOwner1.address,
          asset: usdc.address,
          vaultId: vaultCounter.toNumber(),
          amount: collateralToDeposit.toNumber(),
          index: '0',
          data: ZERO_ADDR,
        },
      ]
      await usdc.connect(accountOwner1).approve(marginPool.address, collateralToDeposit.toString())
      await controllerProxy.connect(accountOwner1).operate(actionArgs)
      // transfer minted short otoken to hodler`
      await shortOtoken.connect(accountOwner1).transfer(holder1.address, amountToMint.toString())
    })
    it('should revert exercising non-whitelisted otoken', async () => {
      const shortAmountToBurn = BigNumber.from('1')
      const actionArgs = [
        {
          actionType: ActionType.Redeem,
          owner: ZERO_ADDR,
          secondAddress: holder1.address,
          asset: fakeOtoken.address,
          vaultId: '0',
          amount: shortAmountToBurn.toNumber(),
          index: '0',
          data: ZERO_ADDR,
        },
      ]

      await expectRevert(controllerProxy.connect(holder1).operate(actionArgs), 'C27')
    })

    it('should revert exercising un-expired otoken', async () => {
      const shortAmountToBurn = BigNumber.from('1')
      const actionArgs = [
        {
          actionType: ActionType.Redeem,
          owner: ZERO_ADDR,
          secondAddress: holder1.address,
          asset: shortOtoken.address,
          vaultId: '0',
          amount: shortAmountToBurn.toNumber(),
          index: '0',
          data: ZERO_ADDR,
        },
      ]

      assert.equal(await controllerProxy.hasExpired(shortOtoken.address), false, 'Short otoken has already expired')

      await expectRevert(controllerProxy.connect(holder1).operate(actionArgs), 'C28')
    })

    it('should revert exercising after expiry, when underlying price is not finalized yet', async () => {
      // past time after expiry
      await time.increase(60 * 61 * 24) // increase time with one hour in seconds
      // set price in Oracle Mock, 150$ at expiry, expire ITM
      await oracle.setExpiryPriceFinalizedAllPeiodOver(
        await shortOtoken.underlyingAsset(),
        (await shortOtoken.expiryTimestamp()).toString(),
        createTokenAmount(150),
        true,
      )
      // set it as not finalized in mock
      await oracle.setIsDisputePeriodOver(
        await shortOtoken.underlyingAsset(),
        (await shortOtoken.expiryTimestamp()).toString(),
        false,
      )

      await oracle.setExpiryPriceFinalizedAllPeiodOver(
        await shortOtoken.strikeAsset(),
        await shortOtoken.expiryTimestamp(),
        createTokenAmount(1),
        true,
      )

      const shortAmountToBurn = BigNumber.from('1')
      const actionArgs = [
        {
          actionType: ActionType.Redeem,
          owner: ZERO_ADDR,
          secondAddress: holder1.address,
          asset: shortOtoken.address,
          vaultId: '0',
          amount: shortAmountToBurn.toNumber(),
          index: '0',
          data: ZERO_ADDR,
        },
      ]

      assert.equal(await controllerProxy.hasExpired(shortOtoken.address), true, 'Short otoken is not expired yet')

      await expectRevert(controllerProxy.connect(holder1).operate(actionArgs), 'C29')
    })

    it('should revert exercising if cash value receiver address in equal to address zero', async () => {
      // set it as finalized in mock
      await oracle.setIsDisputePeriodOver(
        await shortOtoken.underlyingAsset(),
        await shortOtoken.expiryTimestamp(),
        true,
      )

      const shortAmountToBurn = createTokenAmount(1)
      const actionArgs = [
        {
          actionType: ActionType.Redeem,
          owner: ZERO_ADDR,
          secondAddress: ZERO_ADDR,
          asset: shortOtoken.address,
          vaultId: '0',
          amount: shortAmountToBurn,
          index: '0',
          data: ZERO_ADDR,
        },
      ]

      assert.equal(await controllerProxy.hasExpired(shortOtoken.address), true, 'Short otoken is not expired yet')

      await expectRevert(controllerProxy.connect(holder1).operate(actionArgs), 'A14')
    })

    it('should redeem after expiry + price is finalized', async () => {
      const shortAmountToBurn = createTokenAmount(1)
      const actionArgs = [
        {
          actionType: ActionType.Redeem,
          owner: ZERO_ADDR,
          secondAddress: holder1.address,
          asset: shortOtoken.address,
          vaultId: '0',
          amount: shortAmountToBurn,
          index: '0',
          data: ZERO_ADDR,
        },
      ]
      assert.equal(await controllerProxy.hasExpired(shortOtoken.address), true, 'Short otoken is not expired yet')

      const payout = createTokenAmount(50, usdcDecimals)
      const marginPoolBalanceBefore = BigNumber.from(await usdc.balanceOf(marginPool.address))
      const senderBalanceBefore = BigNumber.from(await usdc.balanceOf(holder1.address))
      const senderShortBalanceBefore = BigNumber.from(await shortOtoken.balanceOf(holder1.address))

      await controllerProxy.connect(holder1).operate(actionArgs)

      const marginPoolBalanceAfter = BigNumber.from(await usdc.balanceOf(marginPool.address))
      const senderBalanceAfter = BigNumber.from(await usdc.balanceOf(holder1.address))
      const senderShortBalanceAfter = BigNumber.from(await shortOtoken.balanceOf(holder1.address))

      assert.equal(
        marginPoolBalanceBefore.sub(marginPoolBalanceAfter).toString(),
        payout.toString(),
        'Margin pool collateral asset balance mismatch',
      )
      assert.equal(
        senderBalanceAfter.sub(senderBalanceBefore).toString(),
        payout.toString(),
        'Sender collateral asset balance mismatch',
      )
      assert.equal(
        senderShortBalanceBefore.sub(senderShortBalanceAfter).toString(),
        shortAmountToBurn.toString(),
        ' Burned short otoken amount mismatch',
      )
    })

    it('should redeem call option correctly', async () => {
      const expiry = BigNumber.from(await getLatestTime())
        .add(BigNumber.from(60 * 60))
        .toNumber()

      const callDeployed: MockOtoken = (await MockOtoken.deploy()) as MockOtoken
      const call = await callDeployed.deployed()
      await call.init(
        addressBook.address,
        weth.address,
        usdc.address,
        weth.address,
        createTokenAmount(200),
        expiry,
        false,
      )

      await whitelist.connect(owner).whitelistOtoken(call.address)
      const vaultCounter = BigNumber.from(await controllerProxy.getAccountVaultCounter(accountOwner1.address)).add(1)
      const amountCollateral = createTokenAmount(1, wethDecimals)
      await weth.mint(accountOwner1.address, amountCollateral)
      await weth.connect(accountOwner1).approve(marginPool.address, amountCollateral)
      const amountOtoken = createTokenAmount(1)
      const actionArgs = [
        {
          actionType: ActionType.OpenVault,
          owner: accountOwner1.address,
          secondAddress: accountOwner1.address,
          asset: ZERO_ADDR,
          vaultId: vaultCounter.toNumber(),
          amount: '0',
          index: '0',
          data: ZERO_ADDR,
        },
        {
          actionType: ActionType.DepositCollateral,
          owner: accountOwner1.address,
          secondAddress: accountOwner1.address,
          asset: weth.address,
          vaultId: vaultCounter.toNumber(),
          amount: amountCollateral,
          index: '0',
          data: ZERO_ADDR,
        },
        {
          actionType: ActionType.MintShortOption,
          owner: accountOwner1.address,
          secondAddress: accountOwner1.address,
          asset: call.address,
          vaultId: vaultCounter.toNumber(),
          amount: amountOtoken,
          index: '0',
          data: ZERO_ADDR,
        },
      ]

      await controllerProxy.connect(accountOwner1).operate(actionArgs)
      await call.connect(accountOwner1).transfer(holder1.address, amountOtoken)

      await ethers.provider.send('evm_increaseTime', [expiry + 10])
      await oracle.setExpiryPriceFinalizedAllPeiodOver(weth.address, expiry, createTokenAmount(400), true)
      await oracle.setExpiryPriceFinalizedAllPeiodOver(usdc.address, expiry, createTokenAmount(1), true)
      const redeemArgs = [
        {
          actionType: ActionType.Redeem,
          owner: ZERO_ADDR,
          secondAddress: holder1.address,
          asset: call.address,
          vaultId: '0',
          amount: amountOtoken,
          index: '0',
          data: ZERO_ADDR,
        },
      ]

      const expectedPayout = createTokenAmount(0.5, wethDecimals)

      const userBalanceBefore = BigNumber.from(await weth.balanceOf(holder1.address))
      await controllerProxy.connect(holder1).operate(redeemArgs)
      const userBalanceAfter = BigNumber.from(await weth.balanceOf(holder1.address))
      assert.equal(userBalanceAfter.sub(userBalanceBefore).toString(), expectedPayout)
    })

    it('should revert redeem option if collateral is different from underlying, and collateral price is not finalized', async () => {
      const expiry = BigNumber.from(await getLatestTime()).add(60 * 60)
   
      await whitelist.connect(owner).whitelistCollateral(weth2.address)
      
      let call: MockOtoken = await MockOtoken.deploy() as MockOtoken
      
      call = await call.deployed()
      await call.init(
        addressBook.address,
        weth.address,
        usdc.address,
        weth2.address,
        BigNumber.from(createTokenAmount(200)),
        expiry,
        false,
      )

      await oracle.setRealTimePrice(weth.address, BigNumber.from(createTokenAmount(400)))
     
      await oracle.setRealTimePrice(weth2.address, BigNumber.from(createTokenAmount(400)))
      
      await whitelist.connect(owner).whitelistOtoken(call.address)
     
      const vaultCounter = BigNumber.from(await controllerProxy.getAccountVaultCounter(accountOwner1.address)).add(1)
  
      const amountCollateral = BigNumber.from(createTokenAmount(1, wethDecimals))
      
      await weth2.mint(accountOwner1.address, amountCollateral)
     
      await weth2.connect(accountOwner1).approve(marginPool.address, amountCollateral)
      
    

      const amountOtoken = BigNumber.from(createTokenAmount(1))
      
      const actionArgs = [
        {
          actionType: ActionType.OpenVault,
          owner: accountOwner1.address,
          secondAddress: accountOwner1.address,
          asset: ZERO_ADDR,
          vaultId: vaultCounter.toNumber(),
          amount: '0',
          index: '0',
          data: ZERO_ADDR,
        },
        {
          actionType: ActionType.MintShortOption,
          owner: accountOwner1.address,
          secondAddress: accountOwner1.address,
          asset: call.address,
          vaultId: vaultCounter.toNumber(),
          amount: amountOtoken,
          index: '0',
          data: ZERO_ADDR,
        },
        {
          actionType: ActionType.DepositCollateral,
          owner: accountOwner1.address,
          secondAddress: accountOwner1.address,
          asset: weth2.address,
          vaultId: vaultCounter.toNumber(),
          amount: amountCollateral,
          index: '0',
          data: ZERO_ADDR,
        },
      ]
    
      await controllerProxy.connect(accountOwner1).operate(actionArgs)
     
      await call.connect(accountOwner1).transfer(holder1.address, amountOtoken)
    
      
      await ethers.provider.send("evm_increaseTime", [(expiry.toNumber() + 10)])
      
      await ethers.provider.send("evm_mine", [])
      
      await oracle.setExpiryPriceFinalizedAllPeiodOver(weth.address, expiry, BigNumber.from(createTokenAmount(400)), true)
      
      await oracle.setExpiryPriceFinalizedAllPeiodOver(usdc.address, expiry, BigNumber.from(createTokenAmount(1)), true)

      const redeemArgs = [
        {
          actionType: ActionType.Redeem,
          owner: ZERO_ADDR,
          secondAddress: holder1.address,
          asset: call.address,
          vaultId: '0',
          amount: amountOtoken.toNumber(),
          index: '0',
          data: ZERO_ADDR,
        },
      ]
     
      
      await expectRevert(controllerProxy.connect(holder1).operate(redeemArgs), 'C29')
    })

    describe('Redeem multiple Otokens', async () => {
      let firstOtoken: MockOtoken
      let secondOtoken: MockOtoken

      this.beforeAll('Redeem otoken before all hook', async () => {
        const expiryTime = BigNumber.from(60 * 60 * 24) // after 1 day

        const firstOtokenDeployed = (await MockOtoken.deploy()) as MockOtoken
        const secondOtokenDeployed = (await MockOtoken.deploy()) as MockOtoken

        firstOtoken = await firstOtokenDeployed.deployed()
        secondOtoken = await secondOtokenDeployed.deployed()

        const expiry = ethers.BigNumber.from(await getLatestTime()).add(expiryTime)
        // init otoken
        await firstOtoken.init(
          addressBook.address,
          weth.address,
          usdc.address,
          usdc.address,
          createTokenAmount(200),
          expiry.toString(),
          true,
        )
        await secondOtoken.init(
          addressBook.address,
          weth.address,
          usdc.address,
          usdc.address,
          createTokenAmount(200),
          expiry.toString(),
          true,
        )
        // whitelist otoken to be used in the protocol
        await whitelist.connect(owner).whitelistOtoken(firstOtoken.address)
        await whitelist.connect(owner).whitelistOtoken(secondOtoken.address)

        // open new vault, mint naked short, sell it to holder 1
        const firstCollateralToDeposit = BigNumber.from(await firstOtoken.strikePrice()).div(100)
        const secondCollateralToDeposit = BigNumber.from(await secondOtoken.strikePrice()).div(100)
        const amountToMint = createTokenAmount(1)
        let vaultCounter = BigNumber.from(await controllerProxy.getAccountVaultCounter(accountOwner1.address)).add(1)
        let actionArgs = [
          {
            actionType: ActionType.OpenVault,
            owner: accountOwner1.address,
            secondAddress: accountOwner1.address,
            asset: ZERO_ADDR,
            vaultId: vaultCounter.toNumber(),
            amount: '0',
            index: '0',
            data: ZERO_ADDR,
          },
          {
            actionType: ActionType.MintShortOption,
            owner: accountOwner1.address,
            secondAddress: accountOwner1.address,
            asset: firstOtoken.address,
            vaultId: vaultCounter.toNumber(),
            amount: amountToMint,
            index: '0',
            data: ZERO_ADDR,
          },
          {
            actionType: ActionType.DepositCollateral,
            owner: accountOwner1.address,
            secondAddress: accountOwner1.address,
            asset: usdc.address,
            vaultId: vaultCounter.toNumber(),
            amount: firstCollateralToDeposit.toNumber(),
            index: '0',
            data: ZERO_ADDR,
          },
        ]
        await usdc.connect(accountOwner1).approve(marginPool.address, firstCollateralToDeposit.toString())
        await controllerProxy.connect(accountOwner1).operate(actionArgs)

        vaultCounter = BigNumber.from(await controllerProxy.getAccountVaultCounter(accountOwner1.address)).add(1)
        actionArgs = [
          {
            actionType: ActionType.OpenVault,
            owner: accountOwner1.address,
            secondAddress: accountOwner1.address,
            asset: ZERO_ADDR,
            vaultId: vaultCounter.toNumber(),
            amount: '0',
            index: '0',
            data: ZERO_ADDR,
          },
          {
            actionType: ActionType.MintShortOption,
            owner: accountOwner1.address,
            secondAddress: accountOwner1.address,
            asset: secondOtoken.address,
            vaultId: vaultCounter.toNumber(),
            amount: amountToMint,
            index: '0',
            data: ZERO_ADDR,
          },
          {
            actionType: ActionType.DepositCollateral,
            owner: accountOwner1.address,
            secondAddress: accountOwner1.address,
            asset: usdc.address,
            vaultId: vaultCounter.toNumber(),
            amount: secondCollateralToDeposit.toNumber(),
            index: '0',
            data: ZERO_ADDR,
          },
        ]
        await usdc.connect(accountOwner1).approve(marginPool.address, firstCollateralToDeposit.toString())
        await controllerProxy.connect(accountOwner1).operate(actionArgs)
        // transfer minted short otoken to hodler
        await firstOtoken.connect(accountOwner1).transfer(holder1.address, amountToMint)
        await secondOtoken.connect(accountOwner1).transfer(holder1.address, amountToMint)
      })

      it('should redeem multiple Otokens in one transaction', async () => {
        // past time after expiry

        await ethers.provider.send('evm_increaseTime', [60 * 60 * 24])
        // set price in Oracle Mock, 150$ at expiry, expire ITM
        await oracle.setExpiryPriceFinalizedAllPeiodOver(
          await firstOtoken.underlyingAsset(),
          await firstOtoken.expiryTimestamp(),
          createTokenAmount(150),
          true,
        )
        await oracle.setExpiryPriceFinalizedAllPeiodOver(
          await secondOtoken.underlyingAsset(),
          await secondOtoken.expiryTimestamp(),
          createTokenAmount(150),
          true,
        )

        await oracle.setExpiryPriceFinalizedAllPeiodOver(
          await firstOtoken.strikeAsset(),
          await firstOtoken.expiryTimestamp(),
          createTokenAmount(1),
          true,
        )
        await oracle.setExpiryPriceFinalizedAllPeiodOver(
          await secondOtoken.strikeAsset(),
          await firstOtoken.expiryTimestamp(),
          createTokenAmount(1),
          true,
        )

        const amountToRedeem = createTokenAmount(1)
        const actionArgs = [
          {
            actionType: ActionType.Redeem,
            owner: ZERO_ADDR,
            secondAddress: holder1.address,
            asset: firstOtoken.address,
            vaultId: '0',
            amount: amountToRedeem,
            index: '0',
            data: ZERO_ADDR,
          },
          {
            actionType: ActionType.Redeem,
            owner: ZERO_ADDR,
            secondAddress: holder1.address,
            asset: secondOtoken.address,
            vaultId: '0',
            amount: amountToRedeem,
            index: '0',
            data: ZERO_ADDR,
          },
        ]

        const payout = createTokenAmount(100, usdcDecimals)
        const marginPoolBalanceBefore = BigNumber.from(await usdc.balanceOf(marginPool.address))
        const senderBalanceBefore = BigNumber.from(await usdc.balanceOf(holder1.address))

        await controllerProxy.connect(holder1).operate(actionArgs)

        const marginPoolBalanceAfter = BigNumber.from(await usdc.balanceOf(marginPool.address))
        const senderBalanceAfter = BigNumber.from(await usdc.balanceOf(holder1.address))
        const senderFirstBalanceAfter = BigNumber.from(await firstOtoken.balanceOf(holder1.address))
        const senderSecondBalanceAfter = BigNumber.from(await secondOtoken.balanceOf(holder1.address))

        assert.equal(
          marginPoolBalanceBefore.sub(marginPoolBalanceAfter).toString(),
          payout.toString(),
          'Margin pool collateral asset balance mismatch',
        )
        assert.equal(
          senderBalanceAfter.sub(senderBalanceBefore).toString(),
          payout.toString(),
          'Sender collateral asset balance mismatch',
        )
        assert.equal(senderFirstBalanceAfter.toString(), '0', ' Burned first otoken amount mismatch')
        assert.equal(senderSecondBalanceAfter.toString(), '0', ' Burned first otoken amount mismatch')
      })
    })
  })

  describe('Settle vault', async () => {
    let shortOtoken: MockOtoken

    this.beforeAll('before all hook settle vault', async () => {
      const expiryTime = (60 * 60 * 24) // after 1 day
      shortOtoken = await MockOtoken.deploy() as MockOtoken
      shortOtoken = await shortOtoken.deployed()
      // init otoken
      await shortOtoken.init(
        addressBook.address,
        weth.address,
        usdc.address,
        usdc.address,
        createTokenAmount(200),
        BigNumber.from(await getLatestTime() + expiryTime).toNumber(),
        true,
      )

    

      // whitelist otoken to be used in the protocol
      await whitelist.connect(owner).whitelistOtoken(shortOtoken.address)
      // open new vault, mint naked short, sell it to holder 1
      const collateralToDespoit = BigNumber.from(await shortOtoken.strikePrice()).div(100)
      const vaultCounter = BigNumber.from(await controllerProxy.getAccountVaultCounter(accountOwner1.address)).add(1)
      const actionArgs = [
        {
          actionType: ActionType.OpenVault,
          owner: accountOwner1.address,
          secondAddress: accountOwner1.address,
          asset: ZERO_ADDR,
          vaultId: vaultCounter.toNumber(),
          amount: '0',
          index: '0',
          data: ZERO_ADDR,
        },
        {
          actionType: ActionType.DepositCollateral,
          owner: accountOwner1.address,
          secondAddress: accountOwner1.address,
          asset: usdc.address,
          vaultId: vaultCounter.toNumber(),
          amount: collateralToDespoit.toNumber(),
          index: '0',
          data: ZERO_ADDR,
        },
      ]
      await usdc.connect(accountOwner1).approve(marginPool.address, collateralToDespoit.toString())
      await controllerProxy.connect(accountOwner1).operate(actionArgs)
    })

    it('should revert settling a vault that have no long or short otoken', async () => {
      const vaultCounter = BigNumber.from(await controllerProxy.getAccountVaultCounter(accountOwner1.address))
      const actionArgs = [
        {
          actionType: ActionType.SettleVault,
          owner: accountOwner1.address,
          secondAddress: accountOwner1.address,
          asset: shortOtoken.address,
          vaultId: vaultCounter.toNumber(),
          amount: 0,
          index: '0',
          data: ZERO_ADDR,
        },
      ]

      await expectRevert(controllerProxy.connect(accountOwner1).operate(actionArgs), 'C30')
    })

    it('should revert settling vault before expiry', async () => {
      // mint token in vault before
      const amountToMint = BigNumber.from(createTokenAmount(1))
      let vaultCounter = BigNumber.from(await controllerProxy.getAccountVaultCounter(accountOwner1.address))
      
      let actionArgs = [
        {
          actionType: ActionType.MintShortOption,
          owner: accountOwner1.address,
          secondAddress: accountOwner1.address,
          asset: shortOtoken.address,
          vaultId: vaultCounter.toNumber(),
          amount: amountToMint,
          index: '0',
          data: ZERO_ADDR,
        },
      ]
      await controllerProxy.connect(accountOwner1).operate(actionArgs)
      await shortOtoken.connect(accountOwner1).transfer(holder1.address, amountToMint)

      vaultCounter = BigNumber.from(await controllerProxy.getAccountVaultCounter(accountOwner1.address))
      let actionArgs2 = [
        {
          actionType: ActionType.SettleVault,
          owner: accountOwner1.address,
          secondAddress: accountOwner1.address,
          asset: shortOtoken.address,
          vaultId: vaultCounter.toNumber(),
          amount: '0',
          index: '0',
          data: ZERO_ADDR,
        },
      ]

      await expectRevert(controllerProxy.connect(accountOwner1).operate(actionArgs2), 'C31')
    })

    it('should revert settling an invalid vault', async () => {
      const vaultCounter = BigNumber.from(await controllerProxy.getAccountVaultCounter(accountOwner1.address))
      const actionArgs = [
        {
          actionType: ActionType.SettleVault,
          owner: accountOwner1.address,
          secondAddress: accountOwner1.address,
          asset: shortOtoken.address,
          vaultId: vaultCounter.add(10000).toNumber(),
          amount: '0',
          index: '0',
          data: ZERO_ADDR,
        },
      ]

      await expectRevert(controllerProxy.connect(accountOwner1).operate(actionArgs), 'C35')
    })

    it('should revert settling after expiry when price is not finalized', async () => {
      // past time after expiry
      await time.increase(60 * 61 * 24) // increase time with one hour in seconds
      // set price in Oracle Mock, 150$ at expiry, expire ITM
      const expiry = BigNumber.from(await shortOtoken.expiryTimestamp())
      await oracle.setExpiryPriceFinalizedAllPeiodOver(weth.address, expiry.toString(), createTokenAmount(150), true)
      // set it as not finalized in mock
      await oracle.setIsFinalized(await shortOtoken.underlyingAsset(), await shortOtoken.expiryTimestamp(), false)
      await oracle.setIsDisputePeriodOver(
        await shortOtoken.underlyingAsset(),
        await shortOtoken.expiryTimestamp(),
        false,
      )

      const vaultCounter = BigNumber.from(await controllerProxy.getAccountVaultCounter(accountOwner1.address))
      const actionArgs = [
        {
          actionType: ActionType.SettleVault,
          owner: accountOwner1.address,
          secondAddress: accountOwner1.address,
          asset: shortOtoken.address,
          vaultId: vaultCounter.toNumber(),
          amount: '0',
          index: '0',
          data: ZERO_ADDR,
        },
      ]

      assert.equal(await controllerProxy.hasExpired(shortOtoken.address), true, 'Short otoken is not expired yet')

      await expectRevert(controllerProxy.connect(accountOwner1).operate(actionArgs), 'C29')
    })

    it('should settle ITM otoken after expiry + price is finalized', async () => {
      const expiry = await shortOtoken.expiryTimestamp()
      await oracle.setExpiryPriceFinalizedAllPeiodOver(weth.address, expiry, BigNumber.from(createTokenAmount(150)), true)
      await oracle.setExpiryPriceFinalizedAllPeiodOver(usdc.address, expiry, BigNumber.from(createTokenAmount(1)), true)
      const vaultCounter = BigNumber.from(await controllerProxy.getAccountVaultCounter(accountOwner1.address))
      
     
      
      const actionArgs = [
        {
          actionType: ActionType.SettleVault,
          owner: accountOwner1.address,
          secondAddress: accountOwner1.address,
          asset: shortOtoken.address,
          vaultId: vaultCounter.toNumber(),
          amount: '0',
          index: '0',
          data: ZERO_ADDR,
        },
      ]

      const payout = BigNumber.from(createTokenAmount(150, usdcDecimals))
      const marginPoolBalanceBefore = BigNumber.from(await usdc.balanceOf(marginPool.address))
      const senderBalanceBefore = BigNumber.from(await usdc.balanceOf(accountOwner1.address))
      const proceed = await controllerProxy.getProceed(accountOwner1.address, vaultCounter)

      assert.equal(payout.toString(), proceed.toString())

      await controllerProxy.connect(accountOwner1).operate(actionArgs)

      const marginPoolBalanceAfter = BigNumber.from(await usdc.balanceOf(marginPool.address))
      const senderBalanceAfter = BigNumber.from(await usdc.balanceOf(accountOwner1.address))

      assert.equal(
        (marginPoolBalanceBefore.sub(marginPoolBalanceAfter)).toString(),
        payout.toString(),
        'Margin pool collateral asset balance mismatch',
      )
      assert.equal(
        (senderBalanceAfter.sub(senderBalanceBefore)).toString(),
        payout.toString(),
        'Sender collateral asset balance mismatch',
      )
    })

    it('should settle vault with only long otokens in it', async () => {
      const stirkePrice = 250
      const expiry = (await getLatestTime() + 86400)
      let longOtoken: MockOtoken
      longOtoken = (await MockOtoken.deploy()) as MockOtoken
      longOtoken = await longOtoken.deployed()
      // create a new otoken
      await longOtoken.init(
        addressBook.address,
        weth.address,
        usdc.address,
        usdc.address,
        BigNumber.from(createScaledNumber(stirkePrice)),
        expiry,
        true,
      )

      await whitelist.connect(owner).whitelistOtoken(longOtoken.address)

      // mint some long otokens, (so we can put it as long)
      const vaultCounter = BigNumber.from(
        await controllerProxy.getAccountVaultCounter(accountOwner1.address),
      ).add(1)
      const longAmount = BigNumber.from(createTokenAmount(1))
      const collateralAmount = BigNumber.from(createTokenAmount(stirkePrice, usdcDecimals))
      const mintArgs = [
        {
          actionType: ActionType.OpenVault,
          owner: accountOwner1.address,
          secondAddress: accountOwner1.address,
          asset: ZERO_ADDR,
          vaultId: vaultCounter.toNumber(),
          amount: '0',
          index: '0',
          data: ZERO_ADDR,
        },
        {
          actionType: ActionType.MintShortOption,
          owner: accountOwner1.address,
          secondAddress: accountOwner1.address,
          asset: longOtoken.address,
          vaultId: vaultCounter.toNumber(),
          amount: longAmount,
          index: '0',
          data: ZERO_ADDR,
        },
        {
          actionType: ActionType.DepositCollateral,
          owner: accountOwner1.address,
          secondAddress: accountOwner1.address,
          asset: usdc.address,
          vaultId: vaultCounter.toNumber(),
          amount: collateralAmount,
          index: '0',
          data: ZERO_ADDR,
        },
      ]
      await usdc.connect(accountOwner1).approve(marginPool.address, collateralAmount)
      await controllerProxy.connect(accountOwner1).operate(mintArgs)

      // Use the newly minted otoken as long and put it in a new vault
      const newVaultId = vaultCounter.toNumber() + 1

      const newVaultArgs = [
        {
          actionType: ActionType.OpenVault,
          owner: accountOwner1.address,
          secondAddress: accountOwner1.address,
          asset: ZERO_ADDR,
          vaultId: newVaultId,
          amount: '0',
          index: '0',
          data: ZERO_ADDR,
        },
        {
          actionType: ActionType.DepositLongOption,
          owner: accountOwner1.address,
          secondAddress: accountOwner1.address,
          asset: longOtoken.address,
          vaultId: newVaultId,
          amount: longAmount,
          index: '0',
          data: ZERO_ADDR,
        },
      ]
      await longOtoken.connect(accountOwner1).approve(marginPool.address, longAmount)
      await whitelist.connect(owner).whitelistOtoken(longOtoken.address)
      await controllerProxy.connect(accountOwner1).operate(newVaultArgs)
      // go to expiry
  

      await ethers.provider.send("evm_increaseTime", [expiry + 10])
      await ethers.provider.send("evm_mine", []);
      const ethPriceAtExpiry = 200
      await oracle.setExpiryPriceFinalizedAllPeiodOver(usdc.address, expiry, 
        BigNumber.from(createScaledNumber(1)), true)
      await oracle.setExpiryPriceFinalizedAllPeiodOver(
        weth.address,
        expiry.toString(),
        createScaledNumber(ethPriceAtExpiry),
        true,
      )
      // settle the secont vault (with only long otoken in it)
      const settleArgs = [
        {
          actionType: ActionType.SettleVault,
          owner: accountOwner1.address,
          secondAddress: accountOwner1.address,
          asset: ZERO_ADDR,
          vaultId: newVaultId,
          amount: '0',
          index: '0',
          data: ZERO_ADDR,
        },
      ]
      const expectedPayout = BigNumber.from(createTokenAmount(stirkePrice - ethPriceAtExpiry, 
        usdcDecimals))
      const ownerUSDCBalanceBefore = BigNumber.from(await usdc.balanceOf(accountOwner1.address))
      const poolOtokenBefore = BigNumber.from(await longOtoken.balanceOf(marginPool.address))

      const amountPayout = await controllerProxy.getProceed(accountOwner1.address, newVaultId)

      assert.equal(amountPayout.toString(), expectedPayout.toString(), 'payout calculation mismatch')

      await controllerProxy.connect(accountOwner1).operate(settleArgs)
      const ownerUSDCBalanceAfter = BigNumber.from(await usdc.balanceOf(accountOwner1.address))
      const poolOtokenAfter = BigNumber.from(await longOtoken.balanceOf(marginPool.address))
      assert.equal(
        ownerUSDCBalanceAfter.toString(),
        (ownerUSDCBalanceBefore.add(amountPayout)).toString(),
        'settle long vault payout mismatch',
      )
      assert.equal(
        poolOtokenAfter.toString(),
        (poolOtokenBefore.sub(longAmount)).toString(),
        'settle long vault otoken mismatch',
      )

    })

      describe('Settle multiple vaults ATM and OTM', async () => {
        let firstShortOtoken: MockOtoken
        let secondShortOtoken: MockOtoken

        this.beforeAll('Before all settle multiple vaults', async () => {
          let expiryTime = (60 * 60 * 24) // after 1 day
          firstShortOtoken = (await MockOtoken.deploy()) as MockOtoken
          firstShortOtoken = await firstShortOtoken.deployed()
          await firstShortOtoken.init(
            addressBook.address,
            weth.address,
            usdc.address,
            usdc.address,
            BigNumber.from(createTokenAmount(200)).toNumber(),
            (await getLatestTime() + (expiryTime)),
            true,
          )
          // whitelist otoken to be used in the protocol
          await whitelist.connect(owner).whitelistOtoken(firstShortOtoken.address)
          // open new vault, mint naked short, sell it to holder 1
          let collateralToDespoit = BigNumber.from(createTokenAmount(200, usdcDecimals))
          let amountToMint = BigNumber.from(createTokenAmount(1))
          let vaultCounter = BigNumber.from(await controllerProxy.getAccountVaultCounter(accountOwner1.address)).add(1)
          let actionArgs = [
            {
              actionType: ActionType.OpenVault,
              owner: accountOwner1.address,
              secondAddress: accountOwner1.address,
              asset: ZERO_ADDR,
              vaultId: vaultCounter.toNumber(),
              amount: '0',
              index: '0',
              data: ZERO_ADDR,
            },
            {
              actionType: ActionType.MintShortOption,
              owner: accountOwner1.address,
              secondAddress: accountOwner1.address,
              asset: firstShortOtoken.address,
              vaultId: vaultCounter.toNumber(),
              amount: amountToMint.toNumber(),
              index: '0',
              data: ZERO_ADDR,
            },
            {
              actionType: ActionType.DepositCollateral,
              owner: accountOwner1.address,
              secondAddress: accountOwner1.address,
              asset: usdc.address,
              vaultId: vaultCounter.toNumber(),
              amount: collateralToDespoit.toNumber(),
              index: '0',
              data: ZERO_ADDR,
            },
          ]
          await usdc.connect(accountOwner1).approve(marginPool.address, collateralToDespoit)
          await controllerProxy.connect(accountOwner1).operate(actionArgs)

          expiryTime = (60 * 60 * 24 * 2) // after 1 day
          secondShortOtoken = (await MockOtoken.deploy()) as MockOtoken
          secondShortOtoken = await secondShortOtoken.deployed()
          await secondShortOtoken.init(
            addressBook.address,
            weth.address,
            usdc.address,
            usdc.address,
            BigNumber.from(createTokenAmount(200)),
            (await getLatestTime() + expiryTime),
            true,
          )
          // whitelist otoken to be used in the protocol
          await whitelist.connect(owner).whitelistOtoken(secondShortOtoken.address)
          // open new vault, mint naked short, sell it to holder 1
          collateralToDespoit = BigNumber.from(createTokenAmount(200, usdcDecimals))
          amountToMint = BigNumber.from(createTokenAmount(1))
          vaultCounter = BigNumber.from(await controllerProxy.getAccountVaultCounter(accountOwner1.address)).add(1)
          actionArgs = [
            {
              actionType: ActionType.OpenVault,
              owner: accountOwner1.address,
              secondAddress: accountOwner1.address,
              asset: ZERO_ADDR,
              vaultId: vaultCounter.toNumber(),
              amount: '0',
              index: '0',
              data: ZERO_ADDR,
            },
            {
              actionType: ActionType.MintShortOption,
              owner: accountOwner1.address,
              secondAddress: accountOwner1.address,
              asset: secondShortOtoken.address,
              vaultId: vaultCounter.toNumber(),
              amount: amountToMint.toNumber(),
              index: '0',
              data: ZERO_ADDR,
            },
            {
              actionType: ActionType.DepositCollateral,
              owner: accountOwner1.address,
              secondAddress: accountOwner1.address,
              asset: usdc.address,
              vaultId: vaultCounter.toNumber(),
              amount: collateralToDespoit.toNumber(),
              index: '0',
              data: ZERO_ADDR,
            },
          ]
          await usdc.connect(accountOwner1).approve(marginPool.address, collateralToDespoit)
          await controllerProxy.connect(accountOwner1).operate(actionArgs)
        })

        it('should settle multiple vaults in one transaction (ATM,OTM)', async () => {
          let timeToAdd = (await secondShortOtoken.expiryTimestamp()).toNumber() + 1000
          ethers.provider.send('evm_increaseTime',[timeToAdd])
          ethers.provider.send("evm_mine", []);
          const expiry = BigNumber.from(await firstShortOtoken.expiryTimestamp())


          const expiry2 = BigNumber.from(await secondShortOtoken.expiryTimestamp())
          await oracle.setExpiryPriceFinalizedAllPeiodOver(
            weth.address,
            expiry,
            BigNumber.from(createTokenAmount(200)),
            true,
          )
          await oracle.setExpiryPriceFinalizedAllPeiodOver(usdc.address, expiry, 
            BigNumber.from(createTokenAmount(1)), true)
          await oracle.setExpiryPriceFinalizedAllPeiodOver(
            weth.address,
            expiry2,
            BigNumber.from(createTokenAmount(200)),
            true,
          )
          await oracle.setExpiryPriceFinalizedAllPeiodOver(usdc.address, expiry2, 
            BigNumber.from(createTokenAmount(1)), true)
          
            const vaultCounter = BigNumber.from(await controllerProxy.getAccountVaultCounter(accountOwner1.address))
          const actionArgs = [
            {
              actionType: ActionType.SettleVault,
              owner: accountOwner1.address,
              secondAddress: accountOwner1.address,
              asset: secondShortOtoken.address,
              vaultId: vaultCounter.toNumber(),
              amount: '0',
              index: '0',
              data: ZERO_ADDR,
            },
            {
              actionType: ActionType.SettleVault,
              owner: accountOwner1.address,
              secondAddress: accountOwner1.address,
              asset: firstShortOtoken.address,
              vaultId: (vaultCounter.sub(1)).toNumber(),
              amount: '0',
              index: '0',
              data: ZERO_ADDR,
            },
          ]

          const payout = BigNumber.from(createTokenAmount(400, usdcDecimals))
          const marginPoolBalanceBefore = BigNumber.from(await usdc.balanceOf(marginPool.address))
          const senderBalanceBefore = BigNumber.from(await usdc.balanceOf(accountOwner1.address))

          controllerProxy.connect(accountOwner1).operate(actionArgs)

          const marginPoolBalanceAfter = BigNumber.from(await usdc.balanceOf(marginPool.address))
          const senderBalanceAfter = BigNumber.from(await usdc.balanceOf(accountOwner1.address))

          assert.equal(
            (marginPoolBalanceBefore.sub(marginPoolBalanceAfter)).toString(),
            payout.toString(),
            'Margin pool collateral asset balance mismatch',
          )
          assert.equal(
            (senderBalanceAfter.sub(senderBalanceBefore)).toString(),
            payout.toString(),
            'Sender collateral asset balance mismatch',
          )
        })
      })
    })

    describe('Check if price is finalized', async () => {
      let expiredOtoken: MockOtoken
      let expiry: any

      this.beforeAll('before all check for price', async () => {
        expiry = ethers.BigNumber.from(await getLatestTime())
        const expiredOtokenDeployed = (await MockOtoken.deploy()) as MockOtoken
        expiredOtoken = await expiredOtokenDeployed.deployed()
        // init otoken
        await expiredOtoken.init(
          addressBook.address,
          weth.address,
          usdc.address,
          usdc.address,
          createTokenAmount(200),
          ethers.BigNumber.from(await getLatestTime()),
          true,
        )

        // set finalized
        await oracle.setIsFinalized(weth.address, expiry.toString(), true)
        await oracle.setIsDisputePeriodOver(weth.address, expiry.toString(), true)
      })

      it('should return false when price is pushed and dispute period not over yet', async () => {
        const priceMock = BigNumber.from('200')

        // Mock oracle returned data.
        await oracle.setIsLockingPeriodOver(weth.address, expiry.toString(), true)
        await oracle.setIsDisputePeriodOver(weth.address, expiry.toString(), false)
        await oracle.setExpiryPrice(weth.address, expiry.toString(), priceMock.toString())

        const underlying = await expiredOtoken.underlyingAsset()
        const strike = await expiredOtoken.strikeAsset()
        const collateral = await expiredOtoken.collateralAsset()
        const expiryTimestamp = await expiredOtoken.expiryTimestamp()

        const expectedResult = false
        assert.equal(
          await controllerProxy.canSettleAssets(underlying, strike, collateral, expiryTimestamp),
          expectedResult,
          'Price is not finalized because dispute period is not over yet',
        )
        assert.equal(
          await controllerProxy.isSettlementAllowed(expiredOtoken.address),
          expectedResult,
          'Price is not finalized',
        )
      })

      it('should return true when price is finalized', async () => {
        const expiredOtokenDeployed = (await MockOtoken.deploy()) as MockOtoken
        expiredOtoken = await expiredOtokenDeployed.deployed()
        const expiry = ethers.BigNumber.from(await getLatestTime())
        // init otoken
        await expiredOtoken.init(
          addressBook.address,
          weth.address,
          usdc.address,
          usdc.address,
          createTokenAmount(200),
          expiry,
          true,
        )

        // Mock oracle: dispute periodd over, set price to 200.
        const priceMock = BigNumber.from('200')
        await oracle.setExpiryPriceFinalizedAllPeiodOver(weth.address, expiry.toString(), priceMock.toString(), true)
        await oracle.setExpiryPriceFinalizedAllPeiodOver(usdc.address, expiry.toString(), createTokenAmount(1), true)

        const underlying = await expiredOtoken.underlyingAsset()
        const strike = await expiredOtoken.strikeAsset()
        const collateral = await expiredOtoken.collateralAsset()
        const expiryTimestamp = await expiredOtoken.expiryTimestamp()

        const expectedResult = true
        assert.equal(
          await controllerProxy.canSettleAssets(underlying, strike, collateral, expiryTimestamp),
          expectedResult,
          'Price is not finalized',
        )
        assert.equal(
          await controllerProxy.isSettlementAllowed(expiredOtoken.address),
          expectedResult,
          'Price is not finalized',
        )
      })
    })

    describe('Expiry', async () => {
      it('should return false for non expired otoken', async () => {
        let otoken: MockOtoken
        otoken = (await MockOtoken.deploy()) as MockOtoken
        otoken = await otoken.deployed()
        await otoken.init(
          addressBook.address,
          weth.address,
          usdc.address,
          usdc.address,
          createTokenAmount(200),
          ethers.BigNumber.from(await getLatestTime()).add(ethers.BigNumber.from(60000 * 60000)),
          true,
        )
        // ethers.BigNumber.from(await getLatestTime()).add(expiryTime),

        assert.equal(await controllerProxy.hasExpired(otoken.address), false, 'Otoken expiry check mismatch')
      })

      it('should return true for expired otoken', async () => {
        // Otoken deployment
        let expiredOtoken: MockOtoken
        expiredOtoken = (await MockOtoken.deploy()) as MockOtoken
        expiredOtoken = await expiredOtoken.deployed()
        // init otoken
        await expiredOtoken.init(
          addressBook.address,
          weth.address,
          usdc.address,
          usdc.address,
          createTokenAmount(200),
          1219835219,
          true,
        )

        assert.equal(await controllerProxy.hasExpired(expiredOtoken.address), true, 'Otoken expiry check mismatch')
      })
    })

    describe('Call action', async () => {
      let callTester: CallTester

      this.beforeAll('Before all call tester', async () => {
        const callTesterDeployed = (await CallTester.deploy()) as CallTester
        callTester = await callTesterDeployed.deployed()
      })

      it('should call any arbitrary destination address when restriction is not activated', async () => {
        //whitelist callee before call action
        await whitelist.connect(owner).whitelistCallee(callTester.address)

        const actionArgs = [
          {
            actionType: ActionType.Call,
            owner: ZERO_ADDR,
            secondAddress: callTester.address,
            asset: ZERO_ADDR,
            vaultId: '0',
            amount: '0',
            index: '0',
            data: ZERO_ADDR,
          },
        ]


        expectEvent(await controllerProxy.connect(accountOwner1).operate(actionArgs), 'CallExecuted', {
          from: accountOwner1,
          to: callTester.address,
          data: ZERO_ADDR,
        })
      })

      it('should revert activating call action restriction from non-owner', async () => {
        await expectRevert(controllerProxy.connect(random).setCallRestriction(true), 'Ownable: caller is not the owner')
      })

      it('should revert activating call action restriction when it is already activated', async () => {
        await expectRevert(controllerProxy.connect(owner).setCallRestriction(true), 'C9')
      })

      it('should revert calling any arbitrary address when call restriction is activated', async () => {
        let arbitraryTarget: CallTester

        arbitraryTarget = (await CallTester.deploy()) as CallTester
        arbitraryTarget = await arbitraryTarget.deployed()

        const actionArgs = [
          {
            actionType: ActionType.Call,
            owner: ZERO_ADDR,
            secondAddress: arbitraryTarget.address,
            asset: ZERO_ADDR,
            vaultId: '0',
            amount: '0',
            index: '0',
            data: ZERO_ADDR,
          },
        ]

        await expectRevert(controllerProxy.connect(accountOwner1).operate(actionArgs), 'C3')
      })

      it('should call whitelisted callee address when restriction is activated', async () => {
        // whitelist callee
        await whitelist.connect(owner).whitelistCallee(callTester.address)

        const actionArgs = [
          {
            actionType: ActionType.Call,
            owner: ZERO_ADDR,
            secondAddress: callTester.address,
            asset: ZERO_ADDR,
            vaultId: '0',
            amount: '0',
            index: '0',
            data: ZERO_ADDR,
          },
        ]

        // owner.sendTransaction({

        // })

        // from: accountOwner1,
        //   to: callTester.address,
        //   data: ZERO_ADDR,

        

        expectEvent(await controllerProxy.connect(accountOwner1).operate(actionArgs), 'CallExecuted', {
          from: accountOwner1,
          to: callTester.address,
          data: ZERO_ADDR,
        })
      })

      it('should deactivate call action restriction from owner', async () => {
        await controllerProxy.connect(owner).setCallRestriction(false)

        assert.equal(await controllerProxy.callRestricted(), false, 'Call action restriction deactivation failed')
      })

      it('should revert deactivating call action restriction when it is already deactivated', async () => {
        await expectRevert(controllerProxy.connect(owner).setCallRestriction(false), 'C9')
      })
    })

    describe('Sync vault latest update timestamp', () => {
      it('should update vault latest update timestamp', async () => {
        const vaultCounter = ethers.BigNumber.from(await controllerProxy.getAccountVaultCounter(accountOwner1.address))
        const timestampBefore = ethers.BigNumber.from(
          (await controllerProxy.getVaultWithDetails(accountOwner1.address, vaultCounter.toNumber()))[2],
        )

        await controllerProxy.connect(random).sync(accountOwner1.address, vaultCounter.toNumber())

        const timestampAfter = ethers.BigNumber.from(
          (await controllerProxy.getVaultWithDetails(accountOwner1.address, vaultCounter.toNumber()))[2],
        )
        assert.isAbove(
          timestampAfter.toNumber(),
          timestampBefore.toNumber(),
          'Vault latest update timestamp did not sync',
        )
      })
    })

    describe('Interact with Otoken implementation v1.0.0', async () => {
      let shortOtokenV1: OtokenImplV1

      this.beforeAll('Before all interaction with v1.0.0', async () => {
        const expiryTime = ethers.BigNumber.from(60 * 60 * 24) // after 1 day
        const shortOtokenV1Deployed = (await OtokenImplV1.deploy()) as OtokenImplV1
        shortOtokenV1 = await shortOtokenV1Deployed.deployed()
        // init otoken
        await shortOtokenV1.init(
          addressBook.address,
          weth.address,
          usdc.address,
          usdc.address,
          createTokenAmount(200),
          ethers.BigNumber.from(await getLatestTime()).add(expiryTime),
          true,
        )
        // whitelist otoken to be used in the protocol
        await whitelist.connect(owner).whitelistOtoken(shortOtokenV1.address)
        // open new vault, mint naked short, sell it to holder 1
        const collateralToDespoit = BigNumber.from((await shortOtokenV1.strikePrice()).toString()).div(100)
        const vaultCounter = (await controllerProxy.getAccountVaultCounter(accountOwner1.address)).add(1)
        const amountToMint = createTokenAmount(1)
        const actionArgs = [
          {
            actionType: ActionType.OpenVault,
            owner: accountOwner1.address,
            secondAddress: accountOwner1.address,
            asset: ZERO_ADDR,
            vaultId: vaultCounter.toNumber(),
            amount: '0',
            index: '0',
            data: ZERO_ADDR,
          },
          {
            actionType: ActionType.DepositCollateral,
            owner: accountOwner1.address,
            secondAddress: accountOwner1.address,
            asset: usdc.address,
            vaultId: vaultCounter.toNumber(),
            amount: collateralToDespoit.toNumber(),
            index: '0',
            data: ZERO_ADDR,
          },
          {
            actionType: ActionType.MintShortOption,
            owner: accountOwner1.address,
            secondAddress: accountOwner1.address,
            asset: shortOtokenV1.address,
            vaultId: vaultCounter.toNumber(),
            amount: amountToMint,
            index: '0',
            data: ZERO_ADDR,
          },
        ]
        await usdc.connect(accountOwner1).approve(marginPool.address, collateralToDespoit.toString())
        await controllerProxy.connect(accountOwner1).operate(actionArgs)

        //transfer to holder
        await shortOtokenV1.connect(accountOwner1).transfer(holder1.address, amountToMint)
      })

      it('should settle v1 Otoken implementation', async () => {
        // past time after expiry

        await ethers.provider.send('evm_increaseTime', [60 * 61 * 24])
        // increase time with one hour in seconds

        const expiry = await shortOtokenV1.expiryTimestamp()
        await oracle.setExpiryPriceFinalizedAllPeiodOver(weth.address, expiry, BigNumber.from(createTokenAmount(150)), true)
        await oracle.setExpiryPriceFinalizedAllPeiodOver(usdc.address, expiry, BigNumber.from(createTokenAmount(1)), true)
        const vaultCounter = BigNumber.from(await controllerProxy.getAccountVaultCounter(accountOwner1.address))
        const actionArgs = [
          {
            actionType: ActionType.SettleVault,
            owner: accountOwner1.address,
            secondAddress: accountOwner1.address,
            asset: shortOtokenV1.address,
            vaultId: vaultCounter.toNumber(),
            amount: '0',
            index: '0',
            data: ZERO_ADDR,
          },
        ]

        const payout = BigNumber.from(createTokenAmount(150, usdcDecimals))
        const marginPoolBalanceBefore = BigNumber.from(await usdc.balanceOf(marginPool.address))
        const senderBalanceBefore = BigNumber.from(await usdc.balanceOf(accountOwner1.address))
        const proceed = await controllerProxy.getProceed(accountOwner1.address, vaultCounter)

        

        assert.equal(payout.toString(), proceed.toString())

        await controllerProxy.connect(accountOwner1).operate(actionArgs)

        const marginPoolBalanceAfter = BigNumber.from(await usdc.balanceOf(marginPool.address))
        const senderBalanceAfter = BigNumber.from(await usdc.balanceOf(accountOwner1.address))

        assert.equal(
          (marginPoolBalanceBefore.sub(marginPoolBalanceAfter)).toString(),
          payout.toString(),
          'Margin pool collateral asset balance mismatch',
        )
        assert.equal(
          (senderBalanceAfter.sub(senderBalanceBefore)).toString(),
          payout.toString(),
          'Sender collateral asset balance mismatch',
        )
      })

      it('should redeem v1 Otoken implementation', async () => {
        const redeemArgs = [
          {
            actionType: ActionType.Redeem,
            owner: ZERO_ADDR,
            secondAddress: holder1.address,
            asset: shortOtokenV1.address,
            vaultId: '0',
            amount: createTokenAmount(1),
            index: '0',
            data: ZERO_ADDR,
          },
        ]

        const expectedPayout = BigNumber.from(createTokenAmount(50, usdcDecimals))

        const userBalanceBefore = BigNumber.from(await usdc.balanceOf(holder1.address))
        await controllerProxy.connect(holder1).operate(redeemArgs)
        const userBalanceAfter = BigNumber.from(await usdc.balanceOf(holder1.address))
        assert.equal((userBalanceAfter.sub(userBalanceBefore)).toString(), expectedPayout.toString())
      })
    })


  describe('Pause mechanism', async () => {
    let shortOtoken: MockOtoken

    this.beforeAll('pause mechanism before all hook', async () => {
      const vaultCounterBefore = ethers.BigNumber.from(
        await controllerProxy.getAccountVaultCounter(accountOwner1.address),
      )
      const expiryTime = ethers.BigNumber.from(60 * 60) // after 1 hour
      const shortOtokenDeployed = (await MockOtoken.deploy()) as MockOtoken
      shortOtoken = await shortOtokenDeployed.deployed()
      // init otoken
      await shortOtoken.init(
        addressBook.address,
        weth.address,
        usdc.address,
        usdc.address,
        createTokenAmount(200),
        ethers.BigNumber.from(await getLatestTime()).add(expiryTime),
        true,
      )

      // whitelist otoken to be minted
      await whitelist.connect(owner).whitelistOtoken(shortOtoken.address)

      const collateralToDeposit = createTokenAmount(200, usdcDecimals)
      const amountToMint = createTokenAmount(1) // mint 1 otoken
      const actionArgs = [
        {
          actionType: ActionType.OpenVault,
          owner: accountOwner1.address,
          secondAddress: accountOwner1.address,
          asset: ZERO_ADDR,
          vaultId: vaultCounterBefore.toNumber() + 1,
          amount: '0',
          index: '0',
          data: ZERO_ADDR,
        },
        {
          actionType: ActionType.MintShortOption,
          owner: accountOwner1.address,
          secondAddress: accountOwner1.address,
          asset: shortOtoken.address,
          vaultId: vaultCounterBefore.toNumber() + 1,
          amount: amountToMint,
          index: '0',
          data: ZERO_ADDR,
        },
        {
          actionType: ActionType.DepositCollateral,
          owner: accountOwner1.address,
          secondAddress: accountOwner1.address,
          asset: usdc.address,
          vaultId: vaultCounterBefore.toNumber() + 1,
          amount: collateralToDeposit,
          index: '0',
          data: ZERO_ADDR,
        },
      ]
      await usdc.connect(accountOwner1).approve(marginPool.address, collateralToDeposit)
      await controllerProxy.connect(accountOwner1).operate(actionArgs)
    })

    it('should revert set pauser address from non-owner', async () => {
      await expectRevert(
        controllerProxy.connect(random).setPartialPauser(partialPauser.address),
        'Ownable: caller is not the owner',
      )
    })

    it('should set pauser address', async () => {
      await controllerProxy.connect(owner).setPartialPauser(partialPauser.address)
      assert.equal(await controllerProxy.partialPauser(), partialPauser.address, 'pauser address mismatch')
    })

    it('should revert set pauser address to the same previous address', async () => {
      await expectRevert(controllerProxy.connect(owner).setPartialPauser(partialPauser.address), 'C9')
    })

    it('should revert when pausing the system from address other than pauser', async () => {
      await expectRevert(controllerProxy.connect(random).setSystemPartiallyPaused(true), 'C2')
    })

    it('should revert partially un-pausing an already running system', async () => {
      await expectRevert(controllerProxy.connect(partialPauser).setSystemPartiallyPaused(false), 'C9')
    })

    it('should pause system', async () => {
      const stateBefore = await controllerProxy.systemPartiallyPaused()
      assert.equal(stateBefore, false, 'System already paused')

      await controllerProxy.connect(partialPauser).setSystemPartiallyPaused(true)

      const stateAfter = await controllerProxy.systemPartiallyPaused()
      assert.equal(stateAfter, true, 'System not paused')
    })

    it('should revert partially pausing an already patially paused system', async () => {
      await expectRevert(controllerProxy.connect(partialPauser).setSystemPartiallyPaused(true), 'C9')
    })

    it('should revert opening a vault when system is partially paused', async () => {
      const vaultCounter = BigNumber.from(await controllerProxy.getAccountVaultCounter(accountOwner1.address))
      const actionArgs = [
        {
          actionType: ActionType.OpenVault,
          owner: accountOwner1.address,
          secondAddress: accountOwner1.address,
          asset: ZERO_ADDR,
          vaultId: vaultCounter.toNumber() + 1,
          amount: '0',
          index: '0',
          data: ZERO_ADDR,
        },
      ]
      await expectRevert(controllerProxy.connect(accountOwner1).operate(actionArgs), 'C4')
    })

    it('should revert depositing collateral when system is partially paused', async () => {
      const vaultCounter = BigNumber.from(await controllerProxy.getAccountVaultCounter(accountOwner1.address))
      const collateralToDeposit = BigNumber.from(await shortOtoken.strikePrice()).div(1e8)
      const actionArgs = [
        {
          actionType: ActionType.DepositCollateral,
          owner: accountOwner1.address,
          secondAddress: accountOwner1.address,
          asset: usdc.address,
          vaultId: vaultCounter.toNumber() + 1,
          amount: collateralToDeposit.toNumber(),
          index: '0',
          data: ZERO_ADDR,
        },
      ]
      await usdc.connect(accountOwner1).approve(marginPool.address, collateralToDeposit.toString())
      await expectRevert(controllerProxy.connect(accountOwner1).operate(actionArgs), 'C4')
    })

    it('should revert minting short otoken when system is partially paused', async () => {
      const vaultCounter = BigNumber.from(await controllerProxy.getAccountVaultCounter(accountOwner1.address))
      const collateralToDeposit = BigNumber.from(await shortOtoken.strikePrice()).div(1e8)
      const actionArgs = [
        {
          actionType: ActionType.MintShortOption,
          owner: accountOwner1.address,
          secondAddress: accountOwner1.address,
          asset: shortOtoken.address,
          vaultId: vaultCounter.toNumber(),
          amount: '1',
          index: '0',
          data: ZERO_ADDR,
        },
        {
          actionType: ActionType.DepositCollateral,
          owner: accountOwner1.address,
          secondAddress: accountOwner1.address,
          asset: usdc.address,
          vaultId: vaultCounter.toNumber(),
          amount: collateralToDeposit.toNumber(),
          index: '0',
          data: ZERO_ADDR,
        },
      ]
      await usdc.connect(accountOwner1).approve(marginPool.address, collateralToDeposit.toString())
      await expectRevert(controllerProxy.connect(accountOwner1).operate(actionArgs), 'C4')
    })

    it('should revert withdrawing collateral when system is partially paused', async () => {
      const vaultCounter = BigNumber.from(await controllerProxy.getAccountVaultCounter(accountOwner1.address))
      const collateralToWithdraw = BigNumber.from(await shortOtoken.strikePrice()).div(100)
      const actionArgs = [
        {
          actionType: ActionType.WithdrawCollateral,
          owner: accountOwner1.address,
          secondAddress: accountOwner1.address,
          asset: usdc.address,
          vaultId: vaultCounter.toNumber(),
          amount: collateralToWithdraw.toNumber(),
          index: '0',
          data: ZERO_ADDR,
        },
      ]
      await expectRevert(controllerProxy.connect(accountOwner1).operate(actionArgs), 'C4')
    })

    it('should revert burning short otoken when system is partially paused', async () => {
      const vaultCounter = BigNumber.from(await controllerProxy.getAccountVaultCounter(accountOwner1.address))
      const actionArgs = [
        {
          actionType: ActionType.BurnShortOption,
          owner: accountOwner1.address,
          secondAddress: accountOwner1.address,
          asset: shortOtoken.address,
          vaultId: vaultCounter.toNumber(),
          amount: '1',
          index: '0',
          data: ZERO_ADDR,
        },
      ]

      await expectRevert(controllerProxy.connect(accountOwner1).operate(actionArgs), 'C4')
    })

    it('should settle vault when system is partially paused', async () => {
      // past time after expiry

      await ethers.provider.send('evm_increaseTime', [60 * 60]) // increase time with one hour in seconds
      // set price in Oracle Mock, 150$ at expiry, expire ITM
      const expiry = BigNumber.from(await shortOtoken.expiryTimestamp())
      await oracle.setExpiryPriceFinalizedAllPeiodOver(weth.address, expiry, BigNumber.from(createTokenAmount(150)), true)
      await oracle.setExpiryPriceFinalizedAllPeiodOver(usdc.address, expiry, BigNumber.from(createTokenAmount(1)), true)

      const vaultCounter = BigNumber.from(await controllerProxy.getAccountVaultCounter(accountOwner1.address))
      const actionArgs = [
        {
          actionType: ActionType.SettleVault,
          owner: accountOwner1.address,
          secondAddress: accountOwner1.address,
          asset: shortOtoken.address,
          vaultId: vaultCounter.toNumber(),
          amount: '0',
          index: '0',
          data: ZERO_ADDR,
        },
      ]

      

      const payout = BigNumber.from(createTokenAmount(150, usdcDecimals))
      const marginPoolBalanceBefore = BigNumber.from(await usdc.balanceOf(marginPool.address))
      const senderBalanceBefore = BigNumber.from(await usdc.balanceOf(accountOwner1.address))

      await controllerProxy.connect(accountOwner1).operate(actionArgs)

      const marginPoolBalanceAfter = BigNumber.from(await usdc.balanceOf(marginPool.address))
      const senderBalanceAfter = BigNumber.from(await usdc.balanceOf(accountOwner1.address))

      assert.equal(
        (marginPoolBalanceBefore.sub(marginPoolBalanceAfter)).toString(),
        payout.toString(),
        'Margin pool collateral asset balance mismatch',
      )
      assert.equal(
        (senderBalanceAfter.sub(senderBalanceBefore)).toString(),
        payout.toString(),
        'Seller collateral asset balance mismatch',
      )
    })

    it('should redeem when system is partially paused', async () => {
      const amountToRedeem = createTokenAmount(1)
      // transfer to holder
      await shortOtoken.connect(accountOwner1).transfer(holder1.address, amountToRedeem)

      const actionArgs = [
        {
          actionType: ActionType.Redeem,
          owner: ZERO_ADDR,
          secondAddress: holder1.address,
          asset: shortOtoken.address,
          vaultId: '0',
          amount: amountToRedeem,
          index: '0',
          data: ZERO_ADDR,
        },
      ]
      assert.equal(await controllerProxy.hasExpired(shortOtoken.address), true, 'Short otoken is not expired yet')

      const payout = createTokenAmount(50, usdcDecimals)
      const marginPoolBalanceBefore = BigNumber.from(await usdc.balanceOf(marginPool.address))
      const senderBalanceBefore = BigNumber.from(await usdc.balanceOf(holder1.address))
      const senderShortBalanceBefore = BigNumber.from(await shortOtoken.balanceOf(holder1.address))

      await controllerProxy.connect(holder1).operate(actionArgs)

      const marginPoolBalanceAfter = BigNumber.from(await usdc.balanceOf(marginPool.address))
      const senderBalanceAfter = BigNumber.from(await usdc.balanceOf(holder1.address))
      const senderShortBalanceAfter = BigNumber.from(await shortOtoken.balanceOf(holder1.address))

      assert.equal(
        marginPoolBalanceBefore.sub(marginPoolBalanceAfter).toString(),
        payout.toString(),
        'Margin pool collateral asset balance mismatch',
      )
      assert.equal(
        senderBalanceAfter.sub(senderBalanceBefore).toString(),
        payout.toString(),
        'Sender collateral asset balance mismatch',
      )
      assert.equal(
        senderShortBalanceBefore.sub(senderShortBalanceAfter).toString(),
        amountToRedeem.toString(),
        ' Burned short otoken amount mismatch',
      )
    })
  })

  describe('Full Pause', () => {
    let shortOtoken: MockOtoken

    this.beforeAll('pauser hook', async () => {
      // deactivate pausing mechanism
      console.log('1')
      // await controllerProxy.connect(owner).setPartialPauser(partialPauser.address)
      console.log('2')
      try {
        await controllerProxy.connect(partialPauser).setSystemPartiallyPaused(false)
      } catch (error) {}

      console.log('3')

      const vaultCounterBefore = BigNumber.from(await controllerProxy.getAccountVaultCounter(accountOwner1.address))
      console.log('4')
      const expiryTime = ethers.BigNumber.from(60 * 60) // after 1 hour
      console.log('5')

      const shortOtokenDeployed = (await MockOtoken.deploy()) as MockOtoken
      console.log('6')
      shortOtoken = await shortOtokenDeployed.deployed()
      console.log('7')
      // init otoken
      await shortOtoken.init(
        addressBook.address,
        weth.address,
        usdc.address,
        usdc.address,
        createTokenAmount(200),
        ethers.BigNumber.from(await getLatestTime()).add(expiryTime),
        true,
      )
      console.log('8')

      // whitelist otoken to be minted
      await whitelist.connect(owner).whitelistOtoken(shortOtoken.address)
      console.log('9')

      const collateralToDeposit = createTokenAmount(200, usdcDecimals)
      console.log('10')
      const amountToMint = createTokenAmount(1) // mint 1 otoken
      console.log('11')
      const actionArgs = [
        {
          actionType: ActionType.OpenVault,
          owner: accountOwner1.address,
          secondAddress: accountOwner1.address,
          asset: ZERO_ADDR,
          vaultId: vaultCounterBefore.toNumber() + 1,
          amount: '0',
          index: '0',
          data: ZERO_ADDR,
        },
        {
          actionType: ActionType.MintShortOption,
          owner: accountOwner1.address,
          secondAddress: accountOwner1.address,
          asset: shortOtoken.address,
          vaultId: vaultCounterBefore.toNumber() + 1,
          amount: amountToMint,
          index: '0',
          data: ZERO_ADDR,
        },
        {
          actionType: ActionType.DepositCollateral,
          owner: accountOwner1.address,
          secondAddress: accountOwner1.address,
          asset: usdc.address,
          vaultId: vaultCounterBefore.toNumber() + 1,
          amount: collateralToDeposit,
          index: '0',
          data: ZERO_ADDR,
        },
      ]
      console.log('12')
      await usdc.connect(accountOwner1).approve(marginPool.address, collateralToDeposit)
      console.log('13')
      await controllerProxy.connect(accountOwner1).operate(actionArgs)
      console.log('14')
    })

    it('should revert set fullPauser address from non-owner', async () => {
      await expectRevert(
        controllerProxy.connect(random).setFullPauser(fullPauser.address),
        'Ownable: caller is not the owner',
      )
    })

    it('should revert set fullPauser address to address zero', async () => {
      await expectRevert(controllerProxy.connect(owner).setFullPauser(ZERO_ADDR), 'C10')
    })

    it('should set fullPauser', async () => {
      await controllerProxy.connect(owner).setFullPauser(fullPauser.address)
      assert.equal(await controllerProxy.fullPauser(), fullPauser.address, 'Full pauser wrong')
    })

    it('should revert when triggering full pause from address other than pauser', async () => {
      await expectRevert(controllerProxy.connect(random).setSystemFullyPaused(true), 'C1')
    })

    it('should revert fully un-pausing an already running system', async () => {
      await expectRevert(controllerProxy.connect(fullPauser).setSystemFullyPaused(false), 'C9')
    })

    it('should trigger full pause', async () => {
      const stateBefore = await controllerProxy.systemFullyPaused()
      assert.equal(stateBefore, false, 'System already in full pause state')

      await controllerProxy.connect(fullPauser).setSystemFullyPaused(true)

      const stateAfter = await controllerProxy.systemFullyPaused()
      assert.equal(stateAfter, true, 'System not in full pause state')
    })

    it('should revert fully pausing an already fully paused system', async () => {
      await expectRevert(controllerProxy.connect(fullPauser).setSystemFullyPaused(true), 'C9')
    })

    it('should revert opening a vault when system is in full pause state', async () => {
      const vaultCounter = BigNumber.from(await controllerProxy.getAccountVaultCounter(accountOwner1.address))
      const actionArgs = [
        {
          actionType: ActionType.OpenVault,
          owner: accountOwner1.address,
          secondAddress: accountOwner1.address,
          asset: ZERO_ADDR,
          vaultId: vaultCounter.toNumber() + 1,
          amount: '0',
          index: '0',
          data: ZERO_ADDR,
        },
      ]
      await expectRevert(controllerProxy.connect(accountOwner1).operate(actionArgs), '.')
    })

    it('should revert depositing collateral when system is in full pause state', async () => {
      const vaultCounter = BigNumber.from(await controllerProxy.getAccountVaultCounter(accountOwner1.address))
      const collateralToDeposit = BigNumber.from(await shortOtoken.strikePrice()).div(1e8)
      const actionArgs = [
        {
          actionType: ActionType.DepositCollateral,
          owner: accountOwner1.address,
          secondAddress: accountOwner1.address,
          asset: usdc.address,
          vaultId: vaultCounter.toNumber() + 1,
          amount: collateralToDeposit.toNumber(),
          index: '0',
          data: ZERO_ADDR,
        },
      ]
      await usdc.connect(accountOwner1).approve(marginPool.address, collateralToDeposit.toString())
      await expectRevert(controllerProxy.connect(accountOwner1).operate(actionArgs), 'C5')
    })

    it('should revert minting short otoken when system is in full pause state', async () => {
      const vaultCounter = BigNumber.from(await controllerProxy.getAccountVaultCounter(accountOwner1.address))
      const collateralToDeposit = BigNumber.from((await shortOtoken.strikePrice()).toString()).div(1e8)
      const actionArgs = [
        {
          actionType: ActionType.MintShortOption,
          owner: accountOwner1.address,
          secondAddress: accountOwner1.address,
          asset: shortOtoken.address,
          vaultId: vaultCounter.toNumber(),
          amount: '1',
          index: '0',
          data: ZERO_ADDR,
        },
        {
          actionType: ActionType.DepositCollateral,
          owner: accountOwner1.address,
          secondAddress: accountOwner1.address,
          asset: usdc.address,
          vaultId: vaultCounter.toNumber(),
          amount: collateralToDeposit.toNumber(),
          index: '0',
          data: ZERO_ADDR,
        },
      ]
      await usdc.connect(accountOwner1).approve(marginPool.address, collateralToDeposit.toString())
      await expectRevert(controllerProxy.connect(accountOwner1).operate(actionArgs), 'C5')
    })

    it('should revert withdrawing collateral when system is in full pause state', async () => {
      const vaultCounter = BigNumber.from(await controllerProxy.getAccountVaultCounter(accountOwner1.address))
      const collateralToWithdraw = BigNumber.from(await shortOtoken.strikePrice()).div(1e8)
      const actionArgs = [
        {
          actionType: ActionType.WithdrawCollateral,
          owner: accountOwner1.address,
          secondAddress: accountOwner1.address,
          asset: usdc.address,
          vaultId: vaultCounter.toNumber(),
          amount: collateralToWithdraw.toNumber(),
          index: '0',
          data: ZERO_ADDR,
        },
      ]
      await expectRevert(controllerProxy.connect(accountOwner1).operate(actionArgs), 'C5')
    })

    it('should revert burning short otoken when system is in full pause state', async () => {
      const vaultCounter = BigNumber.from(await controllerProxy.getAccountVaultCounter(accountOwner1.address))
      const actionArgs = [
        {
          actionType: ActionType.BurnShortOption,
          owner: accountOwner1.address,
          secondAddress: accountOwner1.address,
          asset: shortOtoken.address,
          vaultId: vaultCounter.toNumber(),
          amount: '1',
          index: '0',
          data: ZERO_ADDR,
        },
      ]

      await expectRevert(controllerProxy.connect(accountOwner1).operate(actionArgs), 'C5')
    })

    it('should revert settling vault when system is in full pause state', async () => {
      // past time after expiry

      ethers.provider.send('evm_increaseTime', [60 * 60])
      // set price in Oracle Mock, 150$ at expiry, expire ITM
      await oracle.setExpiryPrice(
        await shortOtoken.underlyingAsset(),
        await shortOtoken.expiryTimestamp(),
        createTokenAmount(150),
      )
      // set it as finalized in mock
      await oracle.setIsFinalized(await shortOtoken.underlyingAsset(), await shortOtoken.expiryTimestamp(), true)
      await oracle.setIsDisputePeriodOver(
        await shortOtoken.underlyingAsset(),
        await shortOtoken.expiryTimestamp(),
        true,
      )

      const vaultCounter = BigNumber.from(await controllerProxy.getAccountVaultCounter(accountOwner1.address))
      const actionArgs = [
        {
          actionType: ActionType.SettleVault,
          owner: accountOwner1.address,
          secondAddress: accountOwner1.address,
          asset: shortOtoken.address,
          vaultId: vaultCounter.toNumber(),
          amount: '0',
          index: '0',
          data: ZERO_ADDR,
        },
      ]

      await expectRevert(controllerProxy.connect(accountOwner1).operate(actionArgs), 'C5')
    })

    it('should revert redeem when system is in full pause state', async () => {
      const shortAmountToBurn = BigNumber.from('1')
      // transfer to holder
      await shortOtoken.connect(accountOwner1).transfer(holder1.address, shortAmountToBurn.toString())

      const actionArgs = [
        {
          actionType: ActionType.Redeem,
          owner: ZERO_ADDR,
          secondAddress: holder1.address,
          asset: shortOtoken.address,
          vaultId: '0',
          amount: shortAmountToBurn.toNumber(),
          index: '0',
          data: ZERO_ADDR,
        },
      ]

      await expectRevert(controllerProxy.connect(accountOwner1).operate(actionArgs), 'C5')
    })
  })

  describe('Donate to pool', () => {
    it('it should donate to margin pool', async () => {
      const amountToDonate = createTokenAmount(10, usdcDecimals)
      const storedBalanceBefore = BigNumber.from(await marginPool.getStoredBalance(usdc.address))

      await usdc.connect(donor).approve(marginPool.address, amountToDonate)
      await controllerProxy.connect(donor).donate(usdc.address, amountToDonate)

      const storedBalanceAfter = BigNumber.from((await marginPool.getStoredBalance(usdc.address)).toString())

      assert.equal(storedBalanceAfter.sub(storedBalanceBefore).toString(), amountToDonate, 'Donated amount mismatch')
    })
  })

  describe('Refresh configuration', () => {
    it('should revert refreshing configuration from address other than owner', async () => {
      await expectRevert(controllerProxy.connect(random).refreshConfiguration(), 'Ownable: caller is not the owner')
    })

    it('should refresh configuratiom', async () => {
      // update modules

      let oracle: MockOracle
      let calculator: MarginCalculator
      let marginPool: MarginPool
      let whitelist: MockWhitelistModule

      oracle = (await MockOracle.deploy()) as MockOracle
      calculator = (await MarginCalculator.deploy(addressBook.address)) as MarginCalculator
      marginPool = (await MarginPool.deploy(addressBook.address)) as MarginPool
      whitelist = (await MockWhitelistModule.deploy()) as MockWhitelistModule

      oracle = await oracle.deployed()
      calculator = await calculator.deployed()
      marginPool = await marginPool.deployed()
      whitelist = await whitelist.deployed()

      await addressBook.setOracle(oracle.address)
      await addressBook.setMarginCalculator(calculator.address)
      await addressBook.setMarginPool(marginPool.address)
      await addressBook.setWhitelist(whitelist.address)

      // referesh controller configuration
      await controllerProxy.refreshConfiguration()
      const [_whitelist, _oracle, _calculator, _pool] = await controllerProxy.getConfiguration()
      assert.equal(_oracle, oracle.address, 'Oracle address mismatch after refresh')
      assert.equal(_calculator, calculator.address, 'Calculator address mismatch after refresh')
      assert.equal(_pool, marginPool.address, 'Oracle address mismatch after refresh')
      assert.equal(_whitelist, whitelist.address, 'Oracle address mismatch after refresh')
    })
  })

  describe('Execute an invalid action', () => {
    it('Should execute transaction with no state updates', async () => {
      const vaultCounter = BigNumber.from(await controllerProxy.getAccountVaultCounter(accountOwner1.address))
      assert.isAbove(vaultCounter.toNumber(), 0, 'Account owner have no vault')

      const collateralToDeposit = createTokenAmount(10, usdcDecimals)
      const actionArgs = [
        {
          actionType: ActionType.InvalidAction,
          owner: accountOwner1.address,
          secondAddress: accountOwner1.address,
          asset: usdc.address,
          vaultId: vaultCounter.toNumber(),
          amount: collateralToDeposit,
          index: '0',
          data: ZERO_ADDR,
        },
      ]

      await usdc.connect(accountOwner1).approve(marginPool.address, collateralToDeposit)
      await expectRevert.unspecified(controllerProxy.connect(accountOwner1).operate(actionArgs))
    })
  })
})
