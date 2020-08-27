// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.10;

interface OracleInterface {
    function isOtokenLockingPeriodOver(address _otoken) external view returns (bool);

    function isLockingPeriodOver(bytes32 _batch, uint256 _expiryTimestamp) external view returns (bool);

    function isOtokenDisputePeriodOver(address _otoken) external view returns (bool);

    function isDisputePeriodOver(bytes32 _batch, uint256 _expiryTimestamp) external view returns (bool);

    function getCollateralToStrikePrice(address _otoken) external view returns (uint256);

    function getUnderlyingPriceAtExpiry(address _otoken) external view returns (uint256, bool);

    function getBatchPrice(bytes32 _btach, uint256 _timestamp) external view returns (uint256, bool);

    function setLockingPeriod(address _oracle, uint256 _lockingPeriod) external;

    function setDisputePeriod(address _oracle, uint256 _disputePeriod) external;

    function setBatchUnderlyingPrice(
        bytes32 _batch,
        uint256 _expiryTimestamp,
        uint256 _roundsBack
    ) external;

    function disputeBatchPrice(bytes32 _batch, uint256 _price) external;
}
