/**
 * SPDX-License-Identifier: UNLICENSED
 */
pragma solidity 0.6.10;

pragma experimental ABIEncoderV2;

import {CalleeInterface} from "../interfaces/CalleeInterface.sol";
import {ERC20Interface} from "../interfaces/ERC20Interface.sol";
import {SafeERC20} from "../packages/oz/SafeERC20.sol";
import {WETH9} from "../external/canonical-weth/WETH9.sol";

/**
 * @author Opyn Team
 * @title FlashUnwrap
 * @notice contract To unwrap WETH. This is just a contract to test the Call action
 */
contract FlashUnwrap is CalleeInterface {
    using SafeERC20 for ERC20Interface;

    // Number of bytes in a CallFunctionData struct
    uint256 private constant NUM_CALLFUNCTIONDATA_BYTES = 32;

    WETH9 public WETH;

    struct CallFunctionData {
        uint256 amount;
    }

    constructor(address payable weth) public {
        WETH = WETH9(weth);
    }

    event WrappedETH(address indexed to, uint256 amount);
    event UnwrappedETH(address to, uint256 amount);

    receive() external payable {}

    // flash unwrap
    function callFunction(address payable _sender, bytes memory _data) external override {
        require(_data.length == NUM_CALLFUNCTIONDATA_BYTES, "FlashUnwrap: cannot parse CallFunctionData");

        CallFunctionData memory cfd = abi.decode(_data, (CallFunctionData));

        WETH.transferFrom(_sender, address(this), cfd.amount);
        WETH.withdraw(cfd.amount);

        _sender.transfer(cfd.amount);

        emit UnwrappedETH(_sender, cfd.amount);
    }
}
