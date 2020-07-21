// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.10;

interface WhitelistInterface {
    function whitelistProduct(
        address _underlying,
        address _strike,
        address _collateral
    ) external returns (bytes32 id);

    function whitelistCollateral(address _collateral) external returns (bytes32);

    function isWhitelistedProduct(
        address underlying,
        address strike,
        address collateral
    ) external view returns (bool);

    function isWhitelistedCollateral(address _collateral) external view returns (bool);

    function registerOtoken(address _oToken) external;

    function isValidOtoken(address _oToken) external view returns (bool);
}
