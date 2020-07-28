/**
 * SPDX-License-Identifier: UNLICENSED
 */
pragma solidity 0.6.10;

/**
 *
 */
library FixedPointInt256 {
    uint256 private constant SCALING_FACTOR = 1e18;

    /**
     * @notice convert an unsigned integer to signed integer
     * @param a uint to convert into a signed integer.
     * @return the converted signed integer.
     */
    function fromUint(uint256 a) internal pure returns (int256) {
        require(a < uint256(-1), "FixedPointInt256: can't cast - out of int range");

        return int256(a);
    }
}
