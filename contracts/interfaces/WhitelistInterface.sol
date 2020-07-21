// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.10;

interface WhitelistInterface {
    function whitelistProduct(
        address _underlying,
        address _strike,
        address _collateral
    ) external returns (bytes32);

    function whitelistCollateral(address collateral) external returns (bytes32);

    function isWhitelistedProduct(
        address _underlying,
        address _strike,
        address _collateral
    ) external view returns (bool);

    function isWhitelistedCollateral(address _collateral) external view returns (bool);

    function registerOtoken(address _otoken) external;

    function isValidOtoken(address _otoken) external view returns (bool);
}
