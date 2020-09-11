/* SPDX-License-Identifier: UNLICENSED */
/* solhint-disable */
pragma solidity =0.6.10;
pragma experimental ABIEncoderV2;

import "./interfaces/CryticInterface.sol";
import "../Controller.sol";

contract PropertiesMint is CryticInterface, Controller {
    constructor() public {
        // Existing addresses:
        // - crytic_owner: If the contract has an owner, it must be crytic_owner
        // - crytic_user: Legitimate user
        // - crytic_attacker: Attacker
        //
        // Add below a minimal configuration:
        // - crytic_owner must have some tokens
        // - crytic_user must have some tokens
        // - crytic_attacker must have some tokens
        //
        //
        // Update the following if totalSupply and balanceOf are external functions or state variables:
    }

    function crytic_controller_aways_zero() public view returns (bool) {
        return address(this).balance == 0;
    }
}
