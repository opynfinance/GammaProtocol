/**
 * SPDX-License-Identifier: UNLICENSED
 */
pragma solidity 0.6.10;

pragma experimental ABIEncoderV2;

import '../contracts/libs/FixedPointInt256.sol';

/**
 * @author Opyn Team
 * @notice FixedPointInt256 contract tester
 */
contract FixedPointHarness {
  using FixedPointInt256 for FixedPointInt256.FixedPointInt;

  function testFPI(uint256 _a) external pure returns (uint256) {
    FixedPointInt256.FixedPointInt memory a = FixedPointInt256.fromScaledUint(_a, 18);
    return FixedPointInt256.toScaledUint(a, 18, true);
  }

  function testAdd(uint256 _a, uint256 _b) external pure returns (uint256) {
    FixedPointInt256.FixedPointInt memory a = FixedPointInt256.fromScaledUint(_a, 18);
    FixedPointInt256.FixedPointInt memory b = FixedPointInt256.fromScaledUint(_b, 18);

    FixedPointInt256.FixedPointInt memory c = a.add(b);
    return c.toScaledUint(18, true);
  }

  function testSub(uint256 _a, uint256 _b) external pure returns (uint256) {
    FixedPointInt256.FixedPointInt memory a = FixedPointInt256.fromScaledUint(_a, 18);
    FixedPointInt256.FixedPointInt memory b = FixedPointInt256.fromScaledUint(_b, 18);

    FixedPointInt256.FixedPointInt memory c = a.sub(b);
    return c.toScaledUint(18, true);
  }

  function testMul(uint256 _a, uint256 _b) external pure returns (uint256) {
    FixedPointInt256.FixedPointInt memory a = FixedPointInt256.fromScaledUint(_a, 18);
    FixedPointInt256.FixedPointInt memory b = FixedPointInt256.fromScaledUint(_b, 18);

    FixedPointInt256.FixedPointInt memory c = a.mul(b);
    return c.toScaledUint(18, true);
  }
}
