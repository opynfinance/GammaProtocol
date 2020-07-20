// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.10;

import "./packages/oz/Ownable.sol";

/**
 * @author Opyn Team
 * @title Whitelist Module
 * @notice The whitelist module keeps track of all valid Otoken contracts.
 */
contract Whitelist is Ownable {
    ///@notice mapping to track whitelisted product
    mapping(bytes32 => bool) internal whitelistedProduct;

    ///@notice emitted when owner whitelist a product
    event ProductWhitelisted(
        bytes32 productHash,
        address indexed underlying,
        address indexed strike,
        address indexed collateral
    );

    /**
     * @notice check if a product is supported
     * @dev product = the hash of underlying, strike and collateral asset
     * @param _underlying option underlying asset address
     * @param _strike option strike asset address
     * @param _collateral option collateral asset address
     * @return boolean, true if product is supported
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
     * @notice allow owner to whitelist product
     * @dev a product is the hash of the underlying, collateral and strike assets
     * can only be called from owner address
     * @param _underlying option underlying asset address
     * @param _strike option strike asset address
     * @param _collateral option collateral asset address
     * @return product hash
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
     * @notice set a product hash as supported
     * @param _productHash product hash in bytes
     */
    function _setWhitelistedProduct(bytes32 _productHash) internal {
        require(whitelistedProduct[_productHash] == false, "Product already whitelisted");

        whitelistedProduct[_productHash] = true;
    }
}
