// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.10;

import {OracleInterface} from "../interfaces/OracleInterface.sol";
import {OpynPricerInterface} from "../interfaces/OpynPricerInterface.sol";
import {ERC20Interface} from "../interfaces/ERC20Interface.sol";
import {SafeMath} from "../packages/oz/SafeMath.sol";

/**
 * @notice A Pricer contract for aTokens
 */
contract ATokenPricer is OpynPricerInterface {
    using SafeMath for uint256;

    /// @notice opyn oracle address
    OracleInterface public oracle;

    /// @notice pricer interface to get the price for the cToken's underying asset
    // if the cToken is cUSDC, underlyingPricer is the pricer for USDC
    OpynPricerInterface public underlyingPricer;

    /// @notice cToken that this pricer will a get price for
    ERC20Interface public aToken;

    /// @notice underlying asset for this aToken
    ERC20Interface public underlying;

    /**
     * @param _aToken aToken asset
     * @param _underlying underlying asset for this aToken
     * @param _underlyingPricer pricer for aToken's underlying
     * @param _oracle Opyn Oracle contract address
     */
    constructor(
        address _aToken,
        address _underlying,
        address _underlyingPricer,
        address _oracle
    ) public {
        require(_aToken != address(0), "ATokenPricer: aToken address can not be 0");
        require(_underlying != address(0), "ATokenPricer: underlying address can not be 0");
        require(_underlyingPricer != address(0), "ATokenPricer: underlying pricer address can not be 0");
        require(_oracle != address(0), "ATokenPricer: oracle address can not be 0");

        aToken = ERC20Interface(_aToken);
        underlying = ERC20Interface(_underlying);
        underlyingPricer = OpynPricerInterface(_underlyingPricer);
        oracle = OracleInterface(_oracle);
    }

    /**
     * @notice get the live price for the asset
     * @dev overrides the getPrice function in OpynPricerInterface
     * @return price of 1e6 aUSD in USD, scaled by 1e8
     */
    function getPrice() external override view returns (uint256) {
        return underlyingPricer.getPrice();
    }

    /**
     * @notice set the expiry price in the oracle
     * @dev requires that the underlying price has been set before setting a aToken price
     * @param _expiryTimestamp expiry to set a price for
     */
    function setExpiryPriceInOracle(uint256 _expiryTimestamp) external {
        (uint256 underlyingPriceExpiry, ) = oracle.getExpiryPrice(address(underlying), _expiryTimestamp);
        require(underlyingPriceExpiry > 0, "CompoundPricer: underlying price not set yet");
        oracle.setExpiryPrice(address(aToken), _expiryTimestamp, underlyingPriceExpiry);
    }
}
