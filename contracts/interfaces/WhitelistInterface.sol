// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.10;

interface WhitelistInterface {
    function whitelistProduct(
        address underlying,
        address strike,
        address collateral
    ) external returns (bytes32 id);

    function whitelistCollateral(address collateral) external returns (bytes32 id);

    function isWhitelistedProduct(
        address underlying,
        address strike,
        address collateral
    ) external view returns (bool);

    function isWhitelistedCollateral(address collateral) external view returns (bool);

    function registerOtoken(address oToken) external;

    function isValidOtoken(address oToken) external view returns (bool isValid);
}
