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

    function openNewVault(Account storage _account) internal {
        //High Level: Increment vault numbers in account
        _account.vaultIds += 1;
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
