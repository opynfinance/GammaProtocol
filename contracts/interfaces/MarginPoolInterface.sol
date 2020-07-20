// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.10;

interface MarginPoolInterface {
    function transferToPool(
        address asset,
        address user,
        uint256 amount
    ) external;

    function transferToUser(
        address asset,
        address user,
        uint256 amount
    ) external;

    function transferToPool(
        address[] memory asset,
        address[] memory user,
        uint256[] memory amount
    ) external;

    function transferToUser(
        address[] memory asset,
        address[] memory user,
        uint256[] memory amount
    ) external;
}
