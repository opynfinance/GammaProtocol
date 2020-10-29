/**
 * SPDX-License-Identifier: UNLICENSED
 */
pragma solidity 0.6.10;

pragma experimental ABIEncoderV2;

import {CalleeInterface} from "../../interfaces/CalleeInterface.sol";
import {IZeroXExchange} from "../../interfaces/ZeroXExchangeInterface.sol";
import {SafeERC20} from "../../packages/oz/SafeERC20.sol";
import {ERC20Interface} from "../../interfaces/ERC20Interface.sol";

/**
 * @author Opyn Team
 * @title Trade0x
 * @notice callee contract to trade on 0x.
 */
contract Trade0x is CalleeInterface {
    using SafeERC20 for ERC20Interface;
    IZeroXExchange public exchange;
    address public assetProxy;

    constructor(address _exchange, address _assetProxy) public {
        exchange = IZeroXExchange(_exchange);
        assetProxy = _assetProxy;
    }

    event Trade0xBatch(address indexed to, uint256 amount);
    event UnwrappedETH(address to, uint256 amount);

    address public testTakerAsset;
    address public testMakerAsset;
    uint256 public testFillAmount;
    bytes public testSig;

    function callFunction(
        address payable _sender,
        address, /* _vaultOwner */
        uint256, /* _vaultId, */
        bytes memory _data
    ) external override payable {
        (IZeroXExchange.Order memory order, uint256 takerAssetFillAmount, bytes memory signature) = abi.decode(
            _data,
            (IZeroXExchange.Order, uint256, bytes)
        );

        address makerAsset = decodeERC20Asset(order.makerAssetData);
        testMakerAsset = makerAsset;

        address takerAsset = decodeERC20Asset(order.takerAssetData);
        testTakerAsset = takerAsset;

        ERC20Interface(takerAsset).safeTransferFrom(_sender, address(this), takerAssetFillAmount);

        // approve the proxy if not done before
        uint256 allowance = ERC20Interface(takerAsset).allowance(address(this), assetProxy);
        if (allowance < takerAssetFillAmount) {
            ERC20Interface(takerAsset).safeApprove(assetProxy, uint256(-8));
        }

        exchange.fillOrder{value: msg.value}(order, takerAssetFillAmount, signature);

        // transfer token to sender
        uint256 balance = ERC20Interface(makerAsset).balanceOf(address(this));
        ERC20Interface(makerAsset).safeTransfer(_sender, balance);

        // transfer any excess fee back to user
        _sender.transfer(address(this).balance);
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
