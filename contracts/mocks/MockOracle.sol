// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.10;

import "../packages/oz/SafeMath.sol";

contract MockOracle {
    using SafeMath for uint256;

    struct Price {
        uint256 price;
        uint256 timestamp; // timestamp at which the price is pushed to this oracle
    }

    mapping(address => mapping(uint256 => uint256)) public storedPrice;
    mapping(address => mapping(uint256 => bool)) public isFinalized;

    mapping(address => uint256) internal pricerLockingPeriod;
    mapping(address => uint256) internal pricerDisputePeriod;
    mapping(address => address) internal assetPricer;

    // asset => expiry => bool
    mapping(address => mapping(uint256 => bool)) private _isDisputePeriodOver;
    mapping(address => mapping(uint256 => bool)) private _isLockingPeriodOver;

    // let the pricer set expiry price to oracle.
    function setExpiryPrice(
        address _asset,
        uint256 _expiryTimestamp,
        uint256 _price
    ) external {
        storedPrice[_asset][_expiryTimestamp] = _price;
    }

    function setIsFinalized(
        address _asset,
        uint256 _expiryTimestamp,
        bool _isFinalized
    ) external {
        isFinalized[_asset][_expiryTimestamp] = _isFinalized;
    }

    function getExpiryPrice(address _asset, uint256 _expiryTimestamp) external view returns (uint256, bool) {
        return (storedPrice[_asset][_expiryTimestamp], isFinalized[_asset][_expiryTimestamp]);
    }

    /**
     * @notice get asset pricer
     * @param _asset get the pricer for a specific asset.
     * @return pricer address
     */
    function getPricer(address _asset) external view returns (address) {
        return assetPricer[_asset];
    }

    /**
     * @notice get pricer locking period. A locking period is a period of time after expiry where no one can push price to oracle
     * @dev during locking period, price can not be submitted to this contract
     * @param _pricer pricer address
     * @return locking period
     */
    function getPricerLockingPeriod(address _pricer) external view returns (uint256) {
        return pricerLockingPeriod[_pricer];
    }

    function getPricerDisputePeriod(address _pricer) external view returns (uint256) {
        return pricerDisputePeriod[_pricer];
    }

    function isLockingPeriodOver(address _asset, uint256 _expiryTimestamp) public view returns (bool) {
        return _isLockingPeriodOver[_asset][_expiryTimestamp];
    }

    function setIsLockingPeriodOver(
        address _asset,
        uint256 _expiryTimestamp,
        bool _result
    ) external {
        _isLockingPeriodOver[_asset][_expiryTimestamp] = _result;
    }

    function isDisputePeriodOver(address _asset, uint256 _expiryTimestamp) external view returns (bool) {
        return _isDisputePeriodOver[_asset][_expiryTimestamp];
    }

    function setIsDisputePeriodOver(
        address _asset,
        uint256 _expiryTimestamp,
        bool _result
    ) external {
        _isDisputePeriodOver[_asset][_expiryTimestamp] = _result;
    }

    function setAssetPricer(address _asset, address _pricer) external {
        assetPricer[_asset] = _pricer;
    }

    function setLockingPeriod(address _pricer, uint256 _lockingPeriod) external {
        pricerLockingPeriod[_pricer] = _lockingPeriod;
    }

    function setDisputePeriod(address _pricer, uint256 _disputePeriod) external {
        pricerDisputePeriod[_pricer] = _disputePeriod;
    }
}
