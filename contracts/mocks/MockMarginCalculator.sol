/**
 * SPDX-License-Identifier: UNLICENSED
 */
pragma solidity =0.6.10;

pragma experimental ABIEncoderV2;

import {MarginAccount} from "../libs/MarginAccount.sol";

contract MockMarginCalculator {
    // solhint-disable-ignore-no-unused-vars
    function isValidState(MarginAccount.Vault memory finalVault, address shortOtoken)
        external
        view
        returns (bool isValid)
    {
        return true;
    }
}
