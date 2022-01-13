import { ethers, web3 } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import '@nomiclabs/hardhat-web3'
import { assert } from 'chai'

import {
  MockERC20,
  UpgradeableContractV1,
  UpgradeableContractV2,
  OwnedUpgradeabilityProxy,
  AddressBook,
  Controller,
  MarginCalculatorInterface,
  MockOtoken,
  MockWhitelistModule,
  MockOracle,
  MarginVaultTester,
} from '../../typechain'
import { ContractFactory } from 'ethers'

const { expectRevert } = require('@openzeppelin/test-helpers')

describe('AddressBook', function () {
  let accounts: SignerWithAddress[] = []
  let owner: SignerWithAddress
  let otokenImplAdd: SignerWithAddress
  let marginPoolAdd: SignerWithAddress
  let random: SignerWithAddress
  let liquidationManagerImpl: SignerWithAddress

  //ERC20 mocks
  let weth: MockERC20
  //addressbook instance
  let addressBook: AddressBook
  let controller: Controller
  let proxy: OwnedUpgradeabilityProxy
  let otokenFactory: MockOtoken
  let whitelist: MockWhitelistModule
  let oracle: MockOracle
  let marginCalculator: MarginCalculatorInterface

  let OtokenFactory: ContractFactory
  let UpgradeableContractV1: ContractFactory
  let UpgradeableContractV2: ContractFactory
  let MarginCalculator: ContractFactory

  let Whitelist: ContractFactory

  this.beforeAll('Set accounts', async () => {
    accounts = await ethers.getSigners()
    const [_owner, _otokenImplAdd, _marginPoolAdd, _liquidationManagerImpl, _random] = accounts

    owner = _owner
    random = _random
    marginPoolAdd = _marginPoolAdd
    liquidationManagerImpl = _liquidationManagerImpl
    otokenImplAdd = _otokenImplAdd
  })

  this.beforeAll('Initialize contracts', async () => {
    OtokenFactory = await ethers.getContractFactory('OtokenFactory')
    UpgradeableContractV1 = await ethers.getContractFactory('UpgradeableContractV1')
    UpgradeableContractV2 = await ethers.getContractFactory('UpgradeableContractV2')

    MarginCalculator = await ethers.getContractFactory('MarginCalculator')

    Whitelist = await ethers.getContractFactory('Whitelist')
  })

  this.beforeAll('Deployment', async () => {
    //deploy WETH token
    const MockERC20 = await ethers.getContractFactory('MockERC20')
    const wethDeployed = (await MockERC20.deploy('WETH', 'WETH', 18)) as MockERC20
    weth = await wethDeployed.deployed()

    const AddressBook = await ethers.getContractFactory('AddressBook')
    const addressBookDeployed = (await AddressBook.deploy()) as AddressBook
    addressBook = await addressBookDeployed.deployed()
  })

  describe('Set otoken implementation address', () => {
    it('should revert adding otoken implementation address from non-owner address', async () => {
      await expectRevert(
        addressBook.connect(random).setOtokenImpl(otokenImplAdd.address),
        'Ownable: caller is not the owner',
      )
    })

    it('should set otoken implementation address', async () => {
      await addressBook.connect(owner).setOtokenImpl(otokenImplAdd.address)

      assert.equal(
        await addressBook.connect(owner).getOtokenImpl(),
        otokenImplAdd.address,
        'Otoken implementation address mismatch',
      )
    })
  })

  describe('Set controller', () => {
    let lib: MarginVaultTester
    this.beforeAll(async () => {
      const MarginVault = await ethers.getContractFactory('MarginVault')

      lib = (await MarginVault.deploy()) as MarginVaultTester
      const Controller = await ethers.getContractFactory('Controller', {
        libraries: {
          MarginVault: lib.address,
        },
      })

      const controllerDeployed = (await Controller.deploy()) as Controller
      controller = await controllerDeployed.deployed()
    })

    it('should revert adding controller from non-owner address', async () => {
      await expectRevert(
        addressBook.connect(random).setController(controller.address),
        'Ownable: caller is not the owner',
      )
    })

    it('should set controller address', async () => {
      await addressBook.connect(owner).setController(controller.address)
      const OwnedUpgradeabilityProxy = await ethers.getContractFactory('OwnedUpgradeabilityProxy')
      ;(await OwnedUpgradeabilityProxy.deploy()) as OwnedUpgradeabilityProxy

      proxy = (await ethers.getContractAt(
        'OwnedUpgradeabilityProxy',
        await addressBook.getController(),
      )) as OwnedUpgradeabilityProxy

      const implementationAddress = await proxy.implementation()

      assert.equal(controller.address, implementationAddress, 'Controller implementation address mismatch')
    })
  })

  describe('Set otoken factory', () => {
    before(async () => {
      const otokenFactoryDeployed = (await OtokenFactory.deploy(addressBook.address)) as MockOtoken
      otokenFactory = await otokenFactoryDeployed.deployed()
    })

    it('should revert adding otoken factory address from non-owner address', async () => {
      await expectRevert(
        addressBook.connect(random).setOtokenFactory(otokenFactory.address),
        'Ownable: caller is not the owner',
      )
    })

    it('should set otoken factory address', async () => {
      await addressBook.connect(owner).setOtokenFactory(otokenFactory.address)

      assert.equal(await addressBook.getOtokenFactory(), otokenFactory.address, 'Otoken factory address mismatch')
    })
  })

  describe('Set whitelist', () => {
    before(async () => {
      const whitelistDeployed = (await Whitelist.deploy(addressBook.address)) as MockWhitelistModule
      whitelist = await whitelistDeployed.deployed()
    })

    it('should revert adding whitelist address from non-owner address', async () => {
      await expectRevert(
        addressBook.connect(random).setWhitelist(whitelist.address),
        'Ownable: caller is not the owner',
      )
    })

    it('should set whitelist address', async () => {
      await addressBook.connect(owner).setWhitelist(whitelist.address)

      assert.equal(await addressBook.getWhitelist(), whitelist.address, 'Whitelist address mismatch')
    })
  })

  describe('Set margin pool', () => {
    it('should revert adding pool address from non-owner address', async () => {
      await expectRevert(
        addressBook.connect(random).setMarginPool(marginPoolAdd.address),
        'Ownable: caller is not the owner',
      )
    })

    it('should set pool address', async () => {
      await addressBook.connect(owner).setMarginPool(marginPoolAdd.address)

      assert.equal(await addressBook.getMarginPool(), marginPoolAdd.address, 'Pool address mismatch')
    })
  })

  describe('Set liquidation manager', () => {
    it('should revert adding liquidation manager address from non-owner address', async () => {
      await expectRevert(
        addressBook.connect(random).setLiquidationManager(liquidationManagerImpl.address),
        'Ownable: caller is not the owner',
      )
    })

    it('should set liquidation manager address', async () => {
      await addressBook.connect(owner).setLiquidationManager(liquidationManagerImpl.address)

      assert.equal(
        liquidationManagerImpl.address,
        await addressBook.getLiquidationManager(),
        'liquidation manager implementation address mismatch',
      )
    })
  })

  describe('Set oracle', () => {
    this.beforeAll('Set up oracle for deployment', async () => {
      const Oracle = await ethers.getContractFactory('Oracle')
      const oracleDeployed = (await Oracle.deploy()) as MockOracle
      oracle = await oracleDeployed.deployed()
    })

    it('should revert adding oracle address from non-owner address', async () => {
      await expectRevert(
        addressBook.connect(random).setLiquidationManager(oracle.address),
        'Ownable: caller is not the owner',
      )
    })

    it('should set oracle address', async () => {
      await addressBook.connect(owner).setOracle(oracle.address)

      assert.equal(oracle.address, await addressBook.getOracle(), 'Oracle module implementation address mismatch')
    })
  })

  describe('Set margin calculator', () => {
    before(async () => {
      const oracleAddress = await addressBook.getOracle()
      const marginCalculatorDeployed = (await MarginCalculator.deploy(oracleAddress)) as MarginCalculatorInterface
      marginCalculator = await marginCalculatorDeployed.deployed()
    })

    it('should revert adding margin calculator address from non-owner address', async () => {
      await expectRevert(
        addressBook.connect(random).setMarginCalculator(marginCalculator.address),
        'Ownable: caller is not the owner',
      )
    })

    it('should set margin calculator address', async () => {
      await addressBook.connect(owner).setMarginCalculator(marginCalculator.address)

      assert.equal(
        marginCalculator.address,
        await addressBook.getMarginCalculator(),
        'Margin calculator implementation address mismatch',
      )
    })
  })

  describe('Set arbitrary address', () => {
    const modulekey = web3.utils.soliditySha3('newModule')
    let module: UpgradeableContractV1

    before(async () => {
      module = (await UpgradeableContractV1.deploy()) as UpgradeableContractV1
    })

    it('should revert adding arbitrary key:address from non-owner address', async () => {
      await expectRevert(
        addressBook.connect(random).updateImpl(`${modulekey}`, module.address),
        'Ownable: caller is not the owner',
      )
    })

    it('should set new module key and address', async () => {
      await addressBook.connect(owner).updateImpl(`${modulekey}`, module.address)

      const proxy: OwnedUpgradeabilityProxy = (await ethers.getContractAt(
        'OwnedUpgradeabilityProxy',
        await addressBook.getAddress(`${modulekey}`),
      )) as OwnedUpgradeabilityProxy

      //proxy = await ethers.getContractAt("OwnedUpgradeabilityProxy", await addressBook.getController()) as OwnedUpgradeabilityProxy;

      const implementationAddress = await proxy.implementation()

      assert.equal(module.address, implementationAddress, 'New module implementation address mismatch')
    })
  })

  describe('Upgrade contract', async () => {
    const key = web3.utils.soliditySha3('ammModule')

    let v1Contract: UpgradeableContractV1
    let v2Contract: UpgradeableContractV2

    before(async () => {
      v1Contract = (await UpgradeableContractV1.deploy()) as UpgradeableContractV1

      await addressBook.connect(owner).updateImpl(`${key}`, v1Contract.address)

      const proxy: OwnedUpgradeabilityProxy = (await ethers.getContractAt(
        'OwnedUpgradeabilityProxy',
        await addressBook.getAddress(`${key}`),
      )) as OwnedUpgradeabilityProxy

      const implementationAddress = await proxy.implementation()

      assert.equal(v1Contract.address, implementationAddress, 'AMM module implementation address mismatch')
      assert.equal((await v1Contract.getV1Version()).toString(), '1', 'AMM implementation version mismatch')
    })

    it('should upgrade contract from V1 to V2', async () => {
      //deploy V2 implementation
      v2Contract = (await UpgradeableContractV2.deploy()) as UpgradeableContractV2

      const v1Proxy: OwnedUpgradeabilityProxy = (await ethers.getContractAt(
        'OwnedUpgradeabilityProxy',
        await addressBook.getAddress(`${key}`),
      )) as OwnedUpgradeabilityProxy
      const v1ImplementationAddress = await v1Proxy.implementation()

      assert.notEqual(v2Contract.address, v1ImplementationAddress, 'AMM v1 and v2 have same implementation address')

      await addressBook.connect(owner).updateImpl(`${key}`, v2Contract.address)

      const v2Proxy: OwnedUpgradeabilityProxy = (await ethers.getContractAt(
        'OwnedUpgradeabilityProxy',
        await addressBook.getAddress(`${key}`),
      )) as OwnedUpgradeabilityProxy

      const v2ImplementationAddress = await v2Proxy.implementation()

      assert.equal(v2Contract.address, v2ImplementationAddress, 'AMM V2 implementation address mismatch')
      assert.equal(v1Proxy.address, v2Proxy.address, 'AMM proxy address mismatch')

      v2Contract = (await ethers.getContractAt(
        'UpgradeableContractV2',
        await addressBook.getAddress(`${key}`),
      )) as UpgradeableContractV2

      assert.equal((await v2Contract.getV2Version()).toString(), '2', 'AMM implementation version mismatch')
    })
  })
})
