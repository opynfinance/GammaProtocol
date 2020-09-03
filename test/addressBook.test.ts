import {
  MockERC20Instance,
  WhitelistInstance,
  OtokenFactoryInstance,
  UpgradeableContractV1Instance,
  UpgradeableContractV2Instance,
  OwnedUpgradeabilityProxyInstance,
  AddressBookInstance,
} from '../build/types/truffle-types'

const {expectRevert} = require('@openzeppelin/test-helpers')

const MockERC20 = artifacts.require('MockERC20.sol')
const OtokenFactory = artifacts.require('OtokenFactory.sol')
const UpgradeableContractV1 = artifacts.require('UpgradeableContractV1.sol')
const UpgradeableContractV2 = artifacts.require('UpgradeableContractV2.sol')
const OwnedUpgradeabilityProxy = artifacts.require('OwnedUpgradeabilityProxy.sol')
const AddressBook = artifacts.require('AddressBook.sol')
const Whitelist = artifacts.require('Whitelist.sol')

contract('AddressBook', ([owner, otokenImplAdd, marginPoolAdd, random]) => {
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
      await expectRevert(addressBook.setOtokenImpl(otokenImplAdd, {from: random}), 'Ownable: caller is not the owner')
    })

    it('should set otoken implementation address', async () => {
      await addressBook.setOtokenImpl(otokenImplAdd, {from: owner})

      assert.equal(await addressBook.getOtokenImpl(), otokenImplAdd, 'Otoken implementation address mismatch')
    })
  })

  describe('Set controller', () => {
    let controller: UpgradeableContractV1Instance

    before(async () => {
      controller = await UpgradeableContractV1.new()
    })

    it('should revert adding controller from non-owner address', async () => {
      await expectRevert(
        addressBook.setController(controller.address, {from: random}),
        'Ownable: caller is not the owner',
      )
    })

    it('should set controller address', async () => {
      await addressBook.setController(controller.address, {from: owner})

      const proxy: OwnedUpgradeabilityProxyInstance = await OwnedUpgradeabilityProxy.at(
        await addressBook.getController(),
      )
      const implementationAddress = await proxy.implementation()

      assert.equal(controller.address, implementationAddress, 'Controller implementation address mismatch')

      controller = await UpgradeableContractV1.at(await addressBook.getController())

      assert.equal((await controller.CONTRACT_REVISION()).toString(), '1', 'Controller implementation version mismatch')
    })
  })

  describe('Set otoken factory', () => {
    let otokenFactory: OtokenFactoryInstance

    before(async () => {
      otokenFactory = await OtokenFactory.new(addressBook.address)
    })

    it('should revert adding otoken factory address from non-owner address', async () => {
      await expectRevert(
        addressBook.setOtokenFactory(otokenFactory.address, {from: random}),
        'Ownable: caller is not the owner',
      )
    })

    it('should set otoken factory address', async () => {
      await addressBook.setOtokenFactory(otokenFactory.address, {from: owner})

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
        addressBook.setWhitelist(whitelist.address, {from: random}),
        'Ownable: caller is not the owner',
      )
    })

    it('should set whitelist address', async () => {
      await addressBook.setWhitelist(whitelist.address, {from: owner})

      assert.equal(await addressBook.getWhitelist(), whitelist.address, 'Whitelist address mismatch')
    })
  })

  describe('Set margin pool', () => {
    it('should revert adding pool address from non-owner address', async () => {
      await expectRevert(addressBook.setMarginPool(marginPoolAdd, {from: random}), 'Ownable: caller is not the owner')
    })

    it('should set pool address', async () => {
      await addressBook.setMarginPool(marginPoolAdd, {from: owner})

      assert.equal(await addressBook.getMarginPool(), marginPoolAdd, 'Pool address mismatch')
    })
  })

  describe('Set margin calculator', () => {
    let marginCalculator: UpgradeableContractV1Instance

    before(async () => {
      marginCalculator = await UpgradeableContractV1.new()
    })

    it('should revert adding margin calculator address from non-owner address', async () => {
      await expectRevert(
        addressBook.setMarginCalculator(marginCalculator.address, {from: random}),
        'Ownable: caller is not the owner',
      )
    })

    it('should set margin calculator address', async () => {
      await addressBook.setMarginCalculator(marginCalculator.address, {from: owner})

      const proxy: OwnedUpgradeabilityProxyInstance = await OwnedUpgradeabilityProxy.at(
        await addressBook.getMarginCalculator(),
      )
      const implementationAddress = await proxy.implementation()

      assert.equal(marginCalculator.address, implementationAddress, 'Margin calculator implementation address mismatch')

      marginCalculator = await UpgradeableContractV1.at(await addressBook.getMarginCalculator())

      assert.equal(
        (await marginCalculator.CONTRACT_REVISION()).toString(),
        '1',
        'Margin calculator implementation version mismatch',
      )
    })
  })

  describe('Set liquidation manager', () => {
    let liquidationManager: UpgradeableContractV1Instance

    before(async () => {
      liquidationManager = await UpgradeableContractV1.new()
    })

    it('should revert adding liquidation manager address from non-owner address', async () => {
      await expectRevert(
        addressBook.setLiquidationManager(liquidationManager.address, {from: random}),
        'Ownable: caller is not the owner',
      )
    })

    it('should set liquidation manager address', async () => {
      await addressBook.setLiquidationManager(liquidationManager.address, {from: owner})

      const proxy: OwnedUpgradeabilityProxyInstance = await OwnedUpgradeabilityProxy.at(
        await addressBook.getLiquidationManager(),
      )
      const implementationAddress = await proxy.implementation()

      assert.equal(
        liquidationManager.address,
        implementationAddress,
        'Liquidation manager implementation address mismatch',
      )

      liquidationManager = await UpgradeableContractV1.at(await addressBook.getLiquidationManager())

      assert.equal(
        (await liquidationManager.CONTRACT_REVISION()).toString(),
        '1',
        'Liquidation manager implementation version mismatch',
      )
    })
  })

  describe('Set oracle', () => {
    let oracle: UpgradeableContractV1Instance

    before(async () => {
      oracle = await UpgradeableContractV1.new()
    })

    it('should revert adding oracle address from non-owner address', async () => {
      await expectRevert(
        addressBook.setLiquidationManager(oracle.address, {from: random}),
        'Ownable: caller is not the owner',
      )
    })

    it('should set oracle address', async () => {
      await addressBook.setOracle(oracle.address, {from: owner})

      const proxy: OwnedUpgradeabilityProxyInstance = await OwnedUpgradeabilityProxy.at(await addressBook.getOracle())
      const implementationAddress = await proxy.implementation()

      assert.equal(oracle.address, implementationAddress, 'Oracle implementation address mismatch')

      oracle = await UpgradeableContractV1.at(await addressBook.getOracle())

      assert.equal((await oracle.CONTRACT_REVISION()).toString(), '1', 'Oracle implementation version mismatch')
    })
  })

  describe('Set weth', () => {
    it('should revert adding weth address from non-owner address', async () => {
      await expectRevert(addressBook.setWeth(weth.address, {from: random}), 'Ownable: caller is not the owner')
    })

    it('should set weth address', async () => {
      await addressBook.setWeth(weth.address, {from: owner})

      assert.equal(await addressBook.getWeth(), weth.address, 'WETH address mismatch')
    })
  })

  describe('Set arbitrary address', () => {
    const modulekey = web3.utils.fromAscii('newModule')
    let module: UpgradeableContractV1Instance

    before(async () => {
      module = await UpgradeableContractV1.new()
    })

    it('should revert adding arbitrary key:address from non-owner address', async () => {
      await expectRevert(
        addressBook.updateImpl(modulekey, module.address, {from: random}),
        'Ownable: caller is not the owner',
      )
    })

    it('should set new module key and address', async () => {
      await addressBook.updateImpl(modulekey, module.address, {from: owner})

      const proxy: OwnedUpgradeabilityProxyInstance = await OwnedUpgradeabilityProxy.at(
        await addressBook.getAddress(modulekey),
      )
      const implementationAddress = await proxy.implementation()

      assert.equal(module.address, implementationAddress, 'New module implementation address mismatch')
    })
  })

  describe('Upgrade contract', async () => {
    let v2Controller: UpgradeableContractV2Instance

    before(async () => {
      v2Controller = await UpgradeableContractV2.new()
    })

    it('should upgrade contract from V1 to V2', async () => {
      const v1Proxy: OwnedUpgradeabilityProxyInstance = await OwnedUpgradeabilityProxy.at(
        await addressBook.getController(),
      )
      const v1ImplementationAddress = await v1Proxy.implementation()

      assert.notEqual(v2Controller.address, v1ImplementationAddress, 'Controller V1 implementation address mismatch')

      await addressBook.setController(v2Controller.address, {from: owner})

      const v2Proxy: OwnedUpgradeabilityProxyInstance = await OwnedUpgradeabilityProxy.at(
        await addressBook.getController(),
      )
      const v2ImplementationAddress = await v2Proxy.implementation()

      assert.equal(v2Controller.address, v2ImplementationAddress, 'Controller V2 implementation address mismatch')
      assert.equal(v1Proxy.address, v2Proxy.address, 'Controller proxy address mismatch')

      v2Controller = await UpgradeableContractV2.at(await addressBook.getController())

      assert.equal(
        (await v2Controller.CONTRACT_REVISION()).toString(),
        '2',
        'Controller implementation version mismatch',
      )
    })
  })
})
