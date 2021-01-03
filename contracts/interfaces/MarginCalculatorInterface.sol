// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.10;

pragma experimental ABIEncoderV2;

import {MarginVault} from "../libs/MarginVault.sol";

interface MarginCalculatorInterface { function getExcessCollateral(uint256 shortAmounts,uint256 longAmounts,uint256 collateralAmounts) external view returns (uint256, bool);
    function addressBook() external view returns (address);

    function getExpiredPayoutRate(address _otoken) external view returns (uint256);

    function getExcessCollateral(MarginVault.Vault calldata _vault)
        external
        view
        returns (uint256 netValue, bool isExcess);
}
