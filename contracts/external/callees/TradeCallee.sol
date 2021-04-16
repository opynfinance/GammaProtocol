/**
 * SPDX-License-Identifier: UNLICENSED
 */

pragma solidity 0.6.10;

pragma experimental ABIEncoderV2;

import {CalleeInterface} from "../../interfaces/CalleeInterface.sol";
import {ZeroXExchangeInterface} from "../../interfaces/ZeroXExchangeInterface.sol";
import {ERC20Interface} from "../../interfaces/ERC20Interface.sol";
import {WETH9Interface} from "../../interfaces/WETH9Interface.sol";

import {SafeERC20} from "../../packages/oz/SafeERC20.sol";

/**
 * @author Opyn Team
 * @title TradeCallee
 * @notice callee contract to trade on 0x.
 */
contract TradeCallee is CalleeInterface {
    using SafeERC20 for ERC20Interface;

    ///@dev 0x protocol fee to fill 1 order
    uint256 private PROTOCOL_FEE_BASE = 70000;

    ZeroXExchangeInterface public exchange;
    WETH9Interface public weth;

    address public controller;

    constructor(
        address _exchange,
        address _weth,
        address _controller
    ) public {
        exchange = ZeroXExchangeInterface(_exchange);
        weth = WETH9Interface(_weth);
        controller = _controller;
    }

    /**
     * @notice fill 0x order
     * @param _sender the original sender who wants to trade on 0x
     * @param _data abi-encoded order, fillamount, signature and _sender. fee payer is the address we pull weth from.
     */
    function callFunction(address payable _sender, bytes memory _data) external override {
        require(msg.sender == controller, "TradeCallee: sender is not controller");

        (
            address trader,
            ZeroXExchangeInterface.LimitOrder[] memory orders,
            ZeroXExchangeInterface.Signature[] memory signatures,
            uint128[] memory takerTokenFillAmounts,
            bool revertIfIncomplete
        ) = abi.decode(
            _data,
            (address, ZeroXExchangeInterface.LimitOrder[], ZeroXExchangeInterface.Signature[], uint128[], bool)
        );

        // _sender is not always the user, could be the payable proxy, so we use tx.origin.
        // won't work with Argent (Wallet Connect).
        require(
            tx.origin == trader,
            "TradeCallee: funds can only be transferred in from the person sending the transaction"
        );

        for (uint256 i = 0; i < orders.length; i++) {
            address takerAsset = orders[i].takerToken;
            // transfer takerAsset from trader to this contract
            ERC20Interface(takerAsset).safeTransferFrom(trader, address(this), takerTokenFillAmounts[i]);
            // approve the 0x ERC20 Proxy to transfer takerAsset from this contract
            ERC20Interface(takerAsset).safeIncreaseAllowance(address(exchange), takerTokenFillAmounts[i]);
        }

        // pull weth (to pay 0x) from _sender address
        uint256 protocolFee = tx.gasprice * PROTOCOL_FEE_BASE * orders.length;
        weth.transferFrom(_sender, address(this), protocolFee);
        weth.withdraw(protocolFee); //withdraw ETH from WETH to pay protocol fee

        // send txn paying protocol fee in ETH
        exchange.batchFillLimitOrders{value: protocolFee}(
            orders,
            signatures,
            takerTokenFillAmounts,
            revertIfIncomplete
        );

        for (uint256 i = 0; i < orders.length; i++) {
            // address asset = decodeERC20Asset(order[i].makerAssetData);
            address asset = orders[i].makerToken;
            // transfer swapped token to sender
            uint256 balance = ERC20Interface(asset).balanceOf(address(this));
            if (balance > 0) {
                ERC20Interface(asset).safeTransfer(trader, balance);
            }

            // asset = decodeERC20Asset(order[i].takerAssetData);
            asset = orders[i].takerToken;
            // transfer the taker asset back to the user if the order wasn't fully filled
            balance = ERC20Interface(asset).balanceOf(address(this));
            if (balance > 0) {
                ERC20Interface(asset).safeTransfer(trader, balance);
            }
        }
    }

    /**
     * @notice fallback function which allow ETH to be sent to this contract
     */
    fallback() external payable {}
}
