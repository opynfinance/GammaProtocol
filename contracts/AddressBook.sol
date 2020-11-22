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
    /// @dev Otoken implementation key
    bytes32 private constant OTOKEN_IMPL = keccak256("OTOKEN_IMPL");
    /// @dev OtokenFactory key
    bytes32 private constant OTOKEN_FACTORY = keccak256("OTOKEN_FACTORY");
    /// @dev Whitelist key
    bytes32 private constant WHITELIST = keccak256("WHITELIST");
    /// @dev Controller key
    bytes32 private constant CONTROLLER = keccak256("CONTROLLER");
    /// @dev MarginPool key
    bytes32 private constant MARGIN_POOL = keccak256("MARGIN_POOL");
    /// @dev MarginCalculator key
    bytes32 private constant MARGIN_CALCULATOR = keccak256("MARGIN_CALCULATOR");
    /// @dev LiquidationManager key
    bytes32 private constant LIQUIDATION_MANAGER = keccak256("LIQUIDATION_MANAGER");
    /// @dev Oracle key
    bytes32 private constant ORACLE = keccak256("ORACLE");

    /// @dev mapping between key and address
    mapping(bytes32 => address) private addresses;

    /// @notice emits an event when a new proxy is created
    event ProxyCreated(bytes32 indexed id, address indexed proxy);
    /// @notice emits an event when a new address is added
    event AddressAdded(bytes32 indexed id, address indexed add);

    /**
     * @notice return Otoken implementation address
     * @return Otoken implementation address
     */
    function getOtokenImpl() external view returns (address) {
        return getAddress(OTOKEN_IMPL);
    }

    /**
     * @notice return oTokenFactory address
     * @return OtokenFactory address
     */
    function getOtokenFactory() external view returns (address) {
        return getAddress(OTOKEN_FACTORY);
    }

    /**
     * @notice return Whitelist address
     * @return Whitelist address
     */
    function getWhitelist() external view returns (address) {
        return getAddress(WHITELIST);
    }

    /**
     * @notice return Controller address
     * @return Controller address
     */
    function getController() external view returns (address) {
        return getAddress(CONTROLLER);
    }

    /**
     * @notice return MarginPool address
     * @return MarginPool address
     */
    function getMarginPool() external view returns (address) {
        return getAddress(MARGIN_POOL);
    }

    /**
     * @notice return MarginCalculator address
     * @return MarginCalculator address
     */
    function getMarginCalculator() external view returns (address) {
        return getAddress(MARGIN_CALCULATOR);
    }

    /**
     * @notice return LiquidationManager address
     * @return LiquidationManager address
     */
    function getLiquidationManager() external view returns (address) {
        return getAddress(LIQUIDATION_MANAGER);
    }

    /**
     * @notice return Oracle address
     * @return Oracle address
     */
    function getOracle() external view returns (address) {
        return getAddress(ORACLE);
    }

    /**
     * @notice set Otoken implementation address
     * @dev can only be called by the addressbook owner
     * @param _otokenImpl Otoken implementation address
     */
    function setOtokenImpl(address _otokenImpl) external onlyOwner {
        setAddress(OTOKEN_IMPL, _otokenImpl);
    }

    /**
     * @notice set OtokenFactory address
     * @dev can only be called by the addressbook owner
     * @param _otokenFactory OtokenFactory address
     */
    function setOtokenFactory(address _otokenFactory) external onlyOwner {
        setAddress(OTOKEN_FACTORY, _otokenFactory);
    }

    /**
     * @notice set Whitelist address
     * @dev can only be called by the addressbook owner
     * @param _whitelist Whitelist address
     */
    function setWhitelist(address _whitelist) external onlyOwner {
        setAddress(WHITELIST, _whitelist);
    }

    /**
     * @notice set Controller address
     * @dev can only be called by the addressbook owner
     * @param _controller Controller address
     */
    function setController(address _controller) external onlyOwner {
        updateImpl(CONTROLLER, _controller);
    }

    /**
     * @notice set MarginPool address
     * @dev can only be called by the addressbook owner
     * @param _marginPool MarginPool address
     */
    function setMarginPool(address _marginPool) external onlyOwner {
        setAddress(MARGIN_POOL, _marginPool);
    }

    /**
     * @notice set MarginCalculator address
     * @dev can only be called by the addressbook owner
     * @param _marginCalculator MarginCalculator address
     */
    function setMarginCalculator(address _marginCalculator) external onlyOwner {
        setAddress(MARGIN_CALCULATOR, _marginCalculator);
    }

    /**
     * @notice set LiquidationManager address
     * @dev can only be called by the addressbook owner
     * @param _liquidationManager LiquidationManager address
     */
    function setLiquidationManager(address _liquidationManager) external onlyOwner {
        setAddress(LIQUIDATION_MANAGER, _liquidationManager);
    }

    /**
     * @notice set Oracle address
     * @dev can only be called by the addressbook owner
     * @param _oracle Oracle address
     */
    function setOracle(address _oracle) external onlyOwner {
        setAddress(ORACLE, _oracle);
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
     * @dev can only be called by the addressbook owner
     * @param _key key
     * @param _address address
     */
    function setAddress(bytes32 _key, address _address) public onlyOwner {
        addresses[_key] = _address;

        emit AddressAdded(_key, _address);
    }

    /**
     * @dev function to update the implementation of a specific component of the protocol
     * @param _id id of the contract to be updated
     * @param _newAddress address of the new implementation
     **/
    function updateImpl(bytes32 _id, address _newAddress) public onlyOwner {
        address payable proxyAddress = address(uint160(getAddress(_id)));

        if (proxyAddress == address(0)) {
            bytes memory params = abi.encodeWithSignature("initialize(address,address)", address(this), owner());
            OwnedUpgradeabilityProxy proxy = new OwnedUpgradeabilityProxy();
            setAddress(_id, address(proxy));
            emit ProxyCreated(_id, address(proxy));
            proxy.upgradeToAndCall(_newAddress, params);
        } else {
            OwnedUpgradeabilityProxy proxy = OwnedUpgradeabilityProxy(proxyAddress);
            proxy.upgradeTo(_newAddress);
        }
    }
}
