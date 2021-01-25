/**
 * SPDX-License-Identifier: UNLICENSED
 */
pragma solidity 0.6.10;
pragma experimental ABIEncoderV2;

import {ZeroXExchangeInterface} from "../interfaces/ZeroXExchangeInterface.sol";
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
        ZeroXExchangeInterface.Order memory _order,
        uint256 _takerAssetFillAmount,
        bytes memory _signature
    ) public payable returns (ZeroXExchangeInterface.FillResults memory fillResults) {
        takerAmount = _order.takerAssetAmount;
        makerAmount = _order.makerAssetAmount;
        signature = _signature;
        fillAmount = _takerAssetFillAmount;
        return ZeroXExchangeInterface.FillResults(0, 0, 0, 0, 0);
    }

    function batchFillOrders(
        ZeroXExchangeInterface.Order[] memory _orders,
        uint256[] memory _takerAssetFillAmounts,
        bytes[] memory _signatures
    ) external payable returns (ZeroXExchangeInterface.FillResults memory fillResults) {
        for (uint256 i = 0; i < _orders.length; i++) {
            fillOrder(_orders[i], _takerAssetFillAmounts[i], _signatures[i]);
        }
        return ZeroXExchangeInterface.FillResults(0, 0, 0, 0, 0);
    }
}
