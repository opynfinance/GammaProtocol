// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.10;

import {AggregatorInterface} from "../interfaces/AggregatorInterface.sol";
import {OracleInterface} from "../interfaces/OracleInterface.sol";
import {OpynPricerInterface} from "../interfaces/OpynPricerInterface.sol";
import {SafeMath} from "../packages/oz/SafeMath.sol";

/**
 * @notice A Pricer contract for one asset as reported by Chainlink
 */
contract ChainLinkPricer is OpynPricerInterface {
    using SafeMath for uint256;

    /// @dev base decimals
    uint256 internal constant BASE = 8;

    /// @notice chainlink response decimals
    uint256 public aggregatorDecimals;

    /// @notice the opyn oracle address
    OracleInterface public oracle;
    /// @notice the aggregator for an asset
    AggregatorInterface public aggregator;

    /// @notice asset that this pricer will a get price for
    address public asset;
    /// @notice bot address that is allowed to call setExpiryPriceInOracle
    address public bot;

    /**
     * @param _bot priveleged address that can call setExpiryPriceInOracle
     * @param _asset asset that this pricer will get a price for
     * @param _aggregator Chainlink aggregator contract for the asset
     * @param _oracle Opyn Oracle address
     */
    constructor(
        address _bot,
        address _asset,
        address _aggregator,
        address _oracle
    ) public {
        require(_bot != address(0), "ChainLinkPricer: Cannot set 0 address as bot");
        require(_oracle != address(0), "ChainLinkPricer: Cannot set 0 address as oracle");
        require(_aggregator != address(0), "ChainLinkPricer: Cannot set 0 address as aggregator");

        bot = _bot;
        oracle = OracleInterface(_oracle);
        aggregator = AggregatorInterface(_aggregator);
        asset = _asset;

        aggregatorDecimals = uint256(aggregator.decimals());
    }

    /**
     * @notice modifier to check if sender address is equal to bot address
     */
    modifier onlyBot() {
        require(msg.sender == bot, "ChainLinkPricer: unauthorized sender");

        _;
    }

    /**
     * @notice set the expiry price in the oracle, can only be called by Bot address
     * @dev a roundId must be provided to confirm price validity, which is the first Chainlink price provided after the expiryTimestamp
     * @param _expiryTimestamp expiry to set a price for
     * @param _roundId the first roundId after expiryTimestamp
     */
    function setExpiryPriceInOracle(uint256 _expiryTimestamp, uint80 _roundId) external onlyBot {
        (, int256 price, , uint256 roundTimestamp, ) = aggregator.getRoundData(_roundId);

        require(_expiryTimestamp <= roundTimestamp, "ChainLinkPricer: invalid roundId");

        oracle.setExpiryPrice(asset, _expiryTimestamp, uint256(price));
    }

    /**
     * @notice get the live price for the asset
     * @dev overides the getPrice function in OpynPricerInterface
     * @return price of the asset in USD, scaled by 1e8
     */
    function getPrice() external override view returns (uint256) {
        (, int256 answer, , , ) = aggregator.latestRoundData();
        require(answer > 0, "ChainLinkPricer: price is lower than 0");
        // chainlink's answer is already 1e8
        return _scaleToBase(uint256(answer));
    }

    /**
     * @notice get historical chainlink price
     * @param _roundId chainlink round id
     * @return round price and timestamp
     */
    function getHistoricalPrice(uint80 _roundId) external override view returns (uint256, uint256) {
        (, int256 price, , uint256 roundTimestamp, ) = aggregator.getRoundData(_roundId);
        return (_scaleToBase(uint256(price)), roundTimestamp);
    }

    /**
     * @notice scale aggregator response to base decimals (1e8)
     * @param _price aggregator price
     * @return price scaled to 1e8
     */
    function _scaleToBase(uint256 _price) internal view returns (uint256) {
        if (aggregatorDecimals > BASE) {
            uint256 exp = aggregatorDecimals.sub(BASE);
            _price = _price.div(10**exp);
        } else if (aggregatorDecimals < BASE) {
            uint256 exp = BASE.sub(aggregatorDecimals);
            _price = _price.mul(10**exp);
        }

        return _price;
    }
}
