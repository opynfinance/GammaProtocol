// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.10;

pragma experimental ABIEncoderV2;

import {MarginVault} from "../libs/MarginVault.sol";

interface MarginCalculatorInterface {
    function getExpiredPayoutRate(address _otoken) external view returns (uint256);

    function getExcessCollateral(MarginVault.Vault memory _vault)
        external
        view
        returns (uint256 netValue, bool isExcess);
}
