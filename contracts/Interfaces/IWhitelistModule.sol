// SPDX-License-Identifier: UNLICENSED
/* solhint-disable */
pragma solidity 0.6.0;

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

    function registerOtoken(address oToken) external returns (bool success);
}
