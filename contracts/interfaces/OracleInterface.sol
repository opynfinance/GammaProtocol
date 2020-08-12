// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.10;

interface OracleInterface {
    function isLockingPeriodOver(bytes32 _batch, uint256 _expiryTimestamp) external view returns (bool);

    function isDisputePeriodOver(bytes32 _batch, uint256 _expiryTimestamp) external view returns (bool);

    function isPriceFinalized(bytes32 _batch) external view returns (bool);

    function getBatchPrice(bytes32 _batch, uint256 _timestamp) external view returns (uint256, bool);

    function setLockingPeriod(address _oracle, uint256 _lockingPeriod) external;

    function setDisputePeriod(address _oracle, uint256 _disputePeriod) external;

    function setBatchUnderlyingPrice(
        bytes32 _batch,
        uint256 _expiryTimestamp,
        uint256 _roundsBack
    ) external;

    function disputeBatchPrice(bytes32 _batch, uint256 _price) external;
}
