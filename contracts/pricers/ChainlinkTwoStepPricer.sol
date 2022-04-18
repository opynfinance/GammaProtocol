// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.10;
import {AggregatorInterface} from "../interfaces/AggregatorInterface.sol";
import {OracleInterface} from "../interfaces/OracleInterface.sol";
import {OpynPricerInterface} from "../interfaces/OpynPricerInterface.sol";
import {SafeMath} from "../packages/oz/SafeMath.sol";

/**
 * @notice A Pricer contract for one asset as reported by Chainlink
 */
contract ChainlinkTwoStepPricer is OpynPricerInterface {
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
    /// @notice asset used to convert to USD
    address public weth;

    /**
     * @param _bot priveleged address that can call setExpiryPriceInOracle
     * @param _asset asset that this pricer will get a price for
     * @param _weth  asset used to convert to USD
     * @param _aggregator Chainlink aggregator contract for the asset
     * @param _oracle Opyn Oracle address
     */
    constructor(
        address _bot,
        address _asset,
        address _weth,
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
        weth = _weth;
        aggregatorDecimals = uint256(aggregator.decimals());
    }

    /**
     * @notice set the expiry price in the oracle, can only be called by Bot address
     * @dev a roundId must be provided to confirm price validity, which is the first Chainlink price provided after the expiryTimestamp
     * @param _expiryTimestamp expiry to set a price for
     * @param _roundId the first roundId after expiryTimestamp
     */
    function setExpiryPriceInOracle(uint256 _expiryTimestamp, uint80 _roundId) external {
        (, int256 priceInETH, , uint256 roundTimestamp, ) = aggregator.getRoundData(_roundId);
        require(_expiryTimestamp <= roundTimestamp, "ChainLinkPricer: roundId not first after expiry");
        require(priceInETH >= 0, "ChainLinkPricer: invalid priceInETH");
        if (msg.sender != bot) {
            bool isCorrectRoundId;
            uint80 previousRoundId = uint80(uint256(_roundId).sub(1));
            while (!isCorrectRoundId) {
                (, , , uint256 previousRoundTimestamp, ) = aggregator.getRoundData(previousRoundId);
                if (previousRoundTimestamp == 0) {
                    require(previousRoundId > 0, "ChainLinkPricer: Invalid previousRoundId");
                    previousRoundId = previousRoundId - 1;
                } else if (previousRoundTimestamp > _expiryTimestamp) {
                    revert("ChainLinkPricer: previousRoundId not last before expiry");
                } else {
                    isCorrectRoundId = true;
                }
            }
        }
        (uint256 wethPriceExpiry, ) = oracle.getExpiryPrice(weth, _expiryTimestamp);
        require(wethPriceExpiry > 0, "W5"); //error fix later
        uint256 tokenUSDPrice = _tokenToUsdPrice(uint256(priceInETH), wethPriceExpiry);
        oracle.setExpiryPrice(asset, _expiryTimestamp, tokenUSDPrice);
    }

    /**
     * @notice get the live price for the asset
     * @dev overides the getPrice function in OpynPricerInterface
     * @return price of the asset in USD, scaled by 1e8
     */
    function getPrice() external view override returns (uint256) {
        (, int256 answer, , , ) = aggregator.latestRoundData();
        require(answer > 0, "ChainLinkPricer: price is lower than 0");
        // chainlink's answer is already 1e8
        uint256 wethPrice = oracle.getPrice(weth);
        require(wethPrice > 0, "Underlying price is 0");
        return _tokenToUsdPrice(uint256(answer), wethPrice);
    }

    function getHistoricalPrice(uint80) external view override returns (uint256, uint256) {
        revert("GetHistoricalPrice has been deprecated");
    }

    /**
     * @dev convert token's price in ether terms with the token to ETH exchange rate to usd terms
     * @param _tokenPerEth token price in ETH, scaled to 1e18
     * @param _ethUsdPrice ETH price in USD, scaled to 1e8
     * @return price of 1 token in USD, scaled to 1e8
     */
    function _tokenToUsdPrice(uint256 _tokenPerEth, uint256 _ethUsdPrice) private pure returns (uint256) {
        return _tokenPerEth.mul(_ethUsdPrice).div(1e18);
    }
}
