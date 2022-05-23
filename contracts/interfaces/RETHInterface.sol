// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.10;

interface RETHInterface {
    function getExchangeRate() external view returns (uint256);

    function getETHValue(uint256 rethAmount) external view returns (uint256);

    function getRethValue(uint256 ethAmount) external view returns (uint256);
}
