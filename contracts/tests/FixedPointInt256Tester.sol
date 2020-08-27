/**
 * SPDX-License-Identifier: UNLICENSED
 */
pragma solidity 0.6.10;

pragma experimental ABIEncoderV2;

import "../libs/FixedPointInt256.sol";

/**
 * @author Opyn Team
 * @notice FixedPointInt256 contract tester
 */
contract FixedPointInt256Tester {
    using FixedPointInt256 for FixedPointInt256.FixedPointInt;

    /*function testFromInt(int256 a) external pure returns (uint256) {
        return FixedPointInt256.intToUint(a);
    }

    function testFromUint(uint256 a) external pure returns (int256) {
        return FixedPointInt256.uintToInt(a);
    }*/
    function testFromUnscaledInt(int256 a) external pure returns (FixedPointInt256.FixedPointInt memory) {
        return FixedPointInt256.fromUnscaledInt(a);
    }

    function testAdd(FixedPointInt256.FixedPointInt memory a, FixedPointInt256.FixedPointInt memory b)
        external
        pure
        returns (FixedPointInt256.FixedPointInt memory)
    {
        return FixedPointInt256.add(a, b);
    }

    function testSub(FixedPointInt256.FixedPointInt memory a, FixedPointInt256.FixedPointInt memory b)
        external
        pure
        returns (FixedPointInt256.FixedPointInt memory)
    {
        return FixedPointInt256.sub(a, b);
    }

    function testMul(FixedPointInt256.FixedPointInt memory a, FixedPointInt256.FixedPointInt memory b)
        external
        pure
        returns (FixedPointInt256.FixedPointInt memory)
    {
        return FixedPointInt256.mul(a, b);
    }

    function testDiv(FixedPointInt256.FixedPointInt memory a, FixedPointInt256.FixedPointInt memory b)
        external
        pure
        returns (FixedPointInt256.FixedPointInt memory)
    {
        return FixedPointInt256.div(a, b);
    }

    function testMin(FixedPointInt256.FixedPointInt memory a, FixedPointInt256.FixedPointInt memory b)
        external
        pure
        returns (FixedPointInt256.FixedPointInt memory)
    {
        return FixedPointInt256.min(a, b);
    }

    function testMax(FixedPointInt256.FixedPointInt memory a, FixedPointInt256.FixedPointInt memory b)
        external
        pure
        returns (FixedPointInt256.FixedPointInt memory)
    {
        return FixedPointInt256.max(a, b);
    }

    function testIsEqual(FixedPointInt256.FixedPointInt memory a, FixedPointInt256.FixedPointInt memory b)
        external
        pure
        returns (bool)
    {
        return FixedPointInt256.isEqual(a, b);
    }

    function testIsGreaterThan(FixedPointInt256.FixedPointInt memory a, FixedPointInt256.FixedPointInt memory b)
        external
        pure
        returns (bool)
    {
        return FixedPointInt256.isGreaterThan(a, b);
    }

    function testIsGreaterThanOrEqual(FixedPointInt256.FixedPointInt memory a, FixedPointInt256.FixedPointInt memory b)
        external
        pure
        returns (bool)
    {
        return FixedPointInt256.isGreaterThanOrEqual(a, b);
    }

    function testIsLessThan(FixedPointInt256.FixedPointInt memory a, FixedPointInt256.FixedPointInt memory b)
        external
        pure
        returns (bool)
    {
        return FixedPointInt256.isLessThan(a, b);
    }

    function testIsLessThanOrEqual(FixedPointInt256.FixedPointInt memory a, FixedPointInt256.FixedPointInt memory b)
        external
        pure
        returns (bool)
    {
        return FixedPointInt256.isLessThanOrEqual(a, b);
    }
}
