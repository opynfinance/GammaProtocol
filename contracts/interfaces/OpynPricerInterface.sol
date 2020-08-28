// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.10;

interface OpynPricerInterface {
    function getPrice(address _otoken) external view returns (uint256);
}
