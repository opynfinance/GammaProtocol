// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.10;

import {OracleInterface} from "../interfaces/OracleInterface.sol";
import {OpynPricerInterface} from "../interfaces/OpynPricerInterface.sol";
import {CTokenInterface} from "../interfaces/CTokenInterface.sol";
import {ERC20Interface} from "../interfaces/ERC20Interface.sol";
import {SafeMath} from "../packages/oz/SafeMath.sol";

/**
 * @notice A Pricer contract for a Compound cToken
 */
contract CompoundPricer is OpynPricerInterface {
    using SafeMath for uint256;

    /// @notice opyn oracle address
    OracleInterface public oracle;

    /// @notice cToken that this pricer will a get price for
    CTokenInterface public cToken;

    /// @notice underlying asset for this cToken
    ERC20Interface public underlying;

    /**
     * @param _cToken cToken asset
     * @param _underlying underlying asset for this cToken
     * @param _oracle Opyn Oracle contract address
     */
    constructor(
        address _cToken,
        address _underlying,
        address _oracle
    ) public {
        require(_cToken != address(0), "CompoundPricer: cToken address can not be 0");
        require(_underlying != address(0), "CompoundPricer: underlying address can not be 0");
        require(_oracle != address(0), "CompoundPricer: oracle address can not be 0");

        cToken = CTokenInterface(_cToken);
        underlying = ERC20Interface(_underlying);
        oracle = OracleInterface(_oracle);
    }

    /**
     * @notice get the live price for the asset
     * @dev overrides the getPrice function in OpynPricerInterface
     * @return price of 1e8 cToken in USD, scaled by 1e8
     */
    function getPrice() external override view returns (uint256) {
        uint256 underlyingPrice = oracle.getPrice(address(underlying));
        require(underlyingPrice > 0, "CompoundPricer: underlying price is 0");
        return _underlyingPriceToCtokenPrice(underlyingPrice);
    }

    /**
     * @notice set the expiry price in the oracle
     * @dev requires that the underlying price has been set before setting a cToken price
     * @param _expiryTimestamp expiry to set a price for
     */
    function setExpiryPriceInOracle(uint256 _expiryTimestamp) external {
        (uint256 underlyingPriceExpiry, ) = oracle.getExpiryPrice(address(underlying), _expiryTimestamp);
        require(underlyingPriceExpiry > 0, "CompoundPricer: underlying price not set yet");
        uint256 cTokenPrice = _underlyingPriceToCtokenPrice(underlyingPriceExpiry);
        oracle.setExpiryPrice(address(cToken), _expiryTimestamp, cTokenPrice);
    }

    /**
     * @dev convert underlying price to cToken price with the cToken to underlying exchange rate
     * @param _underlyingPrice price of 1 underlying token (ie 1e6 USDC, 1e18 WETH) in USD, scaled by 1e8
     * @return price of 1e8 cToken in USD, scaled by 1e8
     */
    function _underlyingPriceToCtokenPrice(uint256 _underlyingPrice) internal view returns (uint256) {
        uint256 underlyingDecimals = uint256(underlying.decimals());
        uint256 cTokenDecimals = uint256(cToken.decimals());
        uint256 exchangeRate = cToken.exchangeRateStored();
        return exchangeRate.mul(_underlyingPrice).mul(10**(cTokenDecimals)).div(10**(underlyingDecimals.add(18)));
    }
}
