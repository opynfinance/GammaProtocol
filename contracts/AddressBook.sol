/**
 * SPDX-License-Identifier: UNLICENSED
 */
pragma solidity 0.6.10;

import {Ownable} from "./packages/oz/Ownable.sol";
import {OwnedUpgradeabilityProxy} from "./packages/openzeppelin-upgradeability/OwnedUpgradeabilityProxy.sol";

/**
 * @author Opyn Team
 * @title AddressBook Module
 */
contract AddressBook is Ownable {
    bytes32 private constant OTOKEN_IMPL = "OTOKEN_IMPL";
    bytes32 private constant OTOKEN_FACTORY = "OTOKEN_FACTORY";
    bytes32 private constant MARGIN_WHITELIST = "MARGIN_WHITELIST";
    bytes32 private constant CONTROLLER = "CONTROLLER";
    bytes32 private constant MARGIN_POOL = "MARGIN_POOL";
    bytes32 private constant MARGIN_CALCULATOR = "MARGIN_CALCULATOR";
    bytes32 private constant LIQUIDATION_MANAGER = "LIQUIDATION_MANAGER";
    bytes32 private constant ORACLE = "ORACLE";
    bytes32 private constant WETH = "WETH";

    /// @dev a mapping between key and address
    mapping(bytes32 => address) private addresses;

    /// @notice event emitted when a new proxy get created
    event ProxyCreated(bytes32 id, address proxy);

    function getAddress(bytes32 _key) public view returns (address) {
        return addresses[_key];
    }

    function getOtokenImpl() external view returns (address) {
        return getAddress(OTOKEN_IMPL);
    }

    function getOtokenFactory() external view returns (address) {
        return getAddress(OTOKEN_FACTORY);
    }

    function getWhitelist() external view returns (address) {
        return getAddress(MARGIN_WHITELIST);
    }

    function getController() external view returns (address) {
        return getAddress(CONTROLLER);
    }

    function getMarginPool() external view returns (address) {
        return getAddress(MARGIN_POOL);
    }

    function getMarginCalculator() external view returns (address) {
        return getAddress(MARGIN_CALCULATOR);
    }

    function getLiquidationManager() external view returns (address) {
        return getAddress(LIQUIDATION_MANAGER);
    }

    function getOracle() external view returns (address) {
        return getAddress(ORACLE);
    }

    function getWeth() external view returns (address) {
        return getAddress(WETH);
    }

    function setAddress(bytes32 _key, address _module) public onlyOwner {
        addresses[_key] = _module;
    }

    function setOtokenImpl(address _otokenImpl) external onlyOwner {
        setAddress(OTOKEN_IMPL, _otokenImpl);
    }

    function setOtokenFactory(address _otokenFactory) external onlyOwner {
        updateImplInternal(OTOKEN_FACTORY, _otokenFactory);
    }

    function setWhitelist(address _whitelist) external onlyOwner {
        updateImplInternal(MARGIN_WHITELIST, _whitelist);
    }

    function setController(address _controller) external onlyOwner {
        updateImplInternal(CONTROLLER, _controller);
    }

    function setMarginPool(address _marginPool) external onlyOwner {
        updateImplInternal(MARGIN_POOL, _marginPool);
    }

    function setMarginCalculator(address _marginCalculator) external onlyOwner {
        updateImplInternal(MARGIN_CALCULATOR, _marginCalculator);
    }

    function setLiquidationManager(address _liquidationManager) external onlyOwner {
        updateImplInternal(LIQUIDATION_MANAGER, _liquidationManager);
    }

    function setOracle(address _oracle) external onlyOwner {
        updateImplInternal(ORACLE, _oracle);
    }

    function setWeth(address _weth) external onlyOwner {
        setAddress(WETH, _weth);
    }

    /**
     * @dev internal function to update the implementation of a specific component of the protocol
     * @param _id the id of the contract to be updated
     * @param _newAddress the address of the new implementation
     **/
    function updateImplInternal(bytes32 _id, address _newAddress) public onlyOwner {
        address payable proxyAddress = address(uint160(getAddress(_id)));

        OwnedUpgradeabilityProxy proxy = OwnedUpgradeabilityProxy(proxyAddress);
        bytes memory params = abi.encodeWithSignature("initialize(address)", address(this));

        if (proxyAddress == address(0)) {
            proxy = new OwnedUpgradeabilityProxy();
            proxy.upgradeToAndCall(_newAddress, params);
            setAddress(_id, address(proxy));
            emit ProxyCreated(_id, address(proxy));
        } else {
            proxy.upgradeToAndCall(_newAddress, params);
        }
    }
}
