// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.10;

import {AggregatorInterface} from "./interfaces/AggregatorInterface.sol";
import {OracleInterface} from "./interfaces/OracleInterface.sol";
import {OpynPricerInterface} from "./interfaces/OpynPricerInterface.sol";
import {SafeMath} from "./packages/oz/SafeMath.sol";

abstract contract ChainLinkPricer is OpynPricerInterface {
    using SafeMath for uint256;

    /// @notice the chainlink price aggregator
    AggregatorInterface public aggregator;

    /// @notice the opyn oracle address
    OracleInterface public oracle;

    constructor(address _aggregator, address _oracle) public {
        aggregator = AggregatorInterface(_aggregator);
        oracle = OracleInterface(_oracle);
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
