// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.10;

import {AggregatorInterface} from "./interfaces/AggregatorInterface.sol";
import {OracleInterface} from "./interfaces/OracleInterface.sol";
import {OpynPricerInterface} from "./interfaces/OpynPricerInterface.sol";
import {SafeMath} from "./packages/oz/SafeMath.sol";

/**
 * @notice A Pricer contract for Chainlink for 1 asset
 */
contract ChainLinkPricer is OpynPricerInterface {
    using SafeMath for uint256;

    /// @notice the opyn oracle address
    OracleInterface public oracle;

    /// @notice the aggregator for an asset
    AggregatorInterface public aggregator;

    address public asset;

    /**
     * @param _asset the asset type that this pricer help relay
     * @param _aggregator the ChainLink aggregator contract for this asset
     * @param _oracle the Opyn Oracle contract address.
     */
    constructor(
        address _asset,
        address _aggregator,
        address _oracle
    ) public {
        require(_oracle != address(0), "ChainLinkPricer: Cannot set 0 address as oracle");
        require(_aggregator != address(0), "ChainLinkPricer: Cannot set 0 address as aggregator");
        oracle = OracleInterface(_oracle);
        aggregator = AggregatorInterface(_aggregator);
        asset = _asset;
    }

    /**
     * @notice get live price for the asset.
     * @dev overides the getPrice function in OpynPricerInterface.
     * @return price of asset scaled by 1e18
     */
    function getPrice() external override view returns (uint256) {
        int256 answer = aggregator.latestAnswer();
        require(answer > 0, "ChainLinkPricer: price is lower than 0");
        // Scaled to 1e18 from 1e8
        return uint256(answer * 1e10);
    }

    /**
     * Set the expiry price to the oracle
     * @param _expiryTimestamp the expiry want to send
     * @param _roundId the first roundId after expiry
     */
    function setExpiryPriceToOralce(uint256 _expiryTimestamp, uint256 _roundId) external {
        uint256 previousRoundTimestamp = aggregator.getTimestamp(_roundId.sub(1));
        require(previousRoundTimestamp < _expiryTimestamp, "ChainLinkPricer: invalid roundId");

        uint256 roundTimestamp = aggregator.getTimestamp(_roundId);
        require(_expiryTimestamp <= roundTimestamp, "ChainLinkPricer: invalid roundId");

        uint256 price = uint256(aggregator.getAnswer(_roundId));
        oracle.setExpiryPrice(asset, _expiryTimestamp, price);
    }
}
