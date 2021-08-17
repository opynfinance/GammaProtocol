// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.6.10;

import {OracleInterface} from "../interfaces/OracleInterface.sol";
import {OpynPricerInterface} from "../interfaces/OpynPricerInterface.sol";
import {WSTETHInterface} from "../interfaces/WSTETHInterface.sol";
import {SafeMath} from "../packages/oz/SafeMath.sol";

/**
 * @notice A Pricer contract for a Yearn yToken
 */
contract WstethPricer is OpynPricerInterface {
    using SafeMath for uint256;

    /// @notice opyn oracle address
    OracleInterface public oracle;

    /// @notice wstETH token
    WSTETHInterface public wstETH;

    /// @notice underlying asset (WETH)
    address public underlying;

    /**
     * @param _wstETH wstETH
     * @param _underlying underlying asset for wstETH
     * @param _oracle Opyn Oracle contract address
     */
    constructor(
        address _wstETH,
        address _underlying,
        address _oracle
    ) public {
        require(_wstETH != address(0), "WSTETHPricer: wstETH address can not be 0");
        require(_underlying != address(0), "WSTETHPricer: underlying address can not be 0");
        require(_oracle != address(0), "WSTETHPricer: oracle address can not be 0");

        wstETH = WSTETHInterface(_wstETH);
        oracle = OracleInterface(_oracle);
        underlying = _underlying;
    }

    /**
     * @notice get the live price for the asset
     * @dev overrides the getPrice function in OpynPricerInterface
     * @return price of 1e18 stETH in USD, scaled by 1e8
     */
    function getPrice() external view override returns (uint256) {
        uint256 underlyingPrice = oracle.getPrice(address(underlying));
        require(underlyingPrice > 0, "STETHPricer: underlying price is 0");
        return _underlyingPriceToWstethPrice(underlyingPrice);
    }

    /**
     * @notice set the expiry price in the oracle
     * @dev requires that the underlying price has been set before setting a yToken price
     * @param _expiryTimestamp expiry to set a price for
     */
    function setExpiryPriceInOracle(uint256 _expiryTimestamp) external {
        (uint256 underlyingPriceExpiry, ) = oracle.getExpiryPrice(underlying, _expiryTimestamp);
        require(underlyingPriceExpiry > 0, "WSTETHPricer: underlying price not set yet");
        uint256 wstEthPrice = _underlyingPriceToWstethPrice(underlyingPriceExpiry);
        oracle.setExpiryPrice(address(wstETH), _expiryTimestamp, wstEthPrice);
    }

    /**
     * @dev convert underlying price to wstETH price with the wstETH to stETH exchange rate (1stETH = 1 ETH)
     * @param _underlyingPrice price of 1 underlying token (ie 1e18 WETH) in USD, scaled by 1e8
     * @return price of 1e8 wstETH in USD, scaled by 1e8
     */
    function _underlyingPriceToWstethPrice(uint256 _underlyingPrice) private view returns (uint256) {
        uint256 stEthPerWsteth = wstETH.stEthPerToken();

        return stEthPerWsteth.mul(_underlyingPrice).div(1e18);
    }

    function getHistoricalPrice(uint80 _roundId) external view override returns (uint256, uint256) {
        revert("WSTETHPricer: Deprecated");
    }
}
