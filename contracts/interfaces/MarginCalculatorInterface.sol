// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.10;

pragma experimental ABIEncoderV2;

import {MarginAccount} from "../libs/MarginAccount.sol";

interface MarginCalculatorInterface {
    function getExpiredCashValue(address _otoken) external view returns (uint256);

    function getExcessMargin(MarginAccount.Vault memory _vault) external view returns (uint256 netValue, bool isExcess);
}
