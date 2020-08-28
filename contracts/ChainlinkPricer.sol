// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.10;

import {AggregatorInterface} from "./interfaces/AggregatorInterface.sol";
import {OracleInterface} from "./interfaces/OracleInterface.sol";
import {OpynPricerInterface} from "./interfaces/OpynPricerInterface.sol";
import {Ownable} from "./packages/oz/Ownable.sol";
import {SafeMath} from "./packages/oz/SafeMath.sol";

contract ChainLinkPricer is OpynPricerInterface, Ownable {
    using SafeMath for uint256;

    /// @notice the opyn oracle address
    OracleInterface public oracle;

    /// @notice the aggregator for an asset
    mapping(address => address) public assetAggregator;

    constructor(address _oracle) public {
        oracle = OracleInterface(_oracle);
    }

    function setAggregator(address _asset, address _aggregator) external onlyOwner {
        require(_aggregator != address(0), "ChainLinkPricer: Cannot set 0 address");
        assetAggregator[_asset] = _aggregator;
    }

    /**
     * @notice get live price for a asset.
     * @param _asset the address of the asset
     */
    function getPrice(address _asset) external override view returns (uint256) {
        require(assetAggregator[_asset] != address(0), "ChainLinkPricer: aggregator for the asset not set.");
        int256 answer = AggregatorInterface(assetAggregator[_asset]).latestAnswer();
        // todo: scaled to 10e18 // 39010460929
        return uint256(answer * 1e10);
    }

    /**
     * @param _asset asset address
     * @param _expiryTimestamp the expiry want to send
     * @param _roundsBack number of roundback for chainlink
     */
    function setExpiryPrice(
        address _asset,
        uint256 _expiryTimestamp,
        uint256 _roundsBack
    ) external returns (uint256) {
        require(assetAggregator[_asset] != address(0), "ChainLinkPricer: aggregator for the asset not set.");
        AggregatorInterface aggregator = AggregatorInterface(assetAggregator[_asset]);
        bool iterate = true;
        uint256 roundBack = _roundsBack;
        uint256 price = 0;

        while (iterate) {
            uint256 roundTimestamp = aggregator.getTimestamp(roundBack);
            uint256 priorRoundTimestamp = aggregator.getTimestamp(roundBack.add(1));

            if ((priorRoundTimestamp <= _expiryTimestamp) && (_expiryTimestamp < roundTimestamp)) {
                iterate = false;
                price = uint256(aggregator.getAnswer(roundBack));
            } else {
                roundBack++;
            }
        }

        // set price to oracle
        oracle.setExpiryPrice(_asset, _expiryTimestamp, price);
    }
}
