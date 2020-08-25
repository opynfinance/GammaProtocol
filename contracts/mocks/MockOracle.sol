/**
 * SPDX-License-Identifier: UNLICENSED
 */
pragma solidity 0.6.10;

import "../packages/oz/SafeMath.sol";

/**
 * @notice Chainlink oracle mock
 */
contract MockOracle {
    using SafeMath for uint256;

    struct Price {
        uint256 price;
        uint256 timestamp;
    }

    mapping(address => uint256) internal oracleLockingPeriod;
    mapping(address => uint256) internal oracleDisputePeriod;
    mapping(bytes32 => address) internal batchOracle;
    mapping(bytes32 => mapping(uint256 => Price)) internal batchPriceAt;

    function getBatchPrice(bytes32 _batch, uint256 _timestamp) external view returns (uint256, uint256) {
        Price memory batchPrice = batchPriceAt[_batch][_timestamp];
        return (batchPrice.price, batchPrice.timestamp);
    }

    function getBatchOracle(bytes32 _batch) external view returns (address) {
        return batchOracle[_batch];
    }

    function getOracleLockingPeriod(address _oracle) external view returns (uint256) {
        return oracleLockingPeriod[_oracle];
    }

    function getOracleDisputePeriod(address _oracle) external view returns (uint256) {
        return oracleDisputePeriod[_oracle];
    }

    function isLockingPeriodOver(bytes32 _batch, uint256 _expiryTimestamp) public view returns (bool) {
        address oracle = batchOracle[_batch];
        uint256 lockingPeriod = oracleLockingPeriod[oracle];

        return now > _expiryTimestamp.add(lockingPeriod);
    }

    function isDisputePeriodOver(bytes32 _batch, uint256 _expiryTimestamp) public view returns (bool) {
        address oracle = batchOracle[_batch];
        uint256 disputePeriod = oracleDisputePeriod[oracle];

        Price memory batchPrice = batchPriceAt[_batch][_expiryTimestamp];

        if (batchPrice.timestamp == 0) {
            return false;
        }

        return now > batchPrice.timestamp.add(disputePeriod);
    }

    function setBatchOracle(bytes32 _batch, address _oracle) external {
        batchOracle[_batch] = _oracle;
    }

    function setLockingPeriod(address _oracle, uint256 _lockingPeriod) external {
        oracleLockingPeriod[_oracle] = _lockingPeriod;
    }

    function setDisputePeriod(address _oracle, uint256 _disputePeriod) external {
        oracleDisputePeriod[_oracle] = _disputePeriod;
    }

    function disputeBatchPrice(
        bytes32 _batch,
        uint256 _expiryTimestamp,
        uint256 _price
    ) external {
        require(!isDisputePeriodOver(_batch, _expiryTimestamp), "Oracle: dispute period over");

        Price storage batchPrice = batchPriceAt[_batch][_expiryTimestamp];
        batchPrice.price = _price;
    }

    function setBatchUnderlyingPrice(
        bytes32 _batch,
        uint256 _expiryTimestamp,
        uint256 _price
    ) external {
        require(batchOracle[_batch] != address(0), "Oracle: no oracle for this specific batch");
        require(isLockingPeriodOver(_batch, _expiryTimestamp), "Oracle: locking period is not over yet");
        require(batchPriceAt[_batch][_expiryTimestamp].timestamp == 0, "Oracle: dispute period started");

        batchPriceAt[_batch][_expiryTimestamp] = Price(_price, now);
    }
}
