/**
 * SPDX-License-Identifier: UNLICENSED
 */
pragma solidity =0.6.10;
pragma experimental ABIEncoderV2;

import {ReentrancyGuard} from "../../packages/oz/ReentrancyGuard.sol";
import {SafeERC20} from "../../packages/oz/SafeERC20.sol";
import {ERC20Interface} from "../../interfaces/ERC20Interface.sol";
import {Actions} from "../../libs/Actions.sol";
import {Controller} from "../../Controller.sol";
import {CTokenInterface} from "../../interfaces/CTokenInterface.sol";

/**
 * @title CTokenProxy
 * @author Opyn Team
 * @dev Contract for wrapping/unwrapping cToken before minting options
 */
contract CTokenProxy is ReentrancyGuard {
    using SafeERC20 for ERC20Interface;
    using SafeERC20 for CTokenInterface;

    Controller public controller;
    address public marginPool;

    constructor(address _controller, address _marginPool) public {
        controller = Controller(_controller);
        marginPool = _marginPool;
    }

    /**
     * @notice execute a number of actions
     * @dev a wrapper for the Controller operate function, to wrap uderlying to CToken beginning and
     * @param _actions array of actions arguments
     */
    function operate(
        Actions.ActionArgs[] memory _actions,
        address _underlying,
        address _cToken,
        uint256 _amountUnderlying
    ) external payable nonReentrant {
        ERC20Interface underlying = ERC20Interface(_underlying);
        CTokenInterface cToken = CTokenInterface(_cToken);
        // pull token from user
        underlying.safeTransferFrom(msg.sender, address(this), _amountUnderlying);
        // mint cToken
        underlying.safeApprove(_cToken, _amountUnderlying);
        cToken.mint(_amountUnderlying);

        uint256 allowance = cToken.allowance(address(this), marginPool);
        uint256 cTokenBalance = cToken.balanceOf(address(this));
        if (allowance < cTokenBalance) {
            cToken.safeApprove(marginPool, uint256(-1));
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

            // overwrite the deposit amount by the exact amount minted
            if (action.actionType == Actions.ActionType.DepositCollateral && action.amount == 0) {
                _actions[i].amount = cTokenBalance;
            }
        }

        controller.operate(_actions);
    }
}
