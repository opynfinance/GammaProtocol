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

    function testFromUnscaledInt(int256 a) external pure returns (FixedPointInt256.FixedPointInt memory) {
        return FixedPointInt256.fromUnscaledInt(a);
    }

    function testAdd(FixedPointInt256.FixedPointInt memory a, FixedPointInt256.FixedPointInt memory b)
        external
        pure
        returns (FixedPointInt256.FixedPointInt memory)
    {
        return a.add(b);
    }

    function testSub(FixedPointInt256.FixedPointInt memory a, FixedPointInt256.FixedPointInt memory b)
        external
        pure
        returns (FixedPointInt256.FixedPointInt memory)
    {
        return a.sub(b);
    }

    function testMul(FixedPointInt256.FixedPointInt memory a, FixedPointInt256.FixedPointInt memory b)
        external
        pure
        returns (FixedPointInt256.FixedPointInt memory)
    {
        return a.mul(b);
    }

    function testDiv(FixedPointInt256.FixedPointInt memory a, FixedPointInt256.FixedPointInt memory b)
        external
        pure
        returns (FixedPointInt256.FixedPointInt memory)
    {
        return a.div(b);
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
        return a.isEqual(b);
    }

    function testIsGreaterThan(FixedPointInt256.FixedPointInt memory a, FixedPointInt256.FixedPointInt memory b)
        external
        pure
        returns (bool)
    {
        return a.isGreaterThan(b);
    }

    function testIsGreaterThanOrEqual(FixedPointInt256.FixedPointInt memory a, FixedPointInt256.FixedPointInt memory b)
        external
        pure
        returns (bool)
    {
        return a.isGreaterThanOrEqual(b);
    }

    function testIsLessThan(FixedPointInt256.FixedPointInt memory a, FixedPointInt256.FixedPointInt memory b)
        external
        pure
        returns (bool)
    {
        return a.isLessThan(b);
    }

    function testIsLessThanOrEqual(FixedPointInt256.FixedPointInt memory a, FixedPointInt256.FixedPointInt memory b)
        external
        pure
        returns (bool)
    {
        return a.isLessThanOrEqual(b);
    }
}
