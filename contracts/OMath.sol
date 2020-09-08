/**
 * SPDX-License-Identifier: UNLICENSED
 */
pragma solidity 0.6.10;
pragma experimental ABIEncoderV2;

import {SafeMath} from "./packages/oz/SafeMath.sol";
import {OtokenInterface} from "./interfaces/OtokenInterface.sol";
import {ERC20Interface} from "./interfaces/ERC20Interface.sol";

contract OMath {
    using SafeMath for uint256;

    /**
     * @dev convert a uint256 amount
     * Examples:
     * (1)  USDC    decimals = 6
     *      Input:  8000000 USDC =>     Output: 8 * 1e18 (8.0 USDC)
     * (2)  cUSDC   decimals = 8
     *      Input:  8000000 cUSDC =>    Output: 8 * 1e16 (0.08 cUSDC)
     * (3)  rUSD    decimals = 20 (random USD)
     *      Input:  15                    =>   Output:  0       rUSDC
     * @return internal amount that is sacled by 1e18.
     */
    function _tokenAmountToInternalAmount(uint256 _amount, address _token) internal view returns (uint256) {
        ERC20Interface token = ERC20Interface(_token);
        uint256 decimals = uint256(token.decimals());
        uint256 base = 18;
        if (decimals == base) return _amount;
        if (decimals > base) {
            uint256 exp = decimals - base;
            return _amount.div(10**exp);
        } else {
            uint256 exp = base - decimals;
            return _amount.mul(10**exp);
        }
    }

    /**
     * @dev convert an internal amount (1e18) to native token amount
     * Examples:
     * (1)  USDC    decimals = 6
     *      Input:  8 * 1e18 (8.0 USDC)   =>   Output:  8000000 USDC
     * (2)  cUSDC   decimals = 8
     *      Input:  8 * 1e16 (0.08 cUSDC) =>   Output:  8000000 cUSDC
     * (3)  rUSD    decimals = 20 (random USD)
     *      Input:  1                    =>    Output:  100     rUSDC
     * @return token amount in its native form.
     */
    function _internalAmountToTokenAmount(uint256 _amount, address _token) internal view returns (uint256) {
        ERC20Interface token = ERC20Interface(_token);
        uint256 decimals = uint256(token.decimals());
        uint256 base = 18;
        if (decimals == base) return _amount;
        if (decimals > base) {
            uint256 exp = decimals - base;
            return _amount.mul(10**exp);
        } else {
            uint256 exp = base - decimals;
            return _amount.div(10**exp);
        }
    }
}
