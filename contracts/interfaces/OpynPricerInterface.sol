// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.10;

interface OpynPricer {
    function getPrice(address _otoken) external view returns (uint256);
}
