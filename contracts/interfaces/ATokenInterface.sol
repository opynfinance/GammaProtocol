/**
 * SPDX-License-Identifier: UNLICENSED
 */
pragma solidity 0.6.10;

import {ERC20Interface} from "./ERC20Interface.sol";

/**
 * @dev Interface of Aave aToken
 */
interface ATokenInterface is ERC20Interface {
    function redeem(uint256 redeemTokens) external;
}
