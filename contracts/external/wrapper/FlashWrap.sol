/**
 * SPDX-License-Identifier: UNLICENSED
 */
pragma solidity 0.6.10;

pragma experimental ABIEncoderV2;

import {WETH9} from "../../packages/canonical-weth/WETH9.sol";

/**
 * @author Opyn Team
 * @title FlashWrap
 * @notice contract To wrap ETH
 */
contract FlashWrap is CalleeInterface {
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
    ) external payable {
        uint256 amount = msg.value;

        WETH.deposit{value: amount}();
        WETH.transfer(_sender, amount);

        emit WrappedETH(_sender, amount);
    }
}
