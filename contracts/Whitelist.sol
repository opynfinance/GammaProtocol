// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.10;

import "./interfaces/AddressBookInterface.sol";
import "./packages/oz/Ownable.sol";

/**
 * @author Opyn Team
 * @title Whitelist Module
 * @notice The whitelist module keeps track of all valid Otoken contracts.
 */
contract Whitelist is Ownable {
    /// @notice AddressBook module address
    address public addressBook;
    /// @dev mapping to track whitelisted product
    mapping(bytes32 => bool) internal whitelistedProduct;
    /// @dev mapping to track whitelised collateral
    mapping(address => bool) internal whitelistedCollateral;
    /// @dev mapping to track whitelisted otokens
    mapping(address => bool) internal whitelistedOtoken;

    /**
     * @dev constructor
     * @param _addressBook AddressBook module address
     */
    constructor(address _addressBook) public {
        require(_addressBook != address(0), "Invalid address book");

        addressBook = _addressBook;
    }

    /// @notice emitted when owner whitelist a product
    event ProductWhitelisted(
        bytes32 productHash,
        address indexed underlying,
        address indexed strike,
        address indexed collateral
    );
    /// @notice emitted when owner blacklist a product
    event ProductBlacklisted(
        bytes32 productHash,
        address indexed underlying,
        address indexed strike,
        address indexed collateral
    );
    /// @notice emits an event when a collateral address is whitelisted by the owner address
    event CollateralWhitelisted(address indexed collateral);
    /// @notice emits an event when a collateral address is blacklist by the owner address
    event CollateralBlacklisted(address indexed collateral);
    /// @notice emitted when Otoken Factory module whitelist an otoken
    event OtokenWhitelisted(address indexed otoken);
    /// @notice emitted when owner blacklist an otoken
    event OtokenBlacklisted(address indexed otoken);

    /**
     * @notice check if the sender is the Otoken Factory module
     */
    modifier onlyFactory() {
        require(
            msg.sender == AddressBookInterface(addressBook).getOtokenFactory(),
            "WhiteList: Sender is not Otoken Factory"
        );

        _;
    }

    /**
     * @notice check if a product is whitelisted
     * @dev product = the hash of underlying, strike and collateral asset
     * @param _underlying asset that the option references
     * @param _strike asset that the strike price is denominated in
     * @param _collateral asset that is held as collateral against short/written options
     * @return boolean, true if product is whitelisted
     */
    function isWhitelistedProduct(
        address _underlying,
        address _strike,
        address _collateral
    ) external view returns (bool) {
        bytes32 productHash = keccak256(abi.encode(_underlying, _strike, _collateral));

        return whitelistedProduct[productHash];
    }

    /**
     * @notice check if the collateral is whitelisted
     * @param _collateral asset that is held as collateral against short/written options
     * @return boolean, true if the collateral is whitelisted
     */
    function isWhitelistedCollateral(address _collateral) external view returns (bool) {
        return whitelistedCollateral[_collateral];
    }

    /**
     * @notice whitelist a product
     * @notice check if an otoken is whitelisted
     * @param _otoken otoken address
     * @return boolean, true if otoken is whitelisted
     */
    function isWhitelistedOtoken(address _otoken) external view returns (bool) {
        return whitelistedOtoken[_otoken];
    }

    /**
     * @notice allow owner to whitelist product
     * @dev a product is the hash of the underlying, collateral and strike assets
     * can only be called from owner address
     * @param _underlying asset that the option references
     * @param _strike asset that the strike price is denominated in
     * @param _collateral asset that is held as collateral against short/written options
     */
    function whitelistProduct(
        address _underlying,
        address _strike,
        address _collateral
    ) external onlyOwner {
        bytes32 productHash = keccak256(abi.encode(_underlying, _strike, _collateral));

        _setWhitelistedProduct(productHash, true);

        emit ProductWhitelisted(productHash, _underlying, _strike, _collateral);
    }

    /**
     * @notice allow owner to blacklist product
     * @dev a product is the hash of the underlying, collateral and strike assets
     * can only be called from owner address
     * @param _underlying asset that the option references
     * @param _strike asset that the strike price is denominated in
     * @param _collateral asset that is held as collateral against short/written options
     */
    function blacklistProduct(
        address _underlying,
        address _strike,
        address _collateral
    ) external onlyOwner {
        bytes32 productHash = keccak256(abi.encode(_underlying, _strike, _collateral));

        _setWhitelistedProduct(productHash, false);

        emit ProductBlacklisted(productHash, _underlying, _strike, _collateral);
    }

    /**
     * @notice whitelist a collateral address, can only be called by owner
     * @dev function can only be called by owner
     * @param _collateral collateral asset address
     */
    function whitelistCollateral(address _collateral) external onlyOwner {
        _setWhitelistedCollateral(_collateral, true);

        emit CollateralWhitelisted(_collateral);
    }

    /**
     * @notice whitelist a collateral address, can only be called by owner
     * @dev function can only be called by owner
     * @param _collateral collateral asset address
     */
    function blacklistCollateral(address _collateral) external onlyOwner {
        _setWhitelistedCollateral(_collateral, false);

        emit CollateralBlacklisted(_collateral);
    }

    /**
     * @notice allow Otoken Factory to whitelist a new option
     * @dev can only be called from the Otoken Factory address
     * @param _otokenAddress otoken
     */
    function whitelistOtoken(address _otokenAddress) external onlyFactory {
        _setWhitelistedOtoken(_otokenAddress, true);

        emit OtokenWhitelisted(_otokenAddress);
    }

    /**
     * @notice allow owner to blacklist a new option
     * @dev can only be called from the owner's address
     * @param _otokenAddress otoken
     */
    function blacklistOtoken(address _otokenAddress) external onlyOwner {
        _setWhitelistedOtoken(_otokenAddress, false);

        emit OtokenBlacklisted(_otokenAddress);
    }

    /**
     * @notice set product state
     * @param _product product hash in bytes
     * @param _state represent if a product is whitelisted or not, true to whitelist and false to blacklist
     */
    function _setWhitelistedProduct(bytes32 _product, bool _state) internal {
        whitelistedProduct[_product] = _state;
    }

    /**
     * @notice set a collateral address as whitelisted
     * @param _collateral collateral address
     * @param _state represent if a collateral is whitelisted or not, true to whitelist and false to blacklist
     */
    function _setWhitelistedCollateral(address _collateral, bool _state) internal {
        whitelistedCollateral[_collateral] = _state;
    }

    /**
     * @notice set an otoken address as whitelisted
     * @param _otokenAddress address of the oToken that is being whitelisted
     * @param _state represent if a Otoken is whitelisted or not, true to whitelist and false to blacklist
     */
    function _setWhitelistedOtoken(address _otokenAddress, bool _state) internal {
        whitelistedOtoken[_otokenAddress] = _state;
    }
}
