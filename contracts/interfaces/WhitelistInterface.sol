// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.10;

interface WhitelistInterface {
    function whitelistProduct(
        address _underlying,
        address _strike,
        address _collateral
    ) external;

    function whitelistCollateral(address _collateral) external;

    function isWhitelistedProduct(
        address underlying,
        address strike,
        address collateral
    ) external view returns (bool);

    function isWhitelistedCollateral(address _collateral) external view returns (bool);

    function whitelistOtoken(address _otoken) external;

    function isWhitelistedOtoken(address _otoken) external view returns (bool);
}
