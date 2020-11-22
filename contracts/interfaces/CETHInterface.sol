/**
 * SPDX-License-Identifier: UNLICENSED
 */
pragma solidity 0.6.10;

/**
 * @dev Interface of Compound cToken
 */
interface CETHInterface {
    function redeem(uint256 redeemTokens) external returns (uint256);

    function mint() external payable;
}
