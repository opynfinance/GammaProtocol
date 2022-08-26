// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.6.10;
import {OracleInterface} from "../interfaces/OracleInterface.sol";
import {OpynPricerInterface} from "../interfaces/OpynPricerInterface.sol";
import {SAVAXInterface} from "../interfaces/SAVAXInterface.sol";
import {SafeMath} from "../packages/oz/SafeMath.sol";

/**
 * Error Codes
 * W1: cannot deploy pricer, sAVAX address cannot be 0
 * W2: cannot deploy pricer, underlying address cannot be 0
 * W3: cannot deploy pricer, oracle address cannot be 0
 * W4: cannot retrieve price, underlying price is 0
 * W5: cannot set expiry price in oracle, underlying price is 0 and has not been set
 * W6: cannot retrieve historical prices, getHistoricalPrice has been deprecated
 */

/**
 * @title SAvaxPricer
 * @author Ben Burns (abwburns@gmail.com)
 * @notice A Pricer contract for a sAVAX token
 */
contract SAvaxPricer is OpynPricerInterface {
    using SafeMath for uint256;

    /// @notice opyn oracle address
    OracleInterface public oracle;

    /// @notice sAVAX token
    SAVAXInterface public sAVAX;

    /// @notice underlying asset (AVAX)
    address public underlying;

    /**
     * @param _sAVAX sAVAX
     * @param _underlying underlying asset for sAVAX
     * @param _oracle Opyn Oracle contract address
     */
    constructor(
        address _sAVAX,
        address _underlying,
        address _oracle
    ) public {
        require(_sAVAX != address(0), "W1");
        require(_underlying != address(0), "W2");
        require(_oracle != address(0), "W3");

        sAVAX = SAVAXInterface(_sAVAX);
        oracle = OracleInterface(_oracle);
        underlying = _underlying;
    }

    /**
     * @notice get the live price for the asset
     * @dev overrides the getPrice function in OpynPricerInterface
     * @return price of 1 sAVAX in USD, scaled by 1e8
     */
    function getPrice() external view override returns (uint256) {
        uint256 underlyingPrice = oracle.getPrice(underlying);
        require(underlyingPrice > 0, "W4");
        return _underlyingPriceToSAvaxPrice(underlyingPrice);
    }

    /**
     * @notice set the expiry price in the oracle
     * @dev requires that the underlying price has been set before setting a sAVAx price
     * @param _expiryTimestamp expiry to set a price for
     */
    function setExpiryPriceInOracle(uint256 _expiryTimestamp) external {
        (uint256 underlyingPriceExpiry, ) = oracle.getExpiryPrice(underlying, _expiryTimestamp);
        require(underlyingPriceExpiry > 0, "W5");
        uint256 sAvaxPrice = _underlyingPriceToSAvaxPrice(underlyingPriceExpiry);
        oracle.setExpiryPrice(address(sAVAX), _expiryTimestamp, sAvaxPrice);
    }

    /**
     * @dev convert underlying price to sAVAX price with the sAVAX to AVAX exchange rate (1 sAVAX ≈ 1 AVAX)
     * @param _underlyingPrice price of 1 underlying token (ie 1e18 AVAX) in USD, scaled by 1e8
     * @return price of 1 sAVAX in USD, scaled by 1e8
     */
    function _underlyingPriceToSAvaxPrice(uint256 _underlyingPrice) private view returns (uint256) {
        // Passing 1e18 to getPooledAvaxByShares() gives us the number of AVAX per sAVAX.
        uint256 sAvaxPerAvax = sAVAX.getPooledAvaxByShares(1e18);
        return sAvaxPerAvax.mul(_underlyingPrice).div(1e18);
    }

    function getHistoricalPrice(uint80) external view override returns (uint256, uint256) {
        revert("W6");
    }
}
