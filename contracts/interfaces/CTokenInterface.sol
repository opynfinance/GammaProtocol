/**
 * SPDX-License-Identifier: UNLICENSED
 */
pragma solidity 0.6.10;

import {ERC20Interface} from "./ERC20Interface.sol";

/**
 * @dev Interface of Compound cToken
 */
interface CTokenInterface is ERC20Interface {
    /**
     * @notice Calculates the exchange rate from the underlying to the CToken
     * @return Calculated exchange rate scaled by 1e18
     */
    function exchangeRateStored() external view returns (uint256);

    /**
     * msg.sender: The account which shall supply the asset, and own the minted cTokens.
     * @param _mintAmount: The amount of the asset to be supplied, in units of the underlying asset.
     * RETURN: 0 on success, otherwise an Error code
     */
    function mint(uint256 _mintAmount) external returns (uint256);
}
