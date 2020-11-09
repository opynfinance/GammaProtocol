/**
 * SPDX-License-Identifier: UNLICENSED
 */
pragma solidity =0.6.10;
pragma experimental ABIEncoderV2;

import {ReentrancyGuard} from "../../packages/oz/ReentrancyGuard.sol";
import {SafeERC20} from "../../packages/oz/SafeERC20.sol";
import {ERC20Interface} from "../../interfaces/ERC20Interface.sol";
import {ATokenInterface} from "../../interfaces/ATokenInterface.sol";
import {Actions} from "../../libs/Actions.sol";
import {Controller} from "../../Controller.sol";
import {AaveLendingPoolInterface} from "../../interfaces/AaveLendingPoolInterface.sol";

/**
 * @title ATokenProxy
 * @author Opyn Team
 * @dev Contract for wrapping aToken before minting options
 */
contract ATokenProxy is ReentrancyGuard {
    using SafeERC20 for ERC20Interface;
    using SafeERC20 for ATokenInterface;

    Controller public controller;
    address public marginPool;

    AaveLendingPoolInterface public lendingPool = AaveLendingPoolInterface(0x398eC7346DcD622eDc5ae82352F02bE94C62d119);

    constructor(address _controller, address _marginPool) public {
        controller = Controller(_controller);
        marginPool = _marginPool;
    }

    /**
     * @notice execute a number of actions after minting some aTokens
     * @dev a wrapper for the Controller operate function, to wrap uderlying to aToken before the excution.
     * @param _actions array of actions arguments
     * @param _underlying underlying asset
     * @param _aToken the aToken to mint
     * @param _amountUnderlying the amount of underlying to supply to Compound
     */
    function operate(
        Actions.ActionArgs[] memory _actions,
        address _underlying,
        address _aToken,
        uint256 _amountUnderlying
    ) external payable nonReentrant {
        ERC20Interface underlying = ERC20Interface(_underlying);
        ATokenInterface aToken = ATokenInterface(_aToken);

        // if depositing token: pull token from user
        if (_amountUnderlying > 0) {
            underlying.safeTransferFrom(msg.sender, address(this), _amountUnderlying);
            // mint aToken
            underlying.safeApprove(0x3dfd23A6c5E8BbcFc9581d2E864a68feb6a076d3, _amountUnderlying);

            /// Deposit method call, get aToken
            lendingPool.deposit(_underlying, _amountUnderlying, 0);

            uint256 allowance = aToken.allowance(address(this), marginPool);
            uint256 aTokenBalance = aToken.balanceOf(address(this));
            if (allowance < aTokenBalance) {
                aToken.safeApprove(marginPool, uint256(-1));
            }
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
        }

        controller.operate(_actions);

        uint256 aTokenBalanceAfter = aToken.balanceOf(address(this));
        if (aTokenBalanceAfter > 0) {
            aToken.redeem(aTokenBalanceAfter);
            uint256 underlyingBalance = underlying.balanceOf(address(this));
            underlying.safeTransfer(msg.sender, underlyingBalance);
        }
    }
}
