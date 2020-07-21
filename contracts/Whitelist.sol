// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.10;

import "./packages/oz/Ownable.sol";

/**
 * @author Opyn Team
 * @title Whitelist Module
 * @notice The whitelist module keeps track of all valid Otoken contracts.
 */
contract Whitelist is Ownable {
    mapping(bytes32 => bool) internal whitelistedProduct;
    mapping(address => bool) internal whitelistedCollateral;

    event ProductWhitelisted(
        bytes32 productHash,
        address indexed underlying,
        address indexed strike,
        address indexed collateral
    );

    /// @notice emits an event when a collateral address is whitelisted by owner address
    event CollateralWhitelisted(address indexed collateral);

    /**
     * @notice check if a product is supported
     * @dev product = the hash of underlying, collateral and strike asset
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
     * @notice check if the collateral is whitelisted
     * @param _collateral collateral asset address
     * @return boolean, true if the collateral is whitelisted
     */
    function isWhitelistedCollateral(address _collateral) external view returns (bool) {
        return whitelistedCollateral[_collateral];
    }

    /**
     * @notice whitelist a product
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
    ) external onlyOwner returns (bytes32) {
        bytes32 productHash = keccak256(abi.encode(_underlying, _strike, _collateral));

        _setWhitelistedProduct(productHash);

        emit ProductWhitelisted(productHash, _underlying, _strike, _collateral);

        return productHash;
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
     * @notice set a product hash as supported
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
}
