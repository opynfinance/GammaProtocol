pragma solidity =0.6.10;

import {SafeMath} from "../packages/oz/SafeMath.sol";
import {OpynPricerInterface} from "../interfaces/OpynPricerInterface.sol";

/**
 * SPDX-License-Identifier: UNLICENSED
 * @dev The MockOracle contract let us easily manipulate the oracle state in testings.
 */
contract MockOracle {
    struct Price {
        uint256 price;
        uint256 timestamp; // timestamp at which the price is pushed to this oracle
    }

    using SafeMath for uint256;

    mapping(address => uint256) public realTimePrice;
    mapping(address => mapping(uint256 => uint256)) public storedPrice;
    mapping(address => uint256) internal stablePrice;
    mapping(address => mapping(uint256 => bool)) public isFinalized;

    mapping(address => uint256) internal pricerLockingPeriod;
    mapping(address => uint256) internal pricerDisputePeriod;
    mapping(address => address) internal assetPricer;

    // asset => expiry => bool
    mapping(address => mapping(uint256 => bool)) private _isDisputePeriodOver;
    mapping(address => mapping(uint256 => bool)) private _isLockingPeriodOver;

    // chainlink historic round data, asset => round => price/timestamp
    mapping(address => mapping(uint80 => uint256)) private _roundPrice;
    mapping(address => mapping(uint80 => uint256)) private _roundTimestamp;

    function setRealTimePrice(address _asset, uint256 _price) external {
        realTimePrice[_asset] = _price;
    }

    // get chainlink historic round data
    function getChainlinkRoundData(address _asset, uint80 _roundId) external view returns (uint256, uint256) {
        uint256 price = _roundPrice[_asset][_roundId];
        uint256 timestamp = _roundTimestamp[_asset][_roundId];

        return (price, timestamp);
    }

    function getPrice(address _asset) external view returns (uint256) {
        uint256 price = stablePrice[_asset];

        if (price == 0) {
            price = realTimePrice[_asset];
        }

        return price;
    }

    // set chainlink historic data for specific round id
    function setChainlinkRoundData(
        address _asset,
        uint80 _roundId,
        uint256 _price,
        uint256 _timestamp
    ) external returns (uint256, uint256) {
        _roundPrice[_asset][_roundId] = _price;
        _roundTimestamp[_asset][_roundId] = _timestamp;
    }

    // set bunch of things at expiry in 1 function
    function setExpiryPriceFinalizedAllPeiodOver(
        address _asset,
        uint256 _expiryTimestamp,
        uint256 _price,
        bool _isFinalized
    ) external {
        storedPrice[_asset][_expiryTimestamp] = _price;
        isFinalized[_asset][_expiryTimestamp] = _isFinalized;
        _isDisputePeriodOver[_asset][_expiryTimestamp] = _isFinalized;
        _isLockingPeriodOver[_asset][_expiryTimestamp] = _isFinalized;
    }

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
        uint256 price = stablePrice[_asset];
        bool _isFinalized = true;

        if (price == 0) {
            price = storedPrice[_asset][_expiryTimestamp];
            _isFinalized = isFinalized[_asset][_expiryTimestamp];
        }

        return (price, _isFinalized);
    }

    function getPricer(address _asset) external view returns (address) {
        return assetPricer[_asset];
    }

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

    function setStablePrice(address _asset, uint256 _price) external {
        stablePrice[_asset] = _price;
    }
}
