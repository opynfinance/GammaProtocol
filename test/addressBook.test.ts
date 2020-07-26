import {
  MockERC20Instance,
  MockAddressBookInstance,
  WhitelistInstance,
  UpgradeableContractV1Instance,
  UpgradeableContractV2Instance,
  OwnedUpgradeabilityProxyInstance,
  AddressBookInstance,
} from '../build/types/truffle-types'

const {expectEvent, expectRevert} = require('@openzeppelin/test-helpers')

const MockERC20 = artifacts.require('MockERC20.sol')
const UpgradeableContractV1 = artifacts.require('UpgradeableContractV1.sol')
const UpgradeableContractV2 = artifacts.require('UpgradeableContractV2.sol')
const OwnedUpgradeabilityProxy = artifacts.require('OwnedUpgradeabilityProxy.sol')
const AddressBook = artifacts.require('AddressBook.sol')
const Whitelist = artifacts.require('Whitelist.sol')
// address(0)

contract('AddressBook', ([owner, otokenImplAdd, random]) => {
  // ERC20 mocks
  let weth: MockERC20Instance
  // addressbook instance
  let addressBook: AddressBookInstance

  before('Deployment', async () => {
    // deploy WETH token
    weth = await MockERC20.new('WETH', 'WETH')
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

    it('should revert adding otoken implementation address from non-owner address', async () => {
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
    let otokenFactory: UpgradeableContractV1Instance

    before(async () => {
      otokenFactory = await UpgradeableContractV1.new()
    })

    it('should revert adding otoken factory address from non-owner address', async () => {
      await expectRevert(
        addressBook.setOtokenFactory(otokenFactory.address, {from: random}),
        'Ownable: caller is not the owner',
      )
    })

    it('should set otoken factory address', async () => {
      await addressBook.setOtokenFactory(otokenFactory.address, {from: owner})

      const proxy: OwnedUpgradeabilityProxyInstance = await OwnedUpgradeabilityProxy.at(
        await addressBook.getOtokenFactory(),
      )
      const implementationAddress = await proxy.implementation()

      assert.equal(otokenFactory.address, implementationAddress, 'Otoken factory implementation address mismatch')

      otokenFactory = await UpgradeableContractV1.at(await addressBook.getOtokenFactory())

      assert.equal(
        (await otokenFactory.CONTRACT_REVISION()).toString(),
        '1',
        'Otoken factory implementation version mismatch',
      )
    })
  })

  describe('Set whitelist', () => {
    let whitelist: UpgradeableContractV1Instance

    before(async () => {
      whitelist = await UpgradeableContractV1.new()
    })

    it('should revert adding whitelist address from non-owner address', async () => {
      await expectRevert(
        addressBook.setWhitelist(whitelist.address, {from: random}),
        'Ownable: caller is not the owner',
      )
    })

    it('should set whitelist address', async () => {
      await addressBook.setWhitelist(whitelist.address, {from: owner})

      const proxy: OwnedUpgradeabilityProxyInstance = await OwnedUpgradeabilityProxy.at(
        await addressBook.getWhitelist(),
      )
      const implementationAddress = await proxy.implementation()

      assert.equal(whitelist.address, implementationAddress, 'Whitelist implementation address mismatch')

      whitelist = await UpgradeableContractV1.at(await addressBook.getOtokenFactory())

      assert.equal((await whitelist.CONTRACT_REVISION()).toString(), '1', 'Whitelist implementation version mismatch')
    })
  })

  describe('Set margin pool', () => {
    let marginPool: UpgradeableContractV1Instance

    before(async () => {
      marginPool = await UpgradeableContractV1.new()
    })

    it('should revert adding pool address from non-owner address', async () => {
      await expectRevert(
        addressBook.setMarginPool(marginPool.address, {from: random}),
        'Ownable: caller is not the owner',
      )
    })

    it('should set pool address', async () => {
      await addressBook.setMarginPool(marginPool.address, {from: owner})

      const proxy: OwnedUpgradeabilityProxyInstance = await OwnedUpgradeabilityProxy.at(
        await addressBook.getMarginPool(),
      )
      const implementationAddress = await proxy.implementation()

      assert.equal(marginPool.address, implementationAddress, 'Pool implementation address mismatch')

      marginPool = await UpgradeableContractV1.at(await addressBook.getMarginPool())

      assert.equal((await marginPool.CONTRACT_REVISION()).toString(), '1', 'Pool implementation version mismatch')
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
