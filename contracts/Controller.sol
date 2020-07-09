// SPDX-License-Identifier: UNLICENSED
/* solhint-disable */

pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import {ControllerImpl} from "./lib/ControllerImpl.sol";
import {Actions} from "./lib/Actions.sol";
import {MarginAccountLib} from "./lib/MarginAccount.sol";

import {IAddressBook} from "./interfaces/IAddressBook.sol";

contract Controller {
    mapping(address => MarginAccountLib.Account) public accounts;

    IAddressBook public addressBook;

    constructor(IAddressBook _addressBook) public {
        addressBook = _addressBook;
    }

    function operate(
        address user,
        uint256 vaultId,
        Actions.ActionArgs[] calldata actions
    ) external {
        MarginAccountLib.Vault storage vault = accounts[user].vaults[vaultId];
        ControllerImpl._operate(vault, actions, addressBook);
    }
}
