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
    ///@notice AddressBook module address
    address public addressBook;
    /// @notice mapping to track whitelisted product
    mapping(bytes32 => bool) internal whitelistedProduct;
    /// @notice mapping to track whitelised collateral
    mapping(address => bool) internal whitelistedCollateral;
    ///@dev mapping to track whitelisted otokens
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
    /// @notice emits an event when a collateral address is whitelisted by the owner address
    event CollateralWhitelisted(address indexed collateral);
    ///@notice emitted when Otoken Factory module whitelist an otoken
    event OtokenWhitelisted(address otoken);

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
     * @param _collateral collateral asset address
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

        _setWhitelistedProduct(productHash);

        emit ProductWhitelisted(productHash, _underlying, _strike, _collateral);
    }

    /**
     * @notice whitelist a collateral address, can only be called by owner
     * @dev function can only be called by owner
     * @param _collateral collateral asset address
     */
    function whitelistCollateral(address _collateral) external onlyOwner {
        _setWhitelistedCollateral(_collateral);

        emit CollateralWhitelisted(_collateral);
    }

    /**
     * @notice allow Otoken Factory to whitelist a new option
     * @dev can only be called from the owner's address
     * @param _otokenAddress otoken
     */
    function whitelistOtoken(address _otokenAddress) external onlyFactory {
        _setWhitelistedOtoken(_otokenAddress);

        emit OtokenWhitelisted(_otokenAddress);
    }

    /**
     * @notice set a product hash as whitelisted
     * @param _productHash product hash in bytes
     */
    function _setWhitelistedProduct(bytes32 _productHash) internal {
        require(whitelistedProduct[_productHash] == false, "Product already whitelisted");

        whitelistedProduct[_productHash] = true;
    }

    /**
     * @notice set a collateral address as whitelisted
     * @param _collateral collateral address
     */
    function _setWhitelistedCollateral(address _collateral) internal {
        require(whitelistedCollateral[_collateral] == false, "Collateral already whitelisted");

        whitelistedCollateral[_collateral] = true;
    }

    /**
     * @notice set an otoken address as whitelisted
     * @param _otokenAddress address of the oToken that is being whitelisted
     */
    function _setWhitelistedOtoken(address _otokenAddress) internal {
        require(whitelistedOtoken[_otokenAddress] == false, "Otoken already whitelisted");

        whitelistedOtoken[_otokenAddress] = true;
    }
}
