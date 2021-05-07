/**
 * SPDX-License-Identifier: UNLICENSED
 */
pragma solidity =0.6.10;

pragma experimental ABIEncoderV2;

import {WETH9} from "../canonical-weth/WETH9.sol";
import {ReentrancyGuard} from "../../packages/oz/ReentrancyGuard.sol";
import {SafeERC20} from "../../packages/oz/SafeERC20.sol";
import {ERC20Interface} from "../../interfaces/ERC20Interface.sol";
import {Actions} from "../../libs/Actions.sol";
import {Controller} from "../../core/Controller.sol";
import {Address} from "../../packages/oz/Address.sol";

/**
 * @title PayableProxyController
 * @author Opyn Team
 * @dev Contract for wrapping/unwrapping ETH before/after interacting with the Gamma Protocol
 */
contract PayableProxyController is ReentrancyGuard {
    using SafeERC20 for ERC20Interface;
    using Address for address payable;

    WETH9 public weth;
    Controller public controller;

    constructor(
        address _controller,
        address _marginPool,
        address payable _weth
    ) public {
        controller = Controller(_controller);
        weth = WETH9(_weth);
        ERC20Interface(address(weth)).safeApprove(_marginPool, uint256(-1));
    }

    /**
     * @notice fallback function which disallows ETH to be sent to this contract without data except when unwrapping WETH
     */
    fallback() external payable {
        require(msg.sender == address(weth), "PayableProxyController: Cannot receive ETH");
    }

    /**
     * @notice execute a number of actions
     * @dev a wrapper for the Controller operate function, to wrap WETH and the beginning and unwrap WETH at the end of the execution
     * @param _actions array of actions arguments
     * @param _sendEthTo address to send the remaining eth to
     */
    function operate(Actions.ActionArgs[] memory _actions, address payable _sendEthTo) external payable nonReentrant {
        // create WETH from ETH
        if (msg.value != 0) {
            weth.deposit{value: msg.value}();
        }

        // verify sender
        for (uint256 i = 0; i < _actions.length; i++) {
            Actions.ActionArgs memory action = _actions[i];

            // check that msg.sender is an owner or operator
            if (action.owner != address(0)) {
                require(
                    (msg.sender == action.owner) || (controller.isOperator(action.owner, msg.sender)),
                    "PayableProxyController: cannot execute action "
                );
            }

            if (action.actionType == Actions.ActionType.Call) {
                // our PayableProxy could ends up approving amount > total eth received.
                ERC20Interface(address(weth)).safeIncreaseAllowance(action.secondAddress, msg.value);
            }
        }

        controller.operate(_actions);

        // return all remaining WETH to the sendEthTo address as ETH
        uint256 remainingWeth = weth.balanceOf(address(this));
        if (remainingWeth != 0) {
            require(_sendEthTo != address(0), "PayableProxyController: cannot send ETH to address zero");

            weth.withdraw(remainingWeth);
            _sendEthTo.sendValue(remainingWeth);
        }
    }
}
