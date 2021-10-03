// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.10;

import {OracleInterface} from "../interfaces/OracleInterface.sol";
import {OpynPricerInterface} from "../interfaces/OpynPricerInterface.sol";
import {YearnVaultInterface} from "../interfaces/YearnVaultInterface.sol";
import {ERC20Interface} from "../interfaces/ERC20Interface.sol";
import {SafeMath} from "../packages/oz/SafeMath.sol";

/**
 * @notice A Pricer contract for a Yearn yToken
 */
contract YearnPricer is OpynPricerInterface {
    using SafeMath for uint256;

    /// @notice opyn oracle address
    OracleInterface public oracle;

    /// @notice yToken that this pricer will a get price for
    YearnVaultInterface public yToken;

    /// @notice underlying asset for this yToken
    ERC20Interface public underlying;

    /**
     * @param _yToken yToken asset
     * @param _underlying underlying asset for this yToken
     * @param _oracle Opyn Oracle contract address
     */
    constructor(
        address _yToken,
        address _underlying,
        address _oracle
    ) public {
        require(_yToken != address(0), "YearnPricer: yToken address can not be 0");
        require(_underlying != address(0), "YearnPricer: underlying address can not be 0");
        require(_oracle != address(0), "YearnPricer: oracle address can not be 0");

        yToken = YearnVaultInterface(_yToken);
        underlying = ERC20Interface(_underlying);
        oracle = OracleInterface(_oracle);
    }

    /**
     * @notice get the live price for the asset
     * @dev overrides the getPrice function in OpynPricerInterface
     * @return price of 1e8 yToken in USD, scaled by 1e8
     */
    function getPrice() external override view returns (uint256) {
        uint256 underlyingPrice = oracle.getPrice(address(underlying));
        require(underlyingPrice > 0, "YearnPricer: underlying price is 0");
        return _underlyingPriceToYtokenPrice(underlyingPrice);
    }

    /**
     * @notice set the expiry price in the oracle
     * @dev requires that the underlying price has been set before setting a yToken price
     * @param _expiryTimestamp expiry to set a price for
     */
    function setExpiryPriceInOracle(uint256 _expiryTimestamp) external {
        (uint256 underlyingPriceExpiry, ) = oracle.getExpiryPrice(address(underlying), _expiryTimestamp);
        require(underlyingPriceExpiry > 0, "YearnPricer: underlying price not set yet");
        uint256 yTokenPrice = _underlyingPriceToYtokenPrice(underlyingPriceExpiry);
        oracle.setExpiryPrice(address(yToken), _expiryTimestamp, yTokenPrice);
    }

    /**
     * @dev convert underlying price to yToken price with the yToken to underlying exchange rate
     * @param _underlyingPrice price of 1 underlying token (ie 1e6 USDC, 1e18 WETH) in USD, scaled by 1e8
     * @return price of 1e8 yToken in USD, scaled by 1e8
     */
    function _underlyingPriceToYtokenPrice(uint256 _underlyingPrice) private view returns (uint256) {
        uint256 pricePerShare = yToken.pricePerShare();
        uint8 underlyingDecimals = underlying.decimals();

        return pricePerShare.mul(_underlyingPrice).div(10**uint256(underlyingDecimals));
    }

    function getHistoricalPrice(uint80 _roundId) external override view returns (uint256, uint256) {
        revert("YearnPricer: Deprecated");
    }
}
