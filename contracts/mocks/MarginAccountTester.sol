pragma solidity =0.6.10;

// SPDX-License-Identifier: UNLICENSED
pragma experimental ABIEncoderV2;

import {MarginAccount} from "../libs/MarginAccount.sol";

contract MarginAccountTester {
    using MarginAccount for MarginAccount.Account;
    using MarginAccount for MarginAccount.Vault;

    MarginAccount.Account private account;
    MarginAccount.Vault private vault;

    function getVault() external view returns (MarginAccount.Vault memory) {
        return vault;
    }

    function getAccount() external view returns (MarginAccount.Account memory) {
        return account;
    }

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

    function testAddLong(
        address _longOtoken,
        uint256 _amount,
        uint256 _index
    ) external {
        vault._addLong(_longOtoken, _amount, _index);
    }

    function testRemoveLong(
        address _longOtoken,
        uint256 _amount,
        uint256 _index
    ) external {
        vault._removeLong(_longOtoken, _amount, _index);
    }

    function testAddCollateral(
        address _collateralAsset,
        uint256 _amount,
        uint256 _index
    ) external {
        vault._addCollateral(_collateralAsset, _amount, _index);
    }

    function testRemoveCollateral(
        address _collateralAsset,
        uint256 _amount,
        uint256 _index
    ) external {
        vault._removeCollateral(_collateralAsset, _amount, _index);
    }

    function testClearVault() external {
        vault._clearVault();
    }
}
