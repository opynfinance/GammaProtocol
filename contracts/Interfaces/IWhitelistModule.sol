// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.10;

interface IWhitelistModule {
    function whitelistProduct(
        address underlying,
        address strike,
        address collateral
    ) external returns (bytes32 id);

    function isSupportedProduct(
        address underlying,
        address strike,
        address collateral
    ) external view returns (bool isValid);

    function registerOtoken(address oToken) external;

    function isValidOtoken(address oToken) external view returns (bool isValid);
}
