// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.10;

interface OtokenInterface {
    function underlyingAsset() external returns (address);

    function strikeAsset() external returns (address);

    function collateralAsset() external returns (address);

    function strikePrice() external returns (uint256);

    function expiryTimestamp() external returns (uint256);

    function isPut() external returns (bool);

    function init(
        address _underlyingAsset,
        address _strikeAsset,
        address _collateralAsset,
        uint256 _strikePrice,
        uint256 _expiry,
        bool _isPut
    ) external;

    function mintOtoken(address account, uint256 amount) external;

    function burnOtoken(address account, uint256 amount) external;
}
