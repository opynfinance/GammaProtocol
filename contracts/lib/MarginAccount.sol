// SPDX-License-Identifier: UNLICENSED
/* solhint-disable */
pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import {Actions} from "./Actions.sol";

library MarginAccountLib {
    struct Vault {
        mapping(address => uint256) longAmount;
        mapping(address => uint256) shortAmount;
        mapping(address => uint256) collAmount;
        address[] collAssets;
        address[] longAssets;
        address[] shortAssets;
    }

    struct Account {
        uint256 counter;
        mapping(uint256 => Vault) vaults;
    }

    function addCollateral(
        Vault storage vault,
        address asset,
        uint256 amount
    ) internal {
        vault.collAmount[asset] = vault.collAmount[asset] + amount;
        vault.collAssets.push(asset);
    }

    function removeCollateral(
        Vault storage vault,
        address asset,
        uint256 amount
    ) internal {
        vault.collAmount[asset] = vault.collAmount[asset] - amount;
    }

    function addLong(
        Vault storage vault,
        address asset,
        uint256 amount
    ) internal {
        vault.longAmount[asset] = vault.longAmount[asset] + amount;
        vault.longAssets.push(asset);
    }

    function removeLong(
        Vault storage vault,
        address asset,
        uint256 amount
    ) internal {
        vault.longAmount[asset] = vault.longAmount[asset] - amount;
    }
}
