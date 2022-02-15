// SPDX-License-Identifier: MIT
pragma solidity =0.6.10;

interface SAVAXInterface {
    function getSharesByPooledAvax(uint256 avaxAmount) external view returns (uint256);

    function getPooledAvaxByShares(uint256 shareAmount) external view returns (uint256);

    function submit() external payable returns (uint256);
}
