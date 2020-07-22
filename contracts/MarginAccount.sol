pragma solidity 0.6.10;

library MarginAccount {
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

    //TODO: do I need to add events here? how do events interact with libraries?

    function openNewVault(Account storage _account) internal {
        //High Level: Increment vault numbers in account
        _account.vaultIds += 1;
    }

    function addShort(
        Vault storage _vault,
        address shortOtoken,
        uint256 amount,
        uint256 index
    ) internal {
        //High Level: increase the short oToken balance in a vault when a new oToken is minted.
        //Check the adding token is the same as vault.shortOtokens[idx] if it exists. (isn't that the same as the below?)
        //Reverts if vault.shortOtokens[index] != shortOtoken && vault.shortOtoken[index] !== address(0)
        require(_vault.shortOtokens[index] == shortOtoken);
        require(_vault.shortOtokens[index] != address(0));
        _vault.shortAmounts[index] += amount;
        return;
    }

    function removeShort(
        Vault storage _vault,
        address shortOtoken,
        uint256 amount,
        uint256 index
    ) internal {
        //High Level: decrease the short oToken balance in a vault when an oToken is burned.
        //Check the token is the same as vault.shortOtoken[idx] (isn't this the same as below?)
        //Revert if vault.shortOtoken[index] !== asset
        require(_vault.shortOtokens[index] == shortOtoken);
        //TODO: just to make sure - we don't need a require condition that ensures final state is nonnegative because of "flash loan" philosophy
        //TODO: do we need to ensure vault.shortOtoken[index] !== address(0) as we did in addShort()
        _vault.shortAmounts[index] -= amount;
        return;
    }

    function addLong(
        Vault storage _vault,
        address longOtoken,
        uint256 amount,
        uint256 index
    ) internal {
        //High Level: increase the long oToken balance in a vault when an oToken is deposited
        //Check the adding token is the same as vault.longOtoken[idx] if it exists.
        //Reverts if vault.longOtoken[index] != longOtoken && vault.longOtoken[index] !== address(0)
        //vault.longOtoken[index] += amount
        require(_vault.longOtokens[index] == longOtoken);
        require(_vault.longOtokens[index] != address(0));
        vault.longAmounts[index] += amount;
        return;
    }

    function removeLong(
        Vault storage _vault,
        address longOtoken,
        uint256 amount,
        uint256 index
    ) internal {
        //High Level: decrease the long oToken balance in a vault when an oToken is withdrawn
        //Check the token is the same as vault.longOtoken[idx]
        //Revert if vault.longOtoken[index] !== asset
        //vault.longAmounts[index] -= amount
        require(_vault.longOtoken[index] == longOtoken);
        //TODO: just to make sure - we don't need a require condition that ensures final state is nonnegative because of "flash loan" philosophy
        //TODO: do we need to ensure vault.longOtoken[index] !== address(0) as we did in addLong()
        //DO we need to deal with the address(0) check we have in the function above?
        vault.longAmounts[index] -= amount;
        return;
    }

    function addCollateral(
        Vault storage _vault,
        address collateralAsset,
        uint256 amount,
        uint256 index
    ) internal {
        //High Level: increase the collateral balance in a vault
        //Check the adding token is the same as vault.collateral[idx] if it exists.
        //Reverts if vault.collateral[index] != collateral && vault.collateral[index] !== address(0)
        //vault.collateral[index] += amount
        require(_vault.collateralAssets[index] == collateralAsset);
        require(_vault.collateralAssets[index] != address(0));
        //TODO: confused about the above - doesnt the above imply ETH can't be the collateral asset?
        //TODO: do we want error messages inline above?
        vault.collateralAmounts[index] += amount;
        return;
    }

    function removeCollateral(
        Vault storage _vault,
        address collateralAsset,
        uint256 amount,
        uint256 index
    ) internal {
        //High Level: decrease the collateral balance in a vault
        //Check the token is the same as vault.collateral[idx]
        //Revert if vault.collateral[index] !== asset
        //vault.collateral[index] -= amount
        require(_vault.collateralAssets[index] == collateralAsset);
        //TODO: do we need to deal with the address(0) check we have in the function above?
        vault.collateralAmounts[index] -= amount;
        return;
    }

    function clearVault(Vault storage vault) internal {
        //High Level: remove everything in the vault
        //Reset short, long and collateral assets and amounts arrays to [].
        //TODO: do we want to ensure enough gas first
        delete vault.shortAmounts;
        delete vault.longAmounts;
        delete vault.collateralAmounts;
        delete vault.shortOtokens;
        delete vault.longOtokens;
        delete vault.collateralAssets;
        return;
    }
}
