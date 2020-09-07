/**
 * SPDX-License-Identifier: UNLICENSED
 */
pragma solidity 0.6.10;

pragma experimental ABIEncoderV2;

import "../packages/oz/SignedSafeMath.sol";

/**
 *
 */
library FixedPointInt256 {
    using SignedSafeMath for int256;

    int256 private constant SCALING_FACTOR = 1e18;

    struct FixedPointInt {
        int256 value;
    }

    /**
     * @notice Constructs an `FixedPointInt` from an unscaled int, e.g., `b=5` gets stored externally as `5**18`.
     * @param a int to convert into a FixedPoint.
     * @return the converted FixedPoint.
     */
    function fromUnscaledInt(int256 a) external pure returns (FixedPointInt memory) {
        return FixedPointInt(a.mul(SCALING_FACTOR));
    }

    /**
     * @notice return the sum of two signed integer
     * @param a FixedPoint
     * @param b FixedPoint
     * @return sum of two signed integer
     */
    function add(FixedPointInt memory a, FixedPointInt memory b) external pure returns (FixedPointInt memory) {
        return FixedPointInt(a.value.add(b.value));
    }

    /**
     * @notice return the difference of two signed integer
     * @param a FixedPoint
     * @param b FixedPoint
     * @return difference of two fixed point
     */
    function sub(FixedPointInt memory a, FixedPointInt memory b) external pure returns (FixedPointInt memory) {
        return FixedPointInt(a.value.sub(b.value));
    }

    /**
     * @notice multiply two signed integer
     * @dev rounds to zero if a*b < SCALING_FACTOR / 2
     * @param a FixedPoint
     * @param b FixedPoint
     * @return mul of two fixed point
     */
    function mul(FixedPointInt memory a, FixedPointInt memory b) external pure returns (FixedPointInt memory) {
        return FixedPointInt((a.value.mul(b.value)).add(SCALING_FACTOR / 2) / SCALING_FACTOR);
    }

    /**
     * @notice divide two FixedPoint
     * @dev rounds to zero if a*b < SCALING_FACTOR / 2
     * @param a FixedPoint
     * @param b FixedPoint
     * @return div of two signed integer
     */
    function div(FixedPointInt memory a, FixedPointInt memory b) external pure returns (FixedPointInt memory) {
        return FixedPointInt((a.value.mul(SCALING_FACTOR)).add(b.value / 2) / b.value);
    }

    /**
     * @notice the minimum between a and b
     * @param a signed integer
     * @param b signed integer
     * @return min of two signed integer
     */
    function min(FixedPointInt memory a, FixedPointInt memory b) external pure returns (FixedPointInt memory) {
        return a.value < b.value ? a : b;
    }

    /**
     * @notice the maximum between a and b
     * @param a signed integer
     * @param b signed integer
     * @return max of two signed integer
     */
    function max(FixedPointInt memory a, FixedPointInt memory b) external pure returns (FixedPointInt memory) {
        return a.value > b.value ? a : b;
    }

    /**
     * @notice Whether `a` is equal to `b`.
     * @param a a signed integer
     * @param b a signed integer
     * @return True if equal, or False.
     */
    function isEqual(FixedPointInt memory a, FixedPointInt memory b) external pure returns (bool) {
        return a.value == b.value;
    }

    /**
     * @notice Whether `a` is greater than `b`.
     * @param a a signed integer
     * @param b a signed integer
     * @return True if `a > b`, or False.
     */
    function isGreaterThan(FixedPointInt memory a, FixedPointInt memory b) external pure returns (bool) {
        return a.value > b.value;
    }

    /**
     * @notice Whether `a` is greater than or equal to `b`.
     * @param a a signed integer
     * @param b a signed integer
     * @return True if `a >= b`, or False.
     */
    function isGreaterThanOrEqual(FixedPointInt memory a, FixedPointInt memory b) external pure returns (bool) {
        return a.value >= b.value;
    }

    /**
     * @notice Whether `a` is less than `b`.
     * @param a a signed integer
     * @param b a signed integer
     * @return True if `a < b`, or False.
     */
    function isLessThan(FixedPointInt memory a, FixedPointInt memory b) external pure returns (bool) {
        return a.value < b.value;
    }

    /**
     * @notice Whether `a` is less than or equal to `b`.
     * @param a a Fixed
     * @param b a signed integer
     * @return True if `a <= b`, or False.
     */
    function isLessThanOrEqual(FixedPointInt memory a, FixedPointInt memory b) external pure returns (bool) {
        return a.value <= b.value;
    }
}
