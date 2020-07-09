// SPDX-License-Identifier: UNLICENSED
/* solhint-disable */
pragma solidity 0.6.0;

interface IOtoken {
    function init(
        address _underlyingAsset,
        address _strikeAsset,
        address _collateralAsset,
        uint256 _strikePrice,
        uint256 _expiry,
        bool _isPut,
        string calldata name,
        string calldata symbol
    ) external;

    function burn(address _user, uint256 _amount) external;

    function mint(address _user, uint256 _amount) external;
}
