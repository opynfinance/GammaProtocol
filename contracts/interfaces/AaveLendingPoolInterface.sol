/**
 * SPDX-License-Identifier: UNLICENSED
 */
pragma solidity 0.6.10;

/**
 * @dev Interface of Aave Lending Pool
 */
interface AaveLendingPoolInterface {
    function deposit(
        address _reserve,
        uint256 _amount,
        uint16 _referralCode
    ) external;
}
