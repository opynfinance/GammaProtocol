/**
 * SPDX-License-Identifier: UNLICENSED
 */
pragma solidity 0.6.10;

import {ERC20Interface} from "./ERC20Interface.sol";

/**
 * @dev Interface of Compound cToken
 */
interface YTokenInterface is ERC20Interface {
    function calcPoolValueInToken() external view returns (uint256);

    function withdraw(uint256 _shares) external;

    function deposit(uint256 _amount) external;
}
