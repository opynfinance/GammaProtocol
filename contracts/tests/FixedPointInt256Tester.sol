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
        return FixedPointInt256.fromInt(a);
    }

    function testFromUint(uint256 a) external pure returns (int256) {
        return FixedPointInt256.fromUint(a);
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
}
