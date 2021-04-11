/**
 * SPDX-License-Identifier: UNLICENSED
 */

pragma solidity 0.6.10;

pragma experimental ABIEncoderV2;

import {CalleeInterface} from "../../interfaces/CalleeInterface.sol";
import {ZeroXExchangeInterface} from "../../interfaces/ZeroXExchangeInterface.sol";
import {SafeERC20} from "../../packages/oz/SafeERC20.sol";
import {ERC20Interface} from "../../interfaces/ERC20Interface.sol";
import {WETH9Interface} from "../../interfaces/WETH9Interface.sol";
import {WETH9} from "../canonical-weth/WETH9.sol";
import {ERC20PermitUpgradeable} from "../../packages/oz/upgradeability/erc20-permit/ERC20PermitUpgradeable.sol";

/**
 * @author Opyn Team
 * @title Trade0x
 * @notice callee contract to trade on 0x.
 */
contract Trade0x is CalleeInterface {
    using SafeERC20 for ERC20Interface;

    ///@dev 0x protocol fee to fill 1 order
    uint256 private PROTOCOL_FEE_BASE = 70000;

    ZeroXExchangeInterface public exchange;
    WETH9Interface public weth;

    address public controller;
    address public exchangeAddress;

    constructor(
        address _exchange,
        address _weth,
        address _controller
    ) public {
        exchange = ZeroXExchangeInterface(_exchange);
        exchangeAddress = _exchange;
        weth = WETH9Interface(_weth);
        controller = _controller;
    }

    // event Trade(
    //     address indexed taker,
    //     address indexed maker,
    //     address takerAsset,
    //     address makerAsset,
    //     uint256 takerAmount,
    //     uint256 makerAmount
    // );

    /**
     * @notice fill 0x order
     * @dev it is dangerous to do an unlimited approval to this contract
     * @param _sender the original sender who wants to trade on 0x
     * @param _data abi-encoded order, fillamount, signature and _sender. fee payer is the address we pull weth from.
     */
    function callFunction(address payable _sender, bytes memory _data) external override {
        require(msg.sender == controller, "Trade0x: sender not controller");

        _directlyTrade(_sender, _data);
    }

    function _directlyTrade(address payable _sender, bytes memory _data) internal {
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

        require(
            tx.origin == trader,
            "Trade0x: funds can only be transferred in from the person sending the transaction"
        );

        for (uint256 i = 0; i < orders.length; i++) {
            address takerAsset = orders[i].takerToken;
            // transfer takerAsset from trader to this contract
            ERC20Interface(takerAsset).safeTransferFrom(trader, address(this), takerTokenFillAmounts[i]);
            // approve the 0x ERC20 Proxy to transfer takerAsset from this contract
            ERC20Interface(takerAsset).safeIncreaseAllowance(exchangeAddress, takerTokenFillAmounts[i]);
        }

        // pull weth (to pay 0x) from _sender address
        uint256 protocolFee = tx.gasprice * PROTOCOL_FEE_BASE * orders.length;
        weth.withdraw(protocolFee); //withdraw ETH from WETH to pay protocol fee

        // send txn paying protocol fee in ETH
        exchange.batchFillLimitOrders{value: protocolFee}(orders, signatures, takerTokenFillAmounts, false);

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
}
