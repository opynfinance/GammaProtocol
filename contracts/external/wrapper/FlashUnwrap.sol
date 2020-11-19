/**
 * SPDX-License-Identifier: UNLICENSED
 */
pragma solidity 0.6.10;

pragma experimental ABIEncoderV2;

import {CalleeInterface} from "../../interfaces/CalleeInterface.sol";
import {ERC20Interface} from "../../interfaces/ERC20Interface.sol";
import {SafeERC20} from "../../packages/oz/SafeERC20.sol";
import {WETH9} from "../canonical-weth/WETH9.sol";

/**
 * @author Opyn Team
 * @title FlashUnwrap
 * @notice contract To unwrap WETH. This is just a contract to test the Call action
 */
contract FlashUnwrap is CalleeInterface {
    using SafeERC20 for ERC20Interface;

    // Number of bytes in a CallFunctionData struct
    uint256 private constant NUM_CALLFUNCTIONDATA_BYTES = 64;

    WETH9 public WETH;

    struct CallFunctionData {
        address receiver;
        uint256 amount;
    }

    constructor(address payable weth) public {
        WETH = WETH9(weth);
    }

    event WrappedETH(address indexed to, uint256 amount);
    event UnwrappedETH(address to, uint256 amount);

    // flash swap
    function callFunction(
        address payable _sender,
        address _vaultOwner,
        uint256 _vaultId,
        bytes memory _data
    ) external override payable {
        require(_data.length == NUM_CALLFUNCTIONDATA_BYTES, "FlashUnwrap: cannot parse CallFunctionData");

        CallFunctionData memory cfd = abi.decode(_data, (CallFunctionData));

        WETH.transferFrom(_sender, cfd.receiver, cfd.amount);

        // this one below, because of .transfer usage in WETH contract ?
        // WETH.withdraw(cfd.amount);

        emit UnwrappedETH(_sender, cfd.amount);
    }
}
