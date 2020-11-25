/**
 * SPDX-License-Identifier: UNLICENSED
 */
pragma solidity 0.6.10;

import {ERC20Interface} from "./ERC20Interface.sol";

/**
 * @dev Interface of Compound cToken
 */
interface CETHInterface is ERC20Interface {
    function redeem(uint256 redeemTokens) external returns (uint256);

    function mint() external payable;
}
