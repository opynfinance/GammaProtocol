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
    /// @dev mapping to track whistelisted callee for call action
    mapping(address => bool) internal whitelistedCallee;

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
    /// @notice emitted when owner whitelist a callee address
    event CalleeWhitelisted(address indexed _callee);
    /// @notice emitted when owner blacklist a callee address
    event CalleeBlacklisted(address indexed _callee);

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
     * @notice check if an otoken is whitelisted
     * @param _otoken otoken address
     * @return boolean, true if otoken is whitelisted
     */
    function isWhitelistedOtoken(address _otoken) external view returns (bool) {
        return whitelistedOtoken[_otoken];
    }

    /**
     * @notice check if a callee address is whitelisted for call acton
     * @param _callee destination address
     * @return boolean, true if address is whitelisted
     */
    function isWhitelistedCallee(address _callee) external view returns (bool) {
        return whitelistedCallee[_callee];
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

        whitelistedProduct[productHash] = true;

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

        whitelistedProduct[productHash] = false;

        emit ProductBlacklisted(productHash, _underlying, _strike, _collateral);
    }

    /**
     * @notice whitelist a collateral address, can only be called by owner
     * @dev function can only be called by owner
     * @param _collateral collateral asset address
     */
    function whitelistCollateral(address _collateral) external onlyOwner {
        whitelistedCollateral[_collateral] = true;

        emit CollateralWhitelisted(_collateral);
    }

    /**
     * @notice whitelist a collateral address, can only be called by owner
     * @dev function can only be called by owner
     * @param _collateral collateral asset address
     */
    function blacklistCollateral(address _collateral) external onlyOwner {
        whitelistedCollateral[_collateral] = false;

        emit CollateralBlacklisted(_collateral);
    }

    /**
     * @notice allow Otoken Factory to whitelist a new option
     * @dev can only be called from the Otoken Factory address
     * @param _otokenAddress otoken
     */
    function whitelistOtoken(address _otokenAddress) external onlyFactory {
        whitelistedOtoken[_otokenAddress] = true;

        emit OtokenWhitelisted(_otokenAddress);
    }

    /**
     * @notice allow owner to blacklist a new option
     * @dev can only be called from the owner's address
     * @param _otokenAddress otoken
     */
    function blacklistOtoken(address _otokenAddress) external onlyOwner {
        whitelistedOtoken[_otokenAddress] = false;

        emit OtokenBlacklisted(_otokenAddress);
    }

    /**
     * @notice allow Owner to whitelisted a callee address
     * @dev can only be called from the owner address
     * @param _callee callee address
     */
    function whitelisteCallee(address _callee) external onlyOwner {
        whitelistedCallee[_callee] = true;

        emit CalleeWhitelisted(_callee);
    }

    /**
     * @notice allow owner to blacklist a destination address for call action
     * @dev can only be called from the owner's address
     * @param _callee callee address
     */
    function blacklistCallee(address _callee) external onlyOwner {
        whitelistedCallee[_callee] = false;

        emit CalleeBlacklisted(_callee);
    }
}
