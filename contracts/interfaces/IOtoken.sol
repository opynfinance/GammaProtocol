// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.10;

interface IOtoken {
    function init(
        address _underlyingAsset,
        address _strikeAsset,
        address _collateralAsset,
        uint256 _strikePrice,
        uint256 _expiry,
        bool _isPut,
        string memory _name,
        string memory _symbol
    ) external;
}
