// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.10;

import {OracleInterface} from "../interfaces/OracleInterface.sol";
import {OpynPricerInterface} from "../interfaces/OpynPricerInterface.sol";
import {YTokenInterface} from "../interfaces/YTokenInterface.sol";
import {ERC20Interface} from "../interfaces/ERC20Interface.sol";
import {SafeMath} from "../packages/oz/SafeMath.sol";

/**
 * @notice A Pricer contract for a Compound yToken
 */
contract YTokenPricer is OpynPricerInterface {
    using SafeMath for uint256;

    /// @notice opyn oracle address
    OracleInterface public oracle;

    /// @notice pricer interface to get the price for the yToken's underying asset
    // if the yToken is cUSDC, underlyingPricer is the pricer for USDC
    OpynPricerInterface public underlyingPricer;

    /// @notice yToken that this pricer will a get price for
    YTokenInterface public yToken;

    /// @notice underlying asset for this yToken
    ERC20Interface public underlying;

    /**
     * @param _yToken yToken asset
     * @param _underlying underlying asset for this yToken
     * @param _underlyingPricer pricer for yToken's underlying
     * @param _oracle Opyn Oracle contract address
     */
    constructor(
        address _yToken,
        address _underlying,
        address _underlyingPricer,
        address _oracle
    ) public {
        require(_yToken != address(0), "YTokenPricer: yToken address can not be 0");
        require(_underlying != address(0), "YTokenPricer: underlying address can not be 0");
        require(_underlyingPricer != address(0), "YTokenPricer: underlying pricer address can not be 0");
        require(_oracle != address(0), "YTokenPricer: oracle address can not be 0");

        yToken = YTokenInterface(_yToken);
        underlying = ERC20Interface(_underlying);
        underlyingPricer = OpynPricerInterface(_underlyingPricer);
        oracle = OracleInterface(_oracle);
    }

    /**
     * @notice get the live price for the asset
     * @dev overrides the getPrice function in OpynPricerInterface
     * @return price of 1e8 yToken in USD, scaled by 1e8
     */
    function getPrice() external override view returns (uint256) {
        uint256 underlyingPrice = underlyingPricer.getPrice();
        require(underlyingPrice > 0, "YTokenPricer: underlying price is 0");
        return _underlyingPriceToYtokenPrice(underlyingPrice);
    }

    /**
     * @notice set the expiry price in the oracle
     * @dev requires that the underlying price has been set before setting a yToken price
     * @param _expiryTimestamp expiry to set a price for
     */
    function setExpiryPriceInOracle(uint256 _expiryTimestamp) external {
        (uint256 underlyingPriceExpiry, ) = oracle.getExpiryPrice(address(underlying), _expiryTimestamp);
        require(underlyingPriceExpiry > 0, "YTokenPricer: underlying price not set yet");
        uint256 yTokenPrice = _underlyingPriceToYtokenPrice(underlyingPriceExpiry);
        oracle.setExpiryPrice(address(yToken), _expiryTimestamp, yTokenPrice);
    }

    /**
     * @dev convert underlying price to yToken price with the yToken to underlying exchange rate
     * @param _underlyingPrice price of 1 underlying token (ie 1e6 USDC, 1e18 WETH) in USD, scaled by 1e8
     * @return price of 1e18 yToken in USD, scaled by 1e8
     */
    function _underlyingPriceToYtokenPrice(uint256 _underlyingPrice) internal view returns (uint256) {
        return (_underlyingPrice * 3) / 2;
        // uint256 underlyingDecimals = underlying.decimals();
        // uint256 yTokenDecimals = yToken.decimals();
        // uint256 yTokenTotalValue = yToken.calcPoolValueInToken(); // amount in USD
        // uint256 yTokenTotalSupply = yToken.totalSupply(); // in yUSD
        // return exchangeRate
        //     .mul(_underlyingPrice)
        //     .mul(10**(yTokenDecimals))
        //     .div(10**(underlyingDecimals.add(18)));
    }
}
