// SPDX-License-Identifier: UNLICENSED
/* solhint-disable */
pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import {MarginAccountLib} from "./MarginAccount.sol";
import {Actions} from "./Actions.sol";
// Interfaces
import {IOtoken} from "../interfaces/IOtoken.sol";
import {IAddressBook} from "../interfaces/IAddressBook.sol";
import {IMarginPool} from "../interfaces/IMarginPool.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

library ControllerImpl {
    using MarginAccountLib for MarginAccountLib.Vault;

    function _operate(
        MarginAccountLib.Vault storage vault, 
        Actions.ActionArgs[] memory actions,
        IAddressBook addressBook
    ) internal {
        // Vaults.Vault storage vault = account[user].vaults[vaultId];

        IMarginPool pool = addressBook.getMarginPool();
        // IMarginPool pool = addressBook.getMarginPool();

        _runActions(vault, actions, pool);

        // _checkRequirement(vault)
    }

    /**
     * Run actions
     */
    function _runActions(
        MarginAccountLib.Vault storage vault,
        Actions.ActionArgs[] memory actions,
        IMarginPool pool
    ) private {
        for (uint256 i = 0; i < actions.length; i++) {
            Actions.ActionArgs memory action = actions[i];
            Actions.ActionType actionType = action.actionType;

            if (actionType == Actions.ActionType.AddCollateral) {
                _addCollateral(vault, Actions.parseAddCollateral(action));
            } else if (actionType == Actions.ActionType.RemoveCollateral) {
                _removeCollateral(vault, Actions.parseRemoveCollateral(action));
            } else if (actionType == Actions.ActionType.AddLong) {
                _addLong(vault, Actions.parseAddLong(action));
            } else if (actionType == Actions.ActionType.RemoveLong) {
                _removeLong(vault, Actions.parseRemoveLong(action));
            } else if (actionType == Actions.ActionType.MintShort) {
                _mintShort(vault, Actions.parseMintShort(action));
            } else if (actionType == Actions.ActionType.BurnShort) {
                _burnShort(vault, Actions.parseBurnShort(action));
            }
        }
    }

    function _addCollateral(MarginAccountLib.Vault storage vault, Actions.AddCollateralArgs memory args) internal {
        // check collateral

        // update state
        vault.addCollateral(args.asset, args.amount);

        // pull token from user
        IERC20(args.asset).transferFrom(msg.sender, address(this), args.amount);
    }

    function _removeCollateral(MarginAccountLib.Vault storage vault, Actions.RemoveCollateralArgs memory args)
        internal
    {
        // check collateral

        // update state
        vault.removeCollateral(args.asset, args.amount);

        // pull token from user
        IERC20(args.asset).transfer(msg.sender, args.amount);
    }

    function _addLong(MarginAccountLib.Vault storage vault, Actions.AddLongArgs memory args) internal {
        // check long

        // update state
        vault.addLong(args.asset, args.amount);

        // pull token from user
        IERC20(args.asset).transferFrom(msg.sender, address(this), args.amount);
    }

    function _removeLong(MarginAccountLib.Vault storage vault, Actions.RemoveLongArgs memory args) internal {
        // check long

        // update state
        vault.removeLong(args.asset, args.amount);

        // transfer to user
        IERC20(args.asset).transfer(msg.sender, args.amount);
    }

    function _mintShort(MarginAccountLib.Vault storage vault, Actions.MintShortArgs memory args) internal {
        // check short

        // update state
        vault.addLong(args.asset, args.amount);

        // mint otokens
        IOtoken(args.asset).mint(msg.sender, args.amount);
    }

    function _burnShort(MarginAccountLib.Vault storage vault, Actions.BurnShortArgs memory args) internal {
        // check short

        // update state
        vault.removeLong(args.asset, args.amount);

        // burn token
        IOtoken(args.asset).burn(msg.sender, args.amount);
    }
}
