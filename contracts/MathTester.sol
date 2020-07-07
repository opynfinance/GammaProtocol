/*
 * Safe Float Math contract. Copyright © 2020 by Opyn.co .
 * Author: Opyn
 * SPDX-License-Identifier: UNLICENSED
 */
pragma solidity 0.6.10;

import {SafeMath} from "@openzeppelin/contracts/math/SafeMath.sol";

/**
 * @title SafeUnsignedFloatMath
 * @dev unsigned math operations with safety checks that revert on error.
 */

contract MathTester {
    using SafeMath for uint256;

    // Assumes 18 digits precision of decimals.
    uint256 public constant DECIMALS = 1e18;

    /**
     * @dev Multiplies two unsigned fixed points and maintains precision.
     * rounds down or up based on last digit.
     * reverts on overflow.
     * Eg. 0.4 * 0.4 = 0.16,
     * Input: a = 4 * 1e18, b = 4 * 1e18
     * Output: 16 * 1e18
     */
    function mul(uint256 a, uint256 b) external pure returns (uint256) {
        uint256 c = a.mul(b);
        return (c.add(DECIMALS.div(2))).div(DECIMALS);
    }

    /**
     * @dev Division of two unsigned fixed point numbers, rounding the quotient, reverts on division by zero.
     */
    function div(uint256 a, uint256 b) external pure returns (uint256) {
        uint256 c = a.mul(DECIMALS);
        return (c.add(b.div(2))).div(b);
    }

    /**
     * @dev Subtracts two unsigned fixed point numbers, reverts on overflow.
     */
    function sub(uint256 a, uint256 b) external pure returns (uint256) {
        return a.sub(b);
    }

    /**
     * @dev Adds two unsigned fixed point numbers, reverts on overflow.
     */
    function add(uint256 a, uint256 b) external pure returns (uint256) {
        return a.add(b);
    }
}
