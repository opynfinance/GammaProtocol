/**
 * SPDX-License-Identifier: UNLICENSED
 */
pragma solidity 0.6.10;

/**
 * @dev Interface of Compound cERC20 Token
 */
interface CERC20Interface {
    function redeem(uint256 redeemTokens) external returns (uint256);

    function mint(uint256 mintAmount) external returns (uint256);
}
