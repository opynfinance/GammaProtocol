/**
 * SPDX-License-Identifier: MIT
 */
pragma solidity 0.6.10;

/**
 * @dev Interface of Compound Comtroller contract
 */
interface Comptroller {
    function claimComp(address _holder) external;
}
