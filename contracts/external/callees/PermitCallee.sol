/**
 * SPDX-License-Identifier: UNLICENSED
 */
pragma solidity =0.6.10;

pragma experimental ABIEncoderV2;

import {CalleeInterface} from "../../interfaces/CalleeInterface.sol";
import {IERC20PermitUpgradeable} from "../../packages/oz/upgradeability/erc20-permit/IERC20PermitUpgradeable.sol";

/**
 * @title PermitCallee
 * @author Opyn Team
 * @dev Contract for executing permit signature
 */
contract PermitCallee is CalleeInterface {
    function callFunction(address payable _sender, bytes memory _data) external override {
        (
            address token,
            address owner,
            address spender,
            uint256 amount,
            uint256 deadline,
            uint8 v,
            bytes32 r,
            bytes32 s
        ) = abi.decode(_data, (address, address, address, uint256, uint256, uint8, bytes32, bytes32));

        IERC20PermitUpgradeable(token).permit(owner, spender, amount, deadline, v, r, s);
    }
}
