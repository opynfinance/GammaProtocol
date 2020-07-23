pragma solidity =0.6.10;

import {SafeMath} from "./packages/oz/SafeMath.sol";

/**
 * SPDX-License-Identifier: UNLICENSED
 * @dev The MarginAccount is a library that provides Controller with an Account of Vault structs, and
 * the functions that manipulate vaults. Vaults describe positions that users have.
 */
library MarginAccount {
    using SafeMath for uint256;

    struct Account {
        address owner;
        uint256 vaultIds;
    }

    struct Vault {
        uint256[] shortAmounts;
        uint256[] longAmounts;
        uint256[] collateralAmounts;
        address[] shortOtokens;
        address[] longOtokens;
        address[] collateralAssets;
    }

    /**
     * @dev Increment vault numbers in account
     */
    function openNewVault(Account storage _account) internal {
        _account.vaultIds.add(1);
    }

    /**
     * @dev increase the short oToken balance in a vault when a new oToken is minted.
     */
    function addShort(
        Vault storage _vault,
        address shortOtoken,
        uint256 amount,
        uint256 index
    ) internal {
        //Check the adding token is the same as vault.shortOtokens[idx] if it exists. (isn't that the same as the below?)
        //Reverts if vault.shortOtokens[index] != shortOtoken && vault.shortOtoken[index] !== address(0)
        require(_vault.shortOtokens[index] == shortOtoken);
        require(_vault.shortOtokens[index] != address(0));
        _vault.shortAmounts[index].add(amount);
    }

    /**
     * @dev decrease the short oToken balance in a vault when an oToken is burned.
     */
    function removeShort(
        Vault storage _vault,
        address shortOtoken,
        uint256 amount,
        uint256 index
    ) internal {
        //Check the token is the same as vault.shortOtoken[idx] (isn't this the same as below?)
        //Revert if vault.shortOtoken[index] !== asset
        require(_vault.shortOtokens[index] == shortOtoken);
        _vault.shortAmounts[index].sub(amount);
    }

    /**
     * @dev increase the long oToken balance in a vault when an oToken is deposited
     */
    function addLong(
        Vault storage _vault,
        address longOtoken,
        uint256 amount,
        uint256 index
    ) internal {
        //Check the adding token is the same as vault.longOtoken[idx] if it exists.
        //Reverts if vault.longOtoken[index] != longOtoken && vault.longOtoken[index] !== address(0)
        //vault.longOtoken[index] += amount
        require(_vault.longOtokens[index] == longOtoken);
        require(_vault.longOtokens[index] != address(0));
        _vault.longAmounts[index].add(amount);
    }

    /**
     * @dev decrease the long oToken balance in a vault when an oToken is withdraw
     */
    function removeLong(
        Vault storage _vault,
        address longOtoken,
        uint256 amount,
        uint256 index
    ) internal {
        //Check the token is the same as vault.longOtoken[idx]
        //Revert if vault.longOtoken[index] !== asset
        //vault.longAmounts[index] -= amount
        require(_vault.longOtokens[index] == longOtoken);
        _vault.longAmounts[index].sub(amount);
    }

    /**
     * @dev increase the collateral balance in a vault
     */
    function addCollateral(
        Vault storage _vault,
        address collateralAsset,
        uint256 amount,
        uint256 index
    ) internal {
        //Check the adding token is the same as vault.collateral[idx] if it exists.
        //Reverts if vault.collateral[index] != collateral && vault.collateral[index] !== address(0)
        //vault.collateral[index] += amount
        require(_vault.collateralAssets[index] == collateralAsset);
        require(_vault.collateralAssets[index] != address(0));
        //TODO: confused about the above - doesnt the above imply ETH can't be the collateral asset?
        //TODO: do we want error messages inline above?
        _vault.collateralAmounts[index].add(amount);
    }

    /**
     * @dev decrease the collateral balance in a vault
     */
    function removeCollateral(
        Vault storage _vault,
        address collateralAsset,
        uint256 amount,
        uint256 index
    ) internal {
        //Check the token is the same as vault.collateral[idx]
        //Revert if vault.collateral[index] !== asset
        //vault.collateral[index] -= amount
        require(_vault.collateralAssets[index] == collateralAsset);
        _vault.collateralAmounts[index].sub(amount);
    }

    /**
     * @dev remove everything in a vault. Reset short, long and collateral assets and amounts arrays to [].
     */
    function clearVault(Vault storage _vault) internal {
        //TODO: do we want to ensure enough gas first
        //TODO: haythem what are you thinking about in terms of gas efficiency here?
        delete _vault.shortAmounts;
        delete _vault.longAmounts;
        delete _vault.collateralAmounts;
        delete _vault.shortOtokens;
        delete _vault.longOtokens;
        delete _vault.collateralAssets;
    }
}
