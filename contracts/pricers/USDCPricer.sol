// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.10;

import {OracleInterface} from "../interfaces/OracleInterface.sol";
import {OpynPricerInterface} from "../interfaces/OpynPricerInterface.sol";

/**
 * @notice A Pricer contract for USDC.
 */
contract USDCPricer is OpynPricerInterface {
    address public usdc;

    uint256 private constant PRICE = 1e18;

    OracleInterface public oracle;

    constructor(address _usdc, address _oracle) public {
        usdc = _usdc;
        oracle = OracleInterface(_oracle);
    }

    /**
     * @notice get live price for USDC, always return 1
     * @dev overides the getPrice function in OpynPricerInterface.
     * @return price of 1e8 cToken worth in USD, scaled by 1e18.
     */
    function getPrice() external override view returns (uint256) {
        return PRICE;
    }

    /**
     * Set the expiry price to the oracle
     * @param _expiryTimestamp the expiry want to send
     */
    function setExpiryPriceToOralce(uint256 _expiryTimestamp) external {
        oracle.setExpiryPrice(address(usdc), _expiryTimestamp, PRICE);
    }
}
