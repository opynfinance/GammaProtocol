/**
 * SPDX-License-Identifier: UNLICENSED
 */

pragma solidity 0.6.10;

pragma experimental ABIEncoderV2;

import {CalleeInterface} from "../../interfaces/CalleeInterface.sol";
import {IZeroXExchange} from "../../interfaces/ZeroXExchangeInterface.sol";
import {SafeERC20} from "../../packages/oz/SafeERC20.sol";
import {ERC20Interface} from "../../interfaces/ERC20Interface.sol";
import {WETH9} from "../canonical-weth/WETH9.sol";

/**
 * @author Opyn Team
 * @title Trade0x
 * @notice callee contract to trade on 0x.
 */

contract Trade0x is CalleeInterface {
    using SafeERC20 for ERC20Interface;
    IZeroXExchange public exchange;
    ERC20Interface public weth;
    address public controller;
    address public assetProxy;
    address public staking;
    ///@dev 0x portocal fee to fill 1 order
    uint256 private PORTOCAL_FEE_BASE = 70000;

    constructor(
        address _exchange,
        address _assetProxy,
        address _weth,
        address _staking,
        address _controller
    ) public {
        exchange = IZeroXExchange(_exchange);
        assetProxy = _assetProxy;
        weth = ERC20Interface(_weth);
        weth.safeApprove(_assetProxy, uint256(-1));
        weth.safeApprove(_staking, uint256(-1));
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
     * @dev fill 0x order
     * @param _sender the original sender who wants to trade on 0x
     * @param _data abi-encoded order, fillamount, signature and feePayer. fee payer is the address we pull weth from.
     */

    function callFunction(address payable _sender, bytes memory _data) external override {
        require(msg.sender == controller, "sender not controller");

        (
            IZeroXExchange.Order[] memory order,
            uint256[] memory takerAssetFillAmount,
            bytes[] memory signature,
            address feePayer
        ) = abi.decode(_data, (IZeroXExchange.Order[], uint256[], bytes[], address));

        // for (uint256 i=0; i< order.length; i++) {
        //     address takerAsset = decodeERC20Asset(order[i].takerAssetData);
        //     // pull token from user
        //     ERC20Interface(takerAsset).safeTransferFrom(_sender, address(this), takerAssetFillAmount[i]);

        //     // approve the 0x ERC20 Proxy to move fund
        //     ERC20Interface(takerAsset).safeIncreaseAllowance(assetProxy, takerAssetFillAmount[i]);
        // }

        // // pull weth (to pay 0x) from feePayer address
        // uint256 protocolFee = tx.gasprice * PORTOCAL_FEE_BASE;
        // weth.safeTransferFrom(feePayer, address(this), protocolFee);

        // IZeroXExchange.FillResults[] memory result = exchange.batchFillOrders(order, takerAssetFillAmount, signature);

        // for (uint256 i=0; i< order.length; i++) {
        //     // transfer token to sender
        //     address makerAsset = decodeERC20Asset(order[i].makerAssetData);
        //     uint256 balance = ERC20Interface(makerAsset).balanceOf(address(this));
        //     ERC20Interface(makerAsset).safeTransfer(_sender, balance);
        // }

        // emit Trade(
        //     _sender,
        //     order.makerAddress,
        //     takerAsset,
        //     makerAsset,
        //     takerAssetFillAmount,
        //     result.makerAssetFilledAmount
        // );
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
