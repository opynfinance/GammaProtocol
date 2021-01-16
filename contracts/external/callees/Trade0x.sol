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
import {ERC20PermitUpgradeable} from "../../packages/oz/upgradeability/erc20-permit/ERC20PermitUpgradeable.sol";

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
     * @notice fill 0x order
     * @dev it is dangerous to do an unlimited approval to this contract
     * @param _sender the original sender who wants to trade on 0x
     * @param _data abi-encoded order, fillamount, signature and _sender. fee payer is the address we pull weth from.
     */
    function callFunction(address payable _sender, bytes memory _data) external override {
        require(msg.sender == controller, "sender not controller");
        _directlyTrade(_sender, _data);
    }

    function _directlyTrade(address payable _sender, bytes memory _data) internal {
        (
            address trader,
            IZeroXExchange.Order[] memory order,
            uint256[] memory takerAssetFillAmount,
            bytes[] memory signature,
            uint256[] memory deadlines,
            uint8[] memory v,
            bytes32[] memory r,
            bytes32[] memory s
        ) = abi.decode(
            _data,
            (address, IZeroXExchange.Order[], uint256[], bytes[], uint256[], uint8[], bytes32[], bytes32[])
        );

        for (uint256 i = 0; i < order.length; i++) {
            address takerAsset = decodeERC20Asset(order[i].takerAssetData);
            // pull token from user
            // ERC20Interface(takerAsset).safeTransferFrom(trader, address(this), takerAssetFillAmount[i]);
            ERC20PermitUpgradeable(takerAsset).permit(
                trader,
                address(this),
                takerAssetFillAmount[i],
                deadlines[i],
                v[i],
                r[i],
                s[i]
            );
            // approve the 0x ERC20 Proxy to move fund
            ERC20Interface(takerAsset).safeIncreaseAllowance(assetProxy, takerAssetFillAmount[i]);
        }

        // pull weth (to pay 0x) from _sender address
        uint256 protocolFee = tx.gasprice * PORTOCAL_FEE_BASE;
        weth.safeTransferFrom(_sender, address(this), protocolFee);

        IZeroXExchange.FillResults[] memory result = exchange.batchFillOrders(order, takerAssetFillAmount, signature);

        for (uint256 i = 0; i < order.length; i++) {
            // transfer swapped token to sender
            address makerAsset = decodeERC20Asset(order[i].makerAssetData);
            uint256 balance = ERC20Interface(makerAsset).balanceOf(address(this));
            if (balance > 0) {
                ERC20Interface(makerAsset).safeTransfer(trader, balance);
            }

            // transfer the taker asset back to the user if the order wasn't fully filled
            address takerAsset = decodeERC20Asset(order[i].takerAssetData);
            balance = ERC20Interface(takerAsset).balanceOf(address(this));
            if (balance > 0) {
                ERC20Interface(takerAsset).safeTransfer(trader, balance);
            }
        }
    }

    function getTxHash(IZeroXExchange.Transaction memory transaction) external pure returns (bytes32 result) {

            bytes32 _EIP712_ZEROEX_TRANSACTION_SCHEMA_HASH
         = 0xec69816980a3a3ca4554410e60253953e9ff375ba4536a98adfa15cc71541508;
        bytes32 schemaHash = _EIP712_ZEROEX_TRANSACTION_SCHEMA_HASH;
        bytes memory data = transaction.data;
        uint256 salt = transaction.salt;
        uint256 expirationTimeSeconds = transaction.expirationTimeSeconds;
        uint256 gasPrice = transaction.gasPrice;
        address signerAddress = transaction.signerAddress;

        assembly {
            // Compute hash of data
            let dataHash := keccak256(add(data, 32), mload(data))

            // Load free memory pointer
            let memPtr := mload(64)

            mstore(memPtr, schemaHash) // hash of schema
            mstore(add(memPtr, 32), salt) // salt
            mstore(add(memPtr, 64), expirationTimeSeconds) // expirationTimeSeconds
            mstore(add(memPtr, 96), gasPrice) // gasPrice
            mstore(add(memPtr, 128), and(signerAddress, 0xffffffffffffffffffffffffffffffffffffffff)) // signerAddress
            mstore(add(memPtr, 160), dataHash) // hash of data

            // Compute hash
            result := keccak256(memPtr, 192)
        }
        return result;
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
