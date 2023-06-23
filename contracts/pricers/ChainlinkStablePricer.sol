// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.10;

import {OracleInterface} from "../interfaces/OracleInterface.sol";
import {OpynPricerInterface} from "../interfaces/OpynPricerInterface.sol";

/**
 * @notice A Pricer contract to push stable USDC price (1:1 to USD)
 */
contract ChainlinkStablePricer is OpynPricerInterface {
    /// @notice the opyn oracle address
    OracleInterface public oracle;

    /// @notice asset that this pricer will a get price for
    address public asset;

    /**
     * @param _asset asset that this pricer will get a price for
     * @param _oracle Opyn Oracle address
     */
    constructor(address _asset, address _oracle) public {
        require(_oracle != address(0), "ChainLinkPricer: Cannot set 0 address as oracle");

        oracle = OracleInterface(_oracle);
        asset = _asset;
    }

    /**
     * @notice set the expiry price in the oracle, always 1e8
     * @param _expiryTimestamp expiry to set a price for
     */
    function setExpiryPriceInOracle(uint256 _expiryTimestamp) external {
        oracle.setExpiryPrice(asset, _expiryTimestamp, uint256(1e8));
    }

    /**
     * @notice get the live price for the asset
     * @dev overides the getPrice function in OpynPricerInterface
     * @return price of the asset in USD, scaled by 1e8
     */
    function getPrice() external view override returns (uint256) {
        return uint256(1e8);
    }

    /**
     * @notice get historical USDC price (always 1e8)
     * @return round price and timestamp
     */
    function getHistoricalPrice(
        uint80 /*_roundId*/
    ) external view override returns (uint256, uint256) {
        return ((uint256(1e8)), block.timestamp);
    }
}
