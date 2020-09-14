/**
 * SPDX-License-Identifier: UNLICENSED
 */
pragma solidity =0.6.10;
pragma experimental ABIEncoderV2;

import {MarginCalculator} from "../MarginCalculator.sol";

contract CalculatorTester is MarginCalculator {
    constructor(address _addressBook) public MarginCalculator(_addressBook) {}

    function getExpiredCashValue(address _otoken) external view returns (uint256) {
        return _getExpiredCashValue(_otoken);
    }
}
