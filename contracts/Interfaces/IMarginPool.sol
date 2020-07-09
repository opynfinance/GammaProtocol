// SPDX-License-Identifier: UNLICENSED
/* solhint-disable */
pragma solidity 0.6.0;

interface IMarginPool {
    function transferToUser(
        address asset,
        address user,
        uint256 amount
    ) external;

    function transferToPool(
        address asset,
        address user,
        uint256 amount
    ) external;
}
