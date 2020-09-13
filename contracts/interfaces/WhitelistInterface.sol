// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.10;

interface WhitelistInterface {
    /* View functions */
    function isWhitelistedProduct(
        address _underlying,
        address _strike,
        address _collateral,
        bool _isPut
    ) external view returns (bool);

    function isWhitelistedCollateral(address _collateral) external view returns (bool);

    function isWhitelistedOtoken(address _otoken) external view returns (bool);

    /* Admin / factory only functions */
    function whitelistProduct(
        address _underlying,
        address _strike,
        address _collateral,
        bool _isPut
    ) external;

    function whitelistCollateral(address _collateral) external;

    function whitelistOtoken(address _otoken) external;

    function isWhitelistedCallee(address _callee) external view returns (bool);
}
