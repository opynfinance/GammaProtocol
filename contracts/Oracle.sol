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

    /// @notice AddressBook module
    address public addressBook;

    /// @dev mapping between oracle and it's locking period
    mapping(address => uint256) internal oracleLockingPeriod;
    /// @dev mapping between oracle and it's dispute period
    mapping(address => uint256) internal oracleDisputePeriod;
    /// @dev mapping between batch and it's oracle
    mapping(bytes32 => address) internal batchOracle;
    /// @dev mapping between batch and it price at specific timestmap
    mapping(bytes32 => mapping(uint256 => Price)) internal batchPriceAt;

    /**
     * @dev constructor
     * @param _addressBook AddressBook module address
     */
    constructor(address _addressBook) public {
        require(_addressBook != address(0), "Invalid address book");

        addressBook = _addressBook;
    }

    /**
     * @notice get batch price
     * @param _batch batch hash
     * @param _timestamp price timestamp
     * @return price and timestap at which price submitted to this contract
     */
    function getBatchPrice(bytes32 _batch, uint256 _timestamp) public view returns (uint256, uint256) {
        Price memory batchPrice = batchPriceAt[_batch][_timestamp];
        return (batchPrice.price, batchPrice.timestamp);
    }

    /**
     * @notice get batch oracle
     * @param _batch batch hash
     * @return oracle address
     */
    function getBatchOracle(bytes32 _batch) public view returns (address) {
        return batchOracle[_batch];
    }

    /**
     * @notice get oracle locking period
     * @dev during an oracle locking period, price can not be submitted to this contract
     * @param _oracle oracle address
     * @return locking period
     */
    function getOracleLockingPeriod(address _oracle) public view returns (uint256) {
        return oracleLockingPeriod[_oracle];
    }

    /**
     * @notice get oracle dispute period
     * @dev during an oracle dispute period, the owner of this contract can dispute the submitted price and modify it
     * @param _oracle oracle address
     * @return dispute period
     */
    function getOracleDisputePeriod(address _oracle) public view returns (uint256) {
        return oracleDisputePeriod[_oracle];
    }
}
