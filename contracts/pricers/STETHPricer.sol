// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.10;

import {OracleInterface} from "../interfaces/OracleInterface.sol";
import {OpynPricerInterface} from "../interfaces/OpynPricerInterface.sol";
import {STETHInterface} from "../interfaces/STETHInterface.sol";
import {ERC20Interface} from "../interfaces/ERC20Interface.sol";
import {SafeMath} from "../packages/oz/SafeMath.sol";

/**
 * @notice A Pricer contract for a Yearn yToken
 */
contract STETHPricer is OpynPricerInterface {
    using SafeMath for uint256;

    /// @notice opyn oracle address
    OracleInterface public oracle;

    /// @notice stETH token
    STETHInterface public stETH;

    /// @notice underlying asset for this yToken
    ERC20Interface public underlying;

    /**
     * @param _stETH stETH
     * @param _underlying underlying asset for stETH
     * @param _oracle Opyn Oracle contract address
     */
    constructor(
        address _stETH,
        address _underlying,
        address _oracle
    ) public {
        require(_stETH != address(0), "STETHPricer: stETH address can not be 0");
        require(_underlying != address(0), "STETHPricer: underlying address can not be 0");
        require(_oracle != address(0), "STETHPricer: oracle address can not be 0");

        stETH = STETHInterface(_stETH);
        underlying = ERC20Interface(_underlying);
        oracle = OracleInterface(_oracle);
    }

    /**
     * @notice get the live price for the asset
     * @dev overrides the getPrice function in OpynPricerInterface
     * @return price of 1e18 stETH in USD, scaled by 1e18
     */
    function getPrice() external override view returns (uint256) {
        uint256 underlyingPrice = oracle.getPrice(address(underlying));
        require(underlyingPrice > 0, "STETHPricer: underlying price is 0");
        return _underlyingPriceToSTETHPrice(underlyingPrice);
    }

    /**
     * @notice set the expiry price in the oracle
     * @dev requires that the underlying price has been set before setting a stETH price
     * @param _expiryTimestamp expiry to set a price for
     */
    function setExpiryPriceInOracle(uint256 _expiryTimestamp) external {
        (uint256 underlyingPriceExpiry, ) = oracle.getExpiryPrice(address(underlying), _expiryTimestamp);
        require(underlyingPriceExpiry > 0, "STETHPricer: underlying price not set yet");
        uint256 stETHPrice = _underlyingPriceToSTETHPrice(underlyingPriceExpiry);
        oracle.setExpiryPrice(address(stETH), _expiryTimestamp, stETHPrice);
    }

    /**
     * @dev convert underlying price to stETH price with the stETH to underlying exchange rate
     * @param _underlyingPrice price of 1 underlying token (ie 1e18 WETH) in USD, scaled by 1e8
     * @return price of 1e8 stETH in USD, scaled by 1e8
     */
    function _underlyingPriceToSTETHPrice(uint256 _underlyingPrice) private view returns (uint256) {
        uint256 pricePerShare = stETH.getPooledEthByShares(1 * 10 ** 18);
        uint8 underlyingDecimals = underlying.decimals();

        return pricePerShare.mul(_underlyingPrice).div(10**uint256(underlyingDecimals));
    }

    function getHistoricalPrice(uint80 _roundId) external override view returns (uint256, uint256) {
        revert("STETHPricer: Deprecated");
    }
}
