/**
 * SPDX-License-Identifier: UNLICENSED
 */
pragma solidity 0.6.10;

import "../libs/FixedPointInt256.sol";

/**
 * @author Opyn Team
 * @notice FixedPointInt256 contract tester
 */
contract FixedPointInt256Tester {
    function testFromInt(int256 a) external pure returns (uint256) {
        return FixedPointInt256.intToUint(a);
    }

    function testFromUint(uint256 a) external pure returns (int256) {
        return FixedPointInt256.uintToInt(a);
    }

    function testAdd(int256 a, int256 b) external pure returns (int256) {
        return FixedPointInt256.add(a, b);
    }

    function testSub(int256 a, int256 b) external pure returns (int256) {
        return FixedPointInt256.sub(a, b);
    }

    function testMul(int256 a, int256 b) external pure returns (int256) {
        return FixedPointInt256.mul(a, b);
    }

    function testDiv(int256 a, int256 b) external pure returns (int256) {
        return FixedPointInt256.div(a, b);
    }

    function testMin(int256 a, int256 b) external pure returns (int256) {
        return FixedPointInt256.min(a, b);
    }

    function testMax(int256 a, int256 b) external pure returns (int256) {
        return FixedPointInt256.max(a, b);
    }

    function testIsEqual(int256 a, int256 b) external pure returns (bool) {
        return FixedPointInt256.isEqual(a, b);
    }

    function testIsGreaterThan(int256 a, int256 b) external pure returns (bool) {
        return FixedPointInt256.isGreaterThan(a, b);
    }

    function testIsGreaterThanOrEqual(int256 a, int256 b) external pure returns (bool) {
        return FixedPointInt256.isGreaterThanOrEqual(a, b);
    }

    function testIsLessThan(int256 a, int256 b) external pure returns (bool) {
        return FixedPointInt256.isLessThan(a, b);
    }

    function testIsLessThanOrEqual(int256 a, int256 b) external pure returns (bool) {
        return FixedPointInt256.isLessThanOrEqual(a, b);
    }
}
