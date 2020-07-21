// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.10;

interface MarginPoolInterface {
    function transferToPool(
        address _asset,
        address _user,
        uint256 _amount
    ) external;

    function transferToUser(
        address _asset,
        address _user,
        uint256 _amount
    ) external;

    function transferToPool(
        address[] memory _asset,
        address[] memory _user,
        uint256[] memory _amount
    ) external;

    function transferToUser(
        address[] memory _asset,
        address[] memory _user,
        uint256[] memory _amount
    ) external;
}
