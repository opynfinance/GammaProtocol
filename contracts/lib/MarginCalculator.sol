// SPDX-License-Identifier: UNLICENSED
/* solhint-disable */
pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import {MarginAccountLib} from "./MarginAccount.sol";

library MarginCalculatorLib {
    function isSafeVault(MarginAccountLib.Vault storage vault, address denominate) internal returns (bool isValid) {}

    function marginRequirement(MarginAccountLib.Vault storage vault, address denominate)
        internal
        returns (bool isValid)
    {}
}
