/**
 * SPDX-License-Identifier: UNLICENSED
 */
pragma solidity 0.6.10;

/**
 *
 */
library SignedConverter {
    /**
     * @notice convert an unsigned integer to signed integer
     * @param a uint to convert into a signed integer.
     * @return the converted signed integer.
     */
    function uintToInt(uint256 a) internal pure returns (int256) {
        require(a < 2**255, "FixedPointInt256: out of int range");

        return int256(a);
    }

    /**
     * @notice convert a signed integer to unsigned integer
     * @param a int to convert into an unsigned integer.
     * @return the converted unsigned integer.
     */
    function intToUint(int256 a) internal pure returns (uint256) {
        if (a < 0) {
            return uint256(-a);
        } else {
            return uint256(a);
        }
    }
}
