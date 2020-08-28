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

    /// @notice the mapping of price

    constructor(address _oracle) public {
        require(_oracle != address(0), "ChainLinkPricer: Cannot set 0 address as oracle");
        oracle = OracleInterface(_oracle);
    }

    /**
     * @notice set aggregator address for an asset
     * @param _asset asset address
     * @param _aggregator chainlink aggregator address
     */
    function setAggregator(address _asset, address _aggregator) external onlyOwner {
        require(_aggregator != address(0), "ChainLinkPricer: Cannot set 0 address as aggregator");
        assetAggregator[_asset] = _aggregator;
    }

    /**
     * @notice get live price for a asset.
     * @dev ovverides the getPrice function in OpynPricerInterface.
     * @param _asset the address of the asset
     */
    function getPrice(address _asset) external override view returns (uint256) {
        require(assetAggregator[_asset] != address(0), "ChainLinkPricer: aggregator for the asset not set.");
        int256 answer = AggregatorInterface(assetAggregator[_asset]).latestAnswer();
        require(answer > 0, "ChainLinkPricer: price is lower than 0");
        // todo: scaled to 10e18 // 39010460929
        return uint256(answer * 1e10);
    }

    /**
     * Set the expiry price to the oracle
     * @param _asset asset address
     * @param _expiryTimestamp the expiry want to send
     * @param _roundId the first roundId after expiry
     */
    function setExpiryPriceToOralce(
        address _asset,
        uint256 _expiryTimestamp,
        uint256 _roundId
    ) external {
        require(assetAggregator[_asset] != address(0), "ChainLinkPricer: aggregator for the asset not set.");
        AggregatorInterface aggregator = AggregatorInterface(assetAggregator[_asset]);

        uint256 previousRoundTimestamp = aggregator.getTimestamp(_roundId.sub(1));
        require(previousRoundTimestamp < _expiryTimestamp, "ChainLinkPricer: invalid roundId");

        uint256 roundTimestamp = aggregator.getTimestamp(_roundId);
        require(_expiryTimestamp <= roundTimestamp, "ChainLinkPricer: invalid roundId");

        uint256 price = uint256(aggregator.getAnswer(_roundId));
        oracle.setExpiryPrice(_asset, _expiryTimestamp, price);
    }
}
