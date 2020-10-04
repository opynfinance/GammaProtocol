// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.10;

import {OracleInterface} from "../interfaces/OracleInterface.sol";
import {OpynPricerInterface} from "../interfaces/OpynPricerInterface.sol";

/**
 * @notice A Pricer contract for USDC
 */
contract USDCPricer is OpynPricerInterface {
    /// @dev USDC address
    address public usdc;

    /// USDC price = 1, scaled by 1e8
    uint256 private constant PRICE = 1e8;

    /// @notice Opyn Oracle address
    OracleInterface public oracle;

    constructor(address _usdc, address _oracle) public {
        usdc = _usdc;
        oracle = OracleInterface(_oracle);
    }

    /**
     * @notice get the live price for USDC, which always returns 1
     * @dev overrides the getPrice function in OpynPricerInterface
     * @return price of USDC in USD, scaled by 1e8
     */
    function getPrice() external override view returns (uint256) {
        return PRICE;
    }

    /**
     * @notice set the expiry price in the oracle
     * @param _expiryTimestamp expiry to set a price for
     */
    function setExpiryPriceInOracle(uint256 _expiryTimestamp) external {
        oracle.setExpiryPrice(address(usdc), _expiryTimestamp, PRICE);
    }
}
