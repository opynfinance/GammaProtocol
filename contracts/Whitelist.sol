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

    ///@dev mapping to track whitelisted products
    mapping(bytes32 => bool) internal whitelistedProduct;
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

    ///@notice emitted when the owner whitelists a new product
    event ProductWhitelisted(
        bytes32 productHash,
        address indexed underlying,
        address indexed strike,
        address indexed collateral
    );

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
     * @param _underlying option underlying asset address
     * @param _strike option strike asset address
     * @param _collateral option collateral asset address
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
     * @param _underlying option underlying asset address
     * @param _strike option strike asset address
     * @param _collateral option collateral asset address
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
     * @notice allow Otoken Factory to whitelist option
     * @dev can only be called from owner address
     * @param _otokenAddress otoken
     */
    function whitelistOtoken(address _otokenAddress) external onlyFactory {
        require(whitelistedOtoken[_otokenAddress] == false, "Otoken already whitelisted");

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
     * @notice set an otoken address as whitelisted
     * @param _otokenAddress product hash in bytes
     */
    function _setWhitelistedOtoken(address _otokenAddress) internal {
        whitelistedOtoken[_otokenAddress] = true;
    }
}
