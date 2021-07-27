// SPDX-License-Identifier: MIT
pragma solidity 0.6.10;

interface STETHInterface {
    function name() external view returns (string memory);

    function symbol() external view returns (string memory);

    function decimals() external view returns (uint8);

    function getPooledEthByShares(uint256 sharesAmount) external view returns (uint256);
}
