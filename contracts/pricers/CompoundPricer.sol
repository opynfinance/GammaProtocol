// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.10;

import {OracleInterface} from "../interfaces/OracleInterface.sol";
import {OpynPricerInterface} from "../interfaces/OpynPricerInterface.sol";
import {CTokenInterface} from "../interfaces/CTokenInterface.sol";
import {ERC20Interface} from "../interfaces/ERC20Interface.sol";
import {SafeMath} from "../packages/oz/SafeMath.sol";

/**
 * @notice A Pricer contract for Compound Asset.
 */
contract CompoundPricer is OpynPricerInterface {
    using SafeMath for uint256;

    /// @notice the opyn oracle address
    OracleInterface public oracle;

    /// @notice the pricer interface to get price for cToken's underying asset
    // If cToken is cUSDC, underlyingPricer is the Pricer for USDC
    OpynPricerInterface public underlyingPricer;

    /// @notice the compound asset (cToken) that this pricer will get price for.
    CTokenInterface public cToken;

    /// @notice the underlying sset for this cToken
    ERC20Interface public underlying;

    /**
     * @param _cToken the asset type
     * @param _underlying the underlying asset for this cToken
     * @param _underlyingPricer the pricer for cToken's underlying
     * @param _oracle the Opyn Oracle contract address.
     */
    constructor(
        address _cToken,
        address _underlying,
        address _underlyingPricer,
        address _oracle
    ) public {
        require(_cToken != address(0), "CompoundPricer: cToken address can not be 0");
        require(_underlying != address(0), "CompoundPricer: underlying address can not be 0");
        require(_underlyingPricer != address(0), "CompoundPricer: underlying pricer address can not be 0");
        require(_oracle != address(0), "CompoundPricer: oracle address can not be 0");

        cToken = CTokenInterface(_cToken);
        underlying = ERC20Interface(_underlying);
        underlyingPricer = OpynPricerInterface(_underlyingPricer);
        oracle = OracleInterface(_oracle);
    }

    /**
     * @notice get live price for the asset.
     * @dev overides the getPrice function in OpynPricerInterface.
     * @return price of 1e8 cToken worth in USD, scaled by 1e18.
     */
    function getPrice() external override view returns (uint256) {
        uint256 underlyingPrice = underlyingPricer.getPrice();
        require(underlyingPrice > 0, "CompoundPricer: underlying price is 0");
        return _underlyingPriceToCtokenPrice(underlyingPrice);
    }

    /**
     * Set the expiry price to the oracle
     * @param _expiryTimestamp the expiry want to send
     */
    function setExpiryPriceToOralce(uint256 _expiryTimestamp) external {
        (uint256 underlyingPriceExpiry, ) = oracle.getExpiryPrice(address(underlying), _expiryTimestamp);
        require(underlyingPriceExpiry > 0, "CompoundPricer: underlying price not set yet.");
        uint256 cTokenPrice = _underlyingPriceToCtokenPrice(underlyingPriceExpiry);
        oracle.setExpiryPrice(address(cToken), _expiryTimestamp, cTokenPrice);
    }

    /**
     * @dev convert underlying price to cToken price.
     * @param _underlyingPrice price of 1 underlying token (1e6 USDC, 1e18 WETH) in USD, scled by 1e18
     * @return net worth of 1e8 cToken in USD, scaled by 1e18.
     */
    function _underlyingPriceToCtokenPrice(uint256 _underlyingPrice) internal view returns (uint256) {
        uint256 underlyingDecimals = underlying.decimals();
        uint256 cTokenDecimals = cToken.decimals();
        uint256 exchangeRate = cToken.exchangeRateStored();
        return exchangeRate.mul(_underlyingPrice).mul(10**(cTokenDecimals)).div(10**(underlyingDecimals.add(18)));
    }
}
