// SPDX-License-Identifier: MIT

pragma solidity 0.6.10;

import {ICurve} from "../interfaces/ICurve.sol";
import {IStakeDao} from "../interfaces/IStakeDao.sol";
import {OracleInterface} from "../interfaces/OracleInterface.sol";
import {SafeMath} from "../packages/oz/SafeMath.sol";

/**
 * Error Codes
 * P1: cannot deploy pricer, lpToken address cannot be 0
 * P2: cannot deploy pricer, underlying address cannot be 0
 * P3: cannot deploy pricer, oracle address cannot be 0
 * P4: cannot deploy pricer, curve address cannot be 0
 * P5: cannot retrieve price, underlying price is 0
 * P6: cannot set expiry price in oracle, underlying price is 0 and has not been set
 * P7: cannot retrieve historical prices, getHistoricalPrice has been deprecated
 */

/**
 * @title StakedaoPricer
 * @author Opyn Team
 * @notice A Pricer contract for a Stakedao lpToken
 */
contract StakedaoPricer {
    using SafeMath for uint256;

    /// @notice curve pool
    ICurve public curve;

    /// @notice lpToken that this pricer will a get price for
    IStakeDao public lpToken;

    /// @notice opyn oracle address
    OracleInterface public oracle;

    /// @notice underlying asset for this lpToken
    address public underlying;

    /**
     * @param _lpToken lpToken asset
     * @param _underlying underlying asset for this lpToken
     * @param _oracle Opyn Oracle contract address
     * @param _curve curve pool contract address
     */
    constructor(
        address _lpToken,
        address _underlying,
        address _oracle,
        address _curve
    ) public {
        require(_lpToken != address(0), "P1");
        require(_underlying != address(0), "P2");
        require(_oracle != address(0), "P3");
        require(_curve != address(0), "P4");

        lpToken = IStakeDao(_lpToken);
        underlying = _underlying;
        oracle = OracleInterface(_oracle);
        curve = ICurve(_curve);
    }

    /**
     * @notice get the live price for the asset
     * @dev overrides the getPrice function in OpynPricerInterface
     * @return price of 1 lpToken in USD, scaled by 1e8
     */
    function getPrice() external view returns (uint256) {
        uint256 underlyingPrice = oracle.getPrice(address(underlying));
        require(underlyingPrice > 0, "P5");
        return _underlyingPriceToYtokenPrice(underlyingPrice);
    }

    /**
     * @notice set the expiry price in the oracle
     * @dev requires that the underlying price has been set before setting a lpToken price
     * @param _expiryTimestamp expiry to set a price for
     */
    function setExpiryPriceInOracle(uint256 _expiryTimestamp) external {
        (uint256 underlyingPriceExpiry, ) = oracle.getExpiryPrice(underlying, _expiryTimestamp);
        require(underlyingPriceExpiry > 0, "P6");
        uint256 lpTokenPrice = _underlyingPriceToYtokenPrice(underlyingPriceExpiry);
        oracle.setExpiryPrice(address(lpToken), _expiryTimestamp, lpTokenPrice);
    }

    /**
     * @dev convert underlying price to lpToken price with the lpToken to underlying exchange rate
     * @param _underlyingPrice price of 1 underlying token (hardcoded 1e18 for WETH) in USD, scaled by 1e8
     * @return price of 1 lpToken in USD, scaled by 1e8
     */
    function _underlyingPriceToYtokenPrice(uint256 _underlyingPrice) private view returns (uint256) {
        uint256 pricePerShare = lpToken.getPricePerFullShare(); // 18 decimals
        uint256 curvePrice = curve.get_virtual_price(); // 18 decimals

        // scale by 1e36 to return price of 1 lpToken in USD, scaled by 1e8
        // assumes underlyingPrice is 1e8, curve price is 1e18, pricePerShare is 1e18
        return pricePerShare.mul(_underlyingPrice).mul(curvePrice).div(1e36);
    }

    function getHistoricalPrice(uint80) external pure returns (uint256, uint256) {
        revert("P7");
    }
}
