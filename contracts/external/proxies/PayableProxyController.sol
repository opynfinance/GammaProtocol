/**
 * SPDX-License-Identifier: UNLICENSED
 */
pragma solidity =0.6.10;

pragma experimental ABIEncoderV2;

import {WETH9} from "../../packages/canonical-weth/WETH9.sol";
import {ReentrancyGuard} from "../../packages/oz/ReentrancyGuard.sol";
import {Actions} from "../../libs/Actions.sol";
import {Controller} from "../../Controller.sol";

/**
 * @title PayableProxyController
 * @author Opyn Team
 * @dev Contractfor wrapping/unwrapping ETH before/after interacting with Gamma
 */
contract PayableProxyController is ReentrancyGuard {
    WETH9 public weth;
    Controller public controller;

    constructor(
        address _controller,
        address _marginPool,
        address payable _weth
    ) public {
        controller = Controller(_controller);
        weth = WETH9(_weth);
        weth.approve(_marginPool, uint256(-1));
    }

    /**
     * @notice Fallback function. Disallows ether to be sent to this contract without data except when unwrapping WETH.
     */
    fallback() external payable {
        require(msg.sender == address(weth), "PayableProxyController: Cannot receive ETH"); 
    }

    function operate(Actions.ActionArgs[] memory _actions, address payable sendEthTo) external payable nonReentrant {
        // create WETH from ETH
        if (msg.value != 0) {
            weth.deposit{value: msg.value}();
        }

        // verify sender
        for (uint256 i = 0; i < _actions.length; i++) {
            Actions.ActionArgs memory action = _actions[i];

            // check the msg.sender is an owner or operator
            if (action.owner != address(0)) {
                require(
                    (msg.sender == action.owner) || (controller.isOperator(action.owner, msg.sender)),
                    "PayableProxyController: cannot execute action "
                );
            }
        }

        controller.operate(_actions);

        // return all remaining WETH to the sendEthTo as ETH
        uint256 remainingWeth = weth.balanceOf(address(this));
        if (remainingWeth != 0) {
            require(sendEthTo != address(0), "PayableProxyController: cannot send ETH to address zero");

            weth.withdraw(remainingWeth);
            sendEthTo.transfer(remainingWeth);
        }
    }
}
