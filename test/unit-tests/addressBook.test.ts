import {
  MockERC20Instance,
  WhitelistInstance,
  OtokenFactoryInstance,
  UpgradeableContractV1Instance,
  UpgradeableContractV2Instance,
  OwnedUpgradeabilityProxyInstance,
  AddressBookInstance,
  ControllerInstance,
  MarginCalculatorInstance,
  OracleInstance,
} from '../../build/types/truffle-types'

const { expectRevert } = require('@openzeppelin/test-helpers')

const MockERC20 = artifacts.require('MockERC20.sol')
const OtokenFactory = artifacts.require('OtokenFactory.sol')
const UpgradeableContractV1 = artifacts.require('UpgradeableContractV1.sol')
const UpgradeableContractV2 = artifacts.require('UpgradeableContractV2.sol')
const OwnedUpgradeabilityProxy = artifacts.require('OwnedUpgradeabilityProxy.sol')
const Controller = artifacts.require('Controller.sol')
const MarginCalculator = artifacts.require('MarginCalculator.sol')
const Oracle = artifacts.require('Oracle.sol')
const AddressBook = artifacts.require('AddressBook.sol')
const Whitelist = artifacts.require('Whitelist.sol')
const MarginVault = artifacts.require('MarginVault.sol')

contract('AddressBook', ([owner, otokenImplAdd, marginPoolAdd, liquidationManagerImpl, random]) => {
  // ERC20 mocks
  let weth: MockERC20Instance
  // addressbook instance
  let addressBook: AddressBookInstance

  before('Deployment', async () => {
    // deploy WETH token
    weth = await MockERC20.new('WETH', 'WETH', 18)
    // deploy AddressBook token
    addressBook = await AddressBook.new()
  })

  describe('Set otoken implementation address', () => {
    it('should revert adding otoken implementation address from non-owner address', async () => {
      await expectRevert(addressBook.setOtokenImpl(otokenImplAdd, { from: random }), 'Ownable: caller is not the owner')
    })

    it('should set otoken implementation address', async () => {
      await addressBook.setOtokenImpl(otokenImplAdd, { from: owner })

      assert.equal(await addressBook.getOtokenImpl(), otokenImplAdd, 'Otoken implementation address mismatch')
    })
  })

  describe('Set controller', () => {
    let controller: ControllerInstance

    before(async () => {
      const lib = await MarginVault.new()
      await Controller.link('MarginVault', lib.address)
      controller = await Controller.new()
    })

    it('should revert adding controller from non-owner address', async () => {
      await expectRevert(
        addressBook.setController(controller.address, { from: random }),
        'Ownable: caller is not the owner',
      )
    })

    it('should set controller address', async () => {
      await addressBook.setController(controller.address, { from: owner })

      const proxy: OwnedUpgradeabilityProxyInstance = await OwnedUpgradeabilityProxy.at(
        await addressBook.getController(),
      )
      const implementationAddress = await proxy.implementation()

      assert.equal(controller.address, implementationAddress, 'Controller implementation address mismatch')
    })
  })

  describe('Set otoken factory', () => {
    let otokenFactory: OtokenFactoryInstance

    before(async () => {
      otokenFactory = await OtokenFactory.new(addressBook.address)
    })

    it('should revert adding otoken factory address from non-owner address', async () => {
      await expectRevert(
        addressBook.setOtokenFactory(otokenFactory.address, { from: random }),
        'Ownable: caller is not the owner',
      )
    })

    it('should set otoken factory address', async () => {
      await addressBook.setOtokenFactory(otokenFactory.address, { from: owner })

      assert.equal(await addressBook.getOtokenFactory(), otokenFactory.address, 'Otoken factory address mismatch')
    })
  })

  describe('Set whitelist', () => {
    let whitelist: WhitelistInstance

    before(async () => {
      whitelist = await Whitelist.new(addressBook.address)
    })

    it('should revert adding whitelist address from non-owner address', async () => {
      await expectRevert(
        addressBook.setWhitelist(whitelist.address, { from: random }),
        'Ownable: caller is not the owner',
      )
    })

    it('should set whitelist address', async () => {
      await addressBook.setWhitelist(whitelist.address, { from: owner })

      assert.equal(await addressBook.getWhitelist(), whitelist.address, 'Whitelist address mismatch')
    })
  })

  describe('Set margin pool', () => {
    it('should revert adding pool address from non-owner address', async () => {
      await expectRevert(addressBook.setMarginPool(marginPoolAdd, { from: random }), 'Ownable: caller is not the owner')
    })

    it('should set pool address', async () => {
      await addressBook.setMarginPool(marginPoolAdd, { from: owner })

      assert.equal(await addressBook.getMarginPool(), marginPoolAdd, 'Pool address mismatch')
    })
  })

  describe('Set liquidation manager', () => {
    it('should revert adding liquidation manager address from non-owner address', async () => {
      await expectRevert(
        addressBook.setLiquidationManager(liquidationManagerImpl, { from: random }),
        'Ownable: caller is not the owner',
      )
    })

    it('should set liquidation manager address', async () => {
      await addressBook.setLiquidationManager(liquidationManagerImpl, { from: owner })

      assert.equal(
        liquidationManagerImpl,
        await addressBook.getLiquidationManager(),
        'liquidation manager implementation address mismatch',
      )
    })
  })

  describe('Set oracle', () => {
    let oracle: OracleInstance

    before(async () => {
      oracle = await Oracle.new(addressBook.address)
    })

    it('should revert adding oracle address from non-owner address', async () => {
      await expectRevert(
        addressBook.setLiquidationManager(oracle.address, { from: random }),
        'Ownable: caller is not the owner',
      )
    })

    it('should set oracle address', async () => {
      await addressBook.setOracle(oracle.address, { from: owner })

      assert.equal(oracle.address, await addressBook.getOracle(), 'Oracle module implementation address mismatch')
    })
  })

  describe('Set margin calculator', () => {
    let marginCalculator: MarginCalculatorInstance

    before(async () => {
      const oracleAddress = await addressBook.getOracle()
      marginCalculator = await MarginCalculator.new(oracleAddress, addressBook.address)
    })

    it('should revert adding margin calculator address from non-owner address', async () => {
      await expectRevert(
        addressBook.setMarginCalculator(marginCalculator.address, { from: random }),
        'Ownable: caller is not the owner',
      )
    })

    it('should set margin calculator address', async () => {
      await addressBook.setMarginCalculator(marginCalculator.address, { from: owner })

      assert.equal(
        marginCalculator.address,
        await addressBook.getMarginCalculator(),
        'Margin calculator implementation address mismatch',
      )
    })
  })

  describe('Set arbitrary address', () => {
    const modulekey = web3.utils.soliditySha3('newModule')
    let module: UpgradeableContractV1Instance

    before(async () => {
      module = await UpgradeableContractV1.new()
    })

    it('should revert adding arbitrary key:address from non-owner address', async () => {
      await expectRevert(
        addressBook.updateImpl(modulekey, module.address, { from: random }),
        'Ownable: caller is not the owner',
      )
    })

    it('should set new module key and address', async () => {
      await addressBook.updateImpl(modulekey, module.address, { from: owner })

      const proxy: OwnedUpgradeabilityProxyInstance = await OwnedUpgradeabilityProxy.at(
        await addressBook.getAddress(modulekey),
      )
      const implementationAddress = await proxy.implementation()

      assert.equal(module.address, implementationAddress, 'New module implementation address mismatch')
    })
  })

  describe('Upgrade contract', async () => {
    const key = web3.utils.soliditySha3('ammModule')

    let v1Contract: UpgradeableContractV1Instance
    let v2Contract: UpgradeableContractV2Instance

    before(async () => {
      v1Contract = await UpgradeableContractV1.new()

      await addressBook.updateImpl(key, v1Contract.address, { from: owner })

      const proxy: OwnedUpgradeabilityProxyInstance = await OwnedUpgradeabilityProxy.at(
        await addressBook.getAddress(key),
      )
      const implementationAddress = await proxy.implementation()

      assert.equal(v1Contract.address, implementationAddress, 'AMM module implementation address mismatch')
      assert.equal((await v1Contract.getV1Version()).toString(), '1', 'AMM implementation version mismatch')
    })

    it('should upgrade contract from V1 to V2', async () => {
      // deploy V2 implementation
      v2Contract = await UpgradeableContractV2.new()

      const v1Proxy: OwnedUpgradeabilityProxyInstance = await OwnedUpgradeabilityProxy.at(
        await addressBook.getAddress(key),
      )
      const v1ImplementationAddress = await v1Proxy.implementation()

      assert.notEqual(v2Contract.address, v1ImplementationAddress, 'AMM v1 and v2 have same implementation address')

      await addressBook.updateImpl(key, v2Contract.address, { from: owner })

      const v2Proxy: OwnedUpgradeabilityProxyInstance = await OwnedUpgradeabilityProxy.at(
        await addressBook.getAddress(key),
      )
      const v2ImplementationAddress = await v2Proxy.implementation()

      assert.equal(v2Contract.address, v2ImplementationAddress, 'AMM V2 implementation address mismatch')
      assert.equal(v1Proxy.address, v2Proxy.address, 'AMM proxy address mismatch')

      v2Contract = await UpgradeableContractV2.at(await addressBook.getAddress(key))

      assert.equal((await v2Contract.getV2Version()).toString(), '2', 'AMM implementation version mismatch')
    })
  })
})
