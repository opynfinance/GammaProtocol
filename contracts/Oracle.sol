/**
 * SPDX-License-Identifier: UNLICENSED
 */
pragma solidity 0.6.10;

import "./interfaces/AggregatorInterface.sol";
import "./interfaces/AddressBookInterface.sol";
import "./packages/oz/Ownable.sol";
import "./packages/oz/SafeMath.sol";

/**
 * @author Opyn Team
 * @title Oracle Module
 * @notice The Oracle module provide the system with on-chain prices
 */
contract Oracle is Ownable {
    using SafeMath for uint256;

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
    /// @dev mapping between batch and it price at specific timestmap. A batch is the hash of underlying, collateral, strike and expiry.
    mapping(bytes32 => mapping(uint256 => Price)) internal batchPriceAt;

    /// @notice emits an event when an oracle added for a specific batch
    event BatchOracleAdded(bytes32 indexed batch, address oracle);
    /// @notice emits an event when a locking period added for a specific oracle
    event OracleLockingPeriodAdded(address indexed oracle, uint256 lockingPeriod);
    /// @notice emits an event when a dispute period added for a specific oracle
    event OracleDisputePeriodAdded(address indexed oracle, uint256 disputePeriod);

    /**
     * @notice get batch price
     * @param _batch a batch is the hash of underlying, collateral, strike and expiry.
     * @param _timestamp price timestamp
     * @return price and timestap at which price submitted to this contract
     */
    function getBatchPrice(bytes32 _batch, uint256 _timestamp) public view returns (uint256, uint256) {
        Price memory batchPrice = batchPriceAt[_batch][_timestamp];
        return (batchPrice.price, batchPrice.timestamp);
    }

    /**
     * @notice get batch oracle. Each underlying-collateral-strike-expiry has its own oracle
     * @param _batch get the price oracle for a specific batch. A batch is the hash of underlying, collateral, strike and expiry.
     * @return oracle address
     */
    function getBatchOracle(bytes32 _batch) public view returns (address) {
        return batchOracle[_batch];
    }

    /**
     * @notice get oracle locking period. A locking period is a period of time after expiry where no one can push price to oracle
     * @dev during an oracle locking period, price can not be submitted to this contract
     * @param _oracle oracle address
     * @return locking period
     */
    function getOracleLockingPeriod(address _oracle) public view returns (uint256) {
        return oracleLockingPeriod[_oracle];
    }

    /**
     * @notice get oracle dispute period
     * @dev during an oracle dispute period, the owner of this contract can dispute the submitted price and modify it. The dispute period start after submitting batch price on-chain
     * @param _oracle oracle address
     * @return dispute period
     */
    function getOracleDisputePeriod(address _oracle) public view returns (uint256) {
        return oracleDisputePeriod[_oracle];
    }

    /**
     * @notice check if locking period is over
     * @param _batch A batch is the hash of underlying, collateral, strike and expiry.
     * @param _expiryTimestamp batch expiry
     * @return True if locking period is over, otherwise false
     */
    function isLockingPeriodOver(bytes32 _batch, uint256 _expiryTimestamp) external view returns (bool) {
        address oracle = batchOracle[_batch];
        uint256 lockingPeriod = oracleLockingPeriod[oracle];

        return now > _expiryTimestamp.add(lockingPeriod);
    }

    /**
     * @notice check if dispute period is over
     * @param _batch batch hash
     * @param _expiryTimestamp batch expiry
     * @return True if dispute period is over, otherwise false
     */
    function isDisputePeriodOver(bytes32 _batch, uint256 _expiryTimestamp) external view returns (bool) {
        address oracle = batchOracle[_batch];
        uint256 disputePeriod = oracleDisputePeriod[oracle];

        Price memory batchPrice = batchPriceAt[_batch][_expiryTimestamp];

        if (batchPrice.timestamp == 0) {
            return false;
        }

        return now > batchPrice.timestamp.add(disputePeriod);
    }

    /**
     * @notice set batch oracle
     * @dev can only be called by owner
     * @param _batch batch (hash of underlying, stike, collateral and expiry)
     * @param _oracle oracle address
     */
    function setBatchOracle(bytes32 _batch, address _oracle) external onlyOwner {
        batchOracle[_batch] = _oracle;

        emit BatchOracleAdded(_batch, _oracle);
    }

    /**
     * @notice set oracle locking period
     * @dev can only be called by owner
     * @param _oracle oracle address
     * @param _lockingPeriod locking period
     */
    function setLockingPeriod(address _oracle, uint256 _lockingPeriod) external onlyOwner {
        oracleLockingPeriod[_oracle] = _lockingPeriod;

        emit OracleLockingPeriodAdded(_oracle, _lockingPeriod);
    }

    /**
     * @notice set oracle dispute period
     * @dev can only be called by owner
     * @param _oracle oracle address
     * @param _disputePeriod dispute period
     */
    function setDisputePeriod(address _oracle, uint256 _disputePeriod) external onlyOwner {
        oracleDisputePeriod[_oracle] = _disputePeriod;

        emit OracleDisputePeriodAdded(_oracle, _disputePeriod);
    }
}
