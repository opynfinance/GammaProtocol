/**
 * SPDX-License-Identifier: UNLICENSED
 */
pragma solidity 0.6.10;
pragma experimental ABIEncoderV2;

import {IZeroXExchange} from "../interfaces/ZeroXExchangeInterface.sol";
import {ERC20Interface} from "../interfaces/ERC20Interface.sol";
import {SafeERC20} from "../packages/oz/SafeERC20.sol";
import {Mock0xERC20Proxy} from "./Mock0xERC20Proxy.sol";

/**
 * @notice Mock 0x Exchange
 */
contract Mock0xExchange {
    using SafeERC20 for ERC20Interface;
    uint256 public called = 0;
    uint256 public takerAmount;
    uint256 public makerAmount;
    bytes public signature;
    uint256 public fillAmount;
    Mock0xERC20Proxy public proxy;

    constructor() public {
        proxy = new Mock0xERC20Proxy();
    }

    function fillOrder(
        IZeroXExchange.Order memory _order,
        uint256 _takerAssetFillAmount,
        bytes memory _signature
    ) external payable returns (IZeroXExchange.FillResults memory fillResults) {
        takerAmount = _order.takerAssetAmount;
        makerAmount = _order.makerAssetAmount;
        signature = _signature;
        fillAmount = _takerAssetFillAmount;
        return IZeroXExchange.FillResults(0, 0, 0, 0, 0);
    }

    function decodeERC20Asset(bytes memory b) internal pure returns (address result) {
        require(b.length == 36, "LENGTH_65_REQUIRED");

        uint256 index = 16;

        // Add offset to index:
        // 1. Arrays are prefixed by 32-byte length parameter (add 32 to index)
        // 2. Account for size difference between address length and 32-byte storage word (subtract 12 from index)
        index += 20;

        // Read address from array memory
        assembly {
            // 1. Add index to address of bytes array
            // 2. Load 32-byte word from memory
            // 3. Apply 20-byte mask to obtain address
            result := and(mload(add(b, index)), 0xffffffffffffffffffffffffffffffffffffffff)
        }
        return result;
    }
}
