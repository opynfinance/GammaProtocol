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
    address public assetProxy;
    address public staking;

    constructor(
        address _exchange,
        address _assetProxy,
        address _weth,
        address _staking,
        address _controller
    ) public {
        exchange = ZeroXExchangeInterface(_exchange);
        assetProxy = _assetProxy;
        weth = WETH9Interface(_weth);
        controller = _controller;
    }

    event Trade(
        address indexed taker,
        address indexed maker,
        address takerAsset,
        address makerAsset,
        uint256 takerAmount,
        uint256 makerAmount
    );

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
            ZeroXExchangeInterface.Order[] memory order,
            uint256[] memory takerAssetFillAmount,
            bytes[] memory signature
        ) = abi.decode(_data, (address, ZeroXExchangeInterface.Order[], uint256[], bytes[]));

        require(
            tx.origin == trader,
            "Trade0x: funds can only be transferred in from the person sending the transaction"
        );

        for (uint256 i = 0; i < order.length; i++) {
            address takerAsset = decodeERC20Asset(order[i].takerAssetData);
            // transfer takerAsset from trader to this contract
            ERC20Interface(takerAsset).safeTransferFrom(trader, address(this), takerAssetFillAmount[i]);
            // approe the 0x ERC20 Proxy to transfer takerAsset from this contract
            ERC20Interface(takerAsset).safeIncreaseAllowance(assetProxy, takerAssetFillAmount[i]);
        }

        // pull weth (to pay 0x) from _sender address
        uint256 protocolFee = tx.gasprice * PROTOCOL_FEE_BASE * order.length;
        weth.withdraw(protocolFee); //withdraw ETH from WETH to pay protocol fee

        // send txn paying protocol fee in ETH
        exchange.batchFillOrders{value: protocolFee}(order, takerAssetFillAmount, signature);

        for (uint256 i = 0; i < order.length; i++) {
            address asset = decodeERC20Asset(order[i].makerAssetData);
            // transfer swapped token to sender
            uint256 balance = ERC20Interface(asset).balanceOf(address(this));
            if (balance > 0) {
                ERC20Interface(asset).safeTransfer(trader, balance);
            }

            asset = decodeERC20Asset(order[i].takerAssetData);
            // transfer the taker asset back to the user if the order wasn't fully filled
            balance = ERC20Interface(asset).balanceOf(address(this));
            if (balance > 0) {
                ERC20Interface(asset).safeTransfer(trader, balance);
            }
        }
    }

    /**
     * @dev decode 0x AssetData into contract address
     * This is the merge of the following 2 function from 0x
     * https://github.com/0xProject/0x-monorepo/blob/0571244e9e84b9ad778bccb99b837dd6f9baaf6e/contracts/dev-utils/contracts/src/LibAssetData.sol#L69
     * https://github.com/0xProject/0x-monorepo/blob/0571244e9e84b9ad778bccb99b837dd6f9baaf6e/contracts/utils/contracts/src/LibBytes.sol#L296
     */
    function decodeERC20Asset(bytes memory b) internal pure returns (address result) {
        require(b.length == 36, "LENGTH_65_REQUIRED");

        // Add offset to index:
        // 1. Arrays are prefixed by 32-byte length parameter (add 32 to index)
        // 2. Account for size difference between address length and 32-byte storage word (subtract 12 from index)
        uint256 index = 36;

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
