/**
 * SPDX-License-Identifier: UNLICENSED
 */
pragma solidity 0.6.10;

import "./interfaces/AggregatorInterface.sol";
import "./interfaces/AddressBookInterface.sol";
import "./packages/oz/Ownable.sol";

/**
 * @author Opyn Team
 * @title Oracle Module
 * @notice The Oracle module provide the system with on-chain prices
 */
contract Oracle is Ownable {
    /// @dev structure that represent price, and timestamp
    struct Price {
        uint256 price;
        uint256 timestamp; // timestamp at which the price is pulled to this oracle
    }

    /// @dev mapping between oracle and it's locking period
    mapping(address => uint256) internal oracleLockingPeriod;
    /// @dev mapping of asset price to it's dispute period
    mapping(address => uint256) internal oracleDisputePeriod;
    /// @dev mapping between batch and it's oracle
    mapping(bytes32 => address) internal batchOracle;
    /// @dev mapping between batch and it price at specific timestmap
    mapping(bytes32 => mapping(uint256 => Price)) internal batchPriceAt;
}
