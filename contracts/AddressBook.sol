/**
 * SPDX-License-Identifier: UNLICENSED
 */
pragma solidity 0.6.10;

import {Ownable} from "./packages/oz/Ownable.sol";
import {OwnedUpgradeabilityProxy} from "./packages/oz/upgradeability/OwnedUpgradeabilityProxy.sol";

/**
 * @author Opyn Team
 * @title AddressBook Module
 */
contract AddressBook is Ownable {
    /// @dev otoken implementation key
    bytes32 private constant OTOKEN_IMPL = "OTOKEN_IMPL";
    /// @dev otoken factory key
    bytes32 private constant OTOKEN_FACTORY = "OTOKEN_FACTORY";
    /// @dev whitelist key
    bytes32 private constant WHITELIST = "WHITELIST";
    /// @dev controller key
    bytes32 private constant CONTROLLER = "CONTROLLER";
    /// @dev pool key
    bytes32 private constant MARGIN_POOL = "MARGIN_POOL";
    /// @dev margin calculator key
    bytes32 private constant MARGIN_CALCULATOR = "MARGIN_CALCULATOR";
    /// @dev liquidation manager key
    bytes32 private constant LIQUIDATION_MANAGER = "LIQUIDATION_MANAGER";
    /// @dev oracle key
    bytes32 private constant ORACLE = "ORACLE";
    /// @dev weth token key
    bytes32 private constant WETH = "WETH";

    /// @dev a mapping between key and address
    mapping(bytes32 => address) private addresses;

    /// @notice event emitted when a new proxy get created
    event ProxyCreated(bytes32 id, address proxy);
    /// @notice event emitted when a new address get added
    event AddressAdded(bytes32 id, address add);

    /**
     * @notice return otoken implementation address
     * @return otoken implementation address
     */
    function getOtokenImpl() external view returns (address) {
        return getAddress(OTOKEN_IMPL);
    }

    /**
     * @notice return otoken factory address
     * @return otoken factory address
     */
    function getOtokenFactory() external view returns (address) {
        return getAddress(OTOKEN_FACTORY);
    }

    /**
     * @notice return whitelist address
     * @return whitelist address
     */
    function getWhitelist() external view returns (address) {
        return getAddress(WHITELIST);
    }

    /**
     * @notice return controller address
     * @return controller address
     */
    function getController() external view returns (address) {
        return getAddress(CONTROLLER);
    }

    /**
     * @notice return pool address
     * @return pool address
     */
    function getMarginPool() external view returns (address) {
        return getAddress(MARGIN_POOL);
    }

    /**
     * @notice return margin calculator address
     * @return margin calculator address
     */
    function getMarginCalculator() external view returns (address) {
        return getAddress(MARGIN_CALCULATOR);
    }

    /**
     * @notice return liquidation manager address
     * @return liquidation manager address
     */
    function getLiquidationManager() external view returns (address) {
        return getAddress(LIQUIDATION_MANAGER);
    }

    /**
     * @notice return oracle address
     * @return oracle address
     */
    function getOracle() external view returns (address) {
        return getAddress(ORACLE);
    }

    /**
     * @notice return WETH token
     * @return WETH address
     */
    function getWeth() external view returns (address) {
        return getAddress(WETH);
    }

    /**
     * @notice set otoken implementation address
     * @dev can only be called by addressbook owner
     * @param _otokenImpl otoken implementation address
     */
    function setOtokenImpl(address _otokenImpl) external onlyOwner {
        setAddress(OTOKEN_IMPL, _otokenImpl);
    }

    /**
     * @notice set otoken factory address
     * @dev can only be called by addressbook owner
     * @param _otokenFactory otoken factory address
     */
    function setOtokenFactory(address _otokenFactory) external onlyOwner {
        setAddress(OTOKEN_FACTORY, _otokenFactory);
    }

    /**
     * @notice set whitelist address
     * @dev can only be called by addressbook owner
     * @param _whitelist whitelist address
     */
    function setWhitelist(address _whitelist) external onlyOwner {
        setAddress(WHITELIST, _whitelist);
    }

    /**
     * @notice set controller address
     * @dev can only be called by addressbook owner
     * @param _controller controller address
     */
    function setController(address _controller) external onlyOwner {
        updateImpl(CONTROLLER, _controller);
    }

    /**
     * @notice set pool address
     * @dev can only be called by addressbook owner
     * @param _marginPool pool address
     */
    function setMarginPool(address _marginPool) external onlyOwner {
        setAddress(MARGIN_POOL, _marginPool);
    }

    /**
     * @notice set margin calculator address
     * @dev can only be called by addressbook owner
     * @param _marginCalculator margin calculator address
     */
    function setMarginCalculator(address _marginCalculator) external onlyOwner {
        setAddress(MARGIN_CALCULATOR, _marginCalculator);
    }

    /**
     * @notice set liquidation manager address
     * @dev can only be called by addressbook owner
     * @param _liquidationManager liquidation manager address
     */
    function setLiquidationManager(address _liquidationManager) external onlyOwner {
        setAddress(LIQUIDATION_MANAGER, _liquidationManager);
    }

    /**
     * @notice set oracle address
     * @dev can only be called by addressbook owner
     * @param _oracle oracle address
     */
    function setOracle(address _oracle) external onlyOwner {
        setAddress(ORACLE, _oracle);
    }

    /**
     * @notice set WETH address
     * @dev can only be called by addressbook owner
     * @param _weth weth address
     */
    function setWeth(address _weth) external onlyOwner {
        setAddress(WETH, _weth);
    }

    /**
     * @notice return an address for specific key
     * @param _key key address
     * @return address
     */
    function getAddress(bytes32 _key) public view returns (address) {
        return addresses[_key];
    }

    /**
     * @notice set a specific address for a specific key
     * @dev can only be called by addressbook owner
     * @param _key key
     * @param _address address
     */
    function setAddress(bytes32 _key, address _address) public onlyOwner {
        addresses[_key] = _address;

        emit AddressAdded(_key, _address);
    }

    /**
     * @dev internal function to update the implementation of a specific component of the protocol
     * @param _id the id of the contract to be updated
     * @param _newAddress the address of the new implementation
     **/
    function updateImpl(bytes32 _id, address _newAddress) public onlyOwner {
        address payable proxyAddress = address(uint160(getAddress(_id)));

        bytes memory params = abi.encodeWithSignature("initialize(address,address)", address(this), owner());

        if (proxyAddress == address(0)) {
            OwnedUpgradeabilityProxy proxy = new OwnedUpgradeabilityProxy();
            setAddress(_id, address(proxy));
            emit ProxyCreated(_id, address(proxy));
            proxy.upgradeToAndCall(_newAddress, params);
        } else {
            OwnedUpgradeabilityProxy proxy = OwnedUpgradeabilityProxy(proxyAddress);
            proxy.upgradeToAndCall(_newAddress, params);
        }
    }
}
