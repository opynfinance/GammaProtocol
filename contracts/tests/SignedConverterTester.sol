/**
 * SPDX-License-Identifier: UNLICENSED
 */
pragma solidity 0.6.10;

pragma experimental ABIEncoderV2;

import "../libs/SignedConverter.sol";

/**
 * @author Opyn Team
 * @notice SignedConverter contract tester
 */
contract SignedConverterTester {
    using SignedConverter for int256;
    using SignedConverter for uint256;

    function testFromInt(int256 a) external pure returns (uint256) {
        return SignedConverter.intToUint(a);
    }

    function testFromUint(uint256 a) external pure returns (int256) {
        return SignedConverter.uintToInt(a);
    }
}
