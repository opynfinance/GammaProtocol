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
import {CERC20Interface} from "../../interfaces/CERC20Interface.sol";

/**
 * @title CERC20Proxy
 * @author Opyn Team
 * @dev Contract for wrapping cToken before minting options
 */
contract CERC20Proxy is ReentrancyGuard {
    using SafeERC20 for ERC20Interface;
    using SafeERC20 for CERC20Interface;

    Controller public controller;
    address public marginPool;

    constructor(address _controller, address _marginPool) public {
        controller = Controller(_controller);
        marginPool = _marginPool;
    }

    /**
     * @notice execute a number of actions after minting some cTokens
     * @dev a wrapper for the Controller operate function, to wrap uderlying to cToken before the excution.
     * @param _actions array of actions arguments
     * @param _underlying underlying asset
     * @param _cToken the cToken to mint
     * @param _amountUnderlying the amount of underlying to supply to Compound
     */
    function operate(
        Actions.ActionArgs[] memory _actions,
        address _underlying,
        address _cToken,
        uint256 _amountUnderlying
    ) external nonReentrant {
        ERC20Interface underlying = ERC20Interface(_underlying);
        CERC20Interface cToken = CERC20Interface(_cToken);

        // if depositing token: pull token from user
        uint256 cTokenBalance = 0;
        if (_amountUnderlying > 0) {
            underlying.safeTransferFrom(msg.sender, address(this), _amountUnderlying);
            // mint cToken
            underlying.safeApprove(_cToken, _amountUnderlying);
            cToken.mint(_amountUnderlying);
            cTokenBalance = cToken.balanceOf(address(this));
            cToken.safeApprove(marginPool, cTokenBalance);
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

        // unwrap and withdraw cTokens that have been added to contract via operate function
        uint256 cTokenBalanceAfter = cToken.balanceOf(address(this));
        if (cTokenBalanceAfter > 0) {
            require(cToken.redeem(cTokenBalanceAfter) == 0, "CTokenPricer: Redeem Failed");
            uint256 underlyingBalance = underlying.balanceOf(address(this));
            underlying.safeTransfer(msg.sender, underlyingBalance);
        }
    }
}
