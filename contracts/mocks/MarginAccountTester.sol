// SPDX-License-Identifier: UNLICENSED
pragma experimental ABIEncoderV2;

import {MarginAccount} from "../libs/MarginAccount.sol";

contract ActionTester {
    MarginAccount.Account private account;
    MarginAccount.Vault private vault;

    function testOpenNewVault() external {
        MarginAccount._openNewVault(account);
    }

    function testAddShort(
        address _shortOtoken,
        uint256 _amount,
        uint256 _index
    ) external {
        vault._addShort(_shortOtoken, _amount, _index);
    }

    function testRemoveShort(
        address _shortOtoken,
        uint256 _amount,
        uint256 _index
    ) external {
        vault._removeShort(_shortOtoken, _amount, _index);
    }
}
