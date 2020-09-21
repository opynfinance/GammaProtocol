/**
 * SPDX-License-Identifier: UNLICENSED
 */
pragma solidity 0.6.10;

import "../packages/oz/SignedSafeMath.sol";
import "../libs/SignedConverter.sol";
import "../packages/oz/SafeMath.sol";

/**
 *
 */
library FixedPointInt256 {
    using SignedSafeMath for int256;
    using SafeMath for uint256;

    int256 private constant SCALING_FACTOR = 1e18;
    uint256 private constant DECIMALS = 18;

    struct FixedPointInt {
        int256 value;
    }

    /**
     * @notice Constructs an `FixedPointInt` from an unscaled uint which has {_decimals} decimals
     * Examples:
     * (1)  USDC    decimals = 6
     *      Input:  8000000 USDC =>     Output: 8 * 1e18 (8.0 USDC)
     * (2)  cUSDC   decimals = 8
     *      Input:  8000000 cUSDC =>    Output: 8 * 1e16 (0.08 cUSDC)
     * (3)  rUSD    decimals = 20 (random USD)
     *      Input:  15                    =>   Output:  0       rUSDC
     * @param _a uint256 to convert into a FixedPoint.
     * @param _decimals the origianl decimals the number is denominated in.
     * @return the converted FixedPoint.
     */
    function scaleFrom(uint256 _a, uint256 _decimals) internal pure returns (FixedPointInt memory) {
        if (_decimals == DECIMALS) return FixedPointInt(SignedConverter.uintToInt(_a));
        if (_decimals > DECIMALS) {
            uint256 exp = _decimals - DECIMALS;
            return FixedPointInt(SignedConverter.uintToInt(_a.div(10**exp)));
        } else {
            uint256 exp = DECIMALS - _decimals;
            return FixedPointInt(SignedConverter.uintToInt(_a.mul(10**exp)));
        }
    }

    /**
     * @notice Convert a FixedPointInt256 back to uint256 amount with {_decimals} decimals
     * @param _a FixedPointInt to convert back to uint256.
     * @return the converted FixedPoint.
     */
    function unscaleTo(FixedPointInt memory _a, uint256 _decimals) internal pure returns (uint256) {
        if (_decimals == DECIMALS) return SignedConverter.intToUint(_a.value);
        if (_decimals > DECIMALS) {
            uint256 exp = _decimals - DECIMALS;
            return SignedConverter.intToUint(_a.value).mul(10**exp);
        } else {
            uint256 exp = DECIMALS - _decimals;
            return SignedConverter.intToUint(_a.value).div(10**exp);
        }
    }

    /**
     * @notice Constructs an `FixedPointInt` from an unscaled int, e.g., `b=5` gets stored internally as `5**18`.
     * @param a int to convert into a FixedPoint.
     * @return the converted FixedPoint.
     */
    function fromUnscaledInt(int256 a) internal pure returns (FixedPointInt memory) {
        return FixedPointInt(a.mul(SCALING_FACTOR));
    }

    /**
     * @notice return the sum of two signed integer
     * @param a FixedPoint
     * @param b FixedPoint
     * @return sum of two signed integer
     */
    function add(FixedPointInt memory a, FixedPointInt memory b) internal pure returns (FixedPointInt memory) {
        return FixedPointInt(a.value.add(b.value));
    }

    /**
     * @notice return the difference of two signed integer
     * @param a FixedPoint
     * @param b FixedPoint
     * @return difference of two fixed point
     */
    function sub(FixedPointInt memory a, FixedPointInt memory b) internal pure returns (FixedPointInt memory) {
        return FixedPointInt(a.value.sub(b.value));
    }

    /**
     * @notice multiply two signed integer
     * @dev rounds to zero if a*b < SCALING_FACTOR / 2
     * @param a FixedPoint
     * @param b FixedPoint
     * @return mul of two fixed point
     */
    function mul(FixedPointInt memory a, FixedPointInt memory b) internal pure returns (FixedPointInt memory) {
        return FixedPointInt((a.value.mul(b.value)).add(SCALING_FACTOR / 2) / SCALING_FACTOR);
    }

    /**
     * @notice divide two FixedPoint
     * @dev rounds to zero if a*b < SCALING_FACTOR / 2
     * @param a FixedPoint
     * @param b FixedPoint
     * @return div of two signed integer
     */
    function div(FixedPointInt memory a, FixedPointInt memory b) internal pure returns (FixedPointInt memory) {
        return FixedPointInt((a.value.mul(SCALING_FACTOR)).add(b.value / 2) / b.value);
    }

    /**
     * @notice the minimum between a and b
     * @param a signed integer
     * @param b signed integer
     * @return min of two signed integer
     */
    function min(FixedPointInt memory a, FixedPointInt memory b) internal pure returns (FixedPointInt memory) {
        return a.value < b.value ? a : b;
    }

    /**
     * @notice the maximum between a and b
     * @param a signed integer
     * @param b signed integer
     * @return max of two signed integer
     */
    function max(FixedPointInt memory a, FixedPointInt memory b) internal pure returns (FixedPointInt memory) {
        return a.value > b.value ? a : b;
    }

    /**
     * @notice Whether `a` is equal to `b`.
     * @param a a signed integer
     * @param b a signed integer
     * @return True if equal, or False.
     */
    function isEqual(FixedPointInt memory a, FixedPointInt memory b) internal pure returns (bool) {
        return a.value == b.value;
    }

    /**
     * @notice Whether `a` is greater than `b`.
     * @param a a signed integer
     * @param b a signed integer
     * @return True if `a > b`, or False.
     */
    function isGreaterThan(FixedPointInt memory a, FixedPointInt memory b) internal pure returns (bool) {
        return a.value > b.value;
    }

    /**
     * @notice Whether `a` is greater than or equal to `b`.
     * @param a a signed integer
     * @param b a signed integer
     * @return True if `a >= b`, or False.
     */
    function isGreaterThanOrEqual(FixedPointInt memory a, FixedPointInt memory b) internal pure returns (bool) {
        return a.value >= b.value;
    }

    /**
     * @notice Whether `a` is less than `b`.
     * @param a a signed integer
     * @param b a signed integer
     * @return True if `a < b`, or False.
     */
    function isLessThan(FixedPointInt memory a, FixedPointInt memory b) internal pure returns (bool) {
        return a.value < b.value;
    }

    /**
     * @notice Whether `a` is less than or equal to `b`.
     * @param a a Fixed
     * @param b a signed integer
     * @return True if `a <= b`, or False.
     */
    function isLessThanOrEqual(FixedPointInt memory a, FixedPointInt memory b) internal pure returns (bool) {
        return a.value <= b.value;
    }

    /**
     * @notice convert a FixedPoint number to uint.
     * @param a FixedPoint number to convert into a uint
     * @return the converted uint256.
     */
    function toUint(FixedPointInt memory a) internal pure returns (uint256) {
        return SignedConverter.intToUint(a.value);
    }
}
