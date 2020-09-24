/**
 * SPDX-License-Identifier: UNLICENSED
 */
pragma solidity 0.6.10;

pragma experimental ABIEncoderV2;

import {CalleeInterface} from "../../interfaces/CalleeInterface.sol";
import {WETH9} from "../canonical-weth/WETH9.sol";
import {SafeERC20} from "../../packages/oz/SafeERC20.sol";
import {ERC20Interface} from "../../interfaces/ERC20Interface.sol";

/**
 * @author Opyn Team
 * @title FlashWrap
 * @notice contract To wrap ETH
 */
contract FlashWrap is CalleeInterface {
    using SafeERC20 for ERC20Interface;
    WETH9 public WETH;

    constructor(address payable weth) public {
        WETH = WETH9(weth);
    }

    event WrappedETH(address indexed to, uint256 amount);
    event UnwrappedETH(address to, uint256 amount);

    function callFunction(
        address payable _sender,
        address _vaultOwner,
        uint256 _vaultId,
        bytes memory _data
    ) external override payable {
        uint256 amount = msg.value;

        WETH.deposit{value: amount}();
        ERC20Interface(address(WETH)).safeTransfer(_sender, amount);

        emit WrappedETH(_sender, amount);
    }
}
