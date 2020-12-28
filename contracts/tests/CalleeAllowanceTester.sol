/**
 * SPDX-License-Identifier: UNLICENSED
 */
pragma solidity 0.6.10;

pragma experimental ABIEncoderV2;

import {CalleeInterface} from "../interfaces/CalleeInterface.sol";
import {ERC20Interface} from "../interfaces/ERC20Interface.sol";
import {SafeERC20} from "../packages/oz/SafeERC20.sol";

/**
 * @author Opyn Team
 * @title CalleeAllowanceTester
 * @notice contract test if we can successfully pull weth from the payable proxy
 */
contract CalleeAllowanceTester is CalleeInterface {
    using SafeERC20 for ERC20Interface;
    ERC20Interface public weth;

    constructor(address _weth) public {
        weth = ERC20Interface(_weth);
    }

    // tset pull token
    function callFunction(address payable, bytes memory _data) external override {
        (address from, uint256 amount) = abi.decode(_data, (address, uint256));

        weth.safeTransferFrom(from, address(this), amount);
    }
}
