# `MarginVault`

A library that provides the Controller with a Vault struct and the functions that manipulate vaults.

Vaults describe discrete position combinations of long options, short options, and collateral assets that a user can have.

## Functions:

- `addShort(struct MarginVault.Vault _vault, address _shortOtoken, uint256 _amount, uint256 _index) (external)`

- `removeShort(struct MarginVault.Vault _vault, address _shortOtoken, uint256 _amount, uint256 _index) (external)`

- `addLong(struct MarginVault.Vault _vault, address _longOtoken, uint256 _amount, uint256 _index) (external)`

- `removeLong(struct MarginVault.Vault _vault, address _longOtoken, uint256 _amount, uint256 _index) (external)`

- `addCollateral(struct MarginVault.Vault _vault, address _collateralAsset, uint256 _amount, uint256 _index) (external)`

- `removeCollateral(struct MarginVault.Vault _vault, address _collateralAsset, uint256 _amount, uint256 _index) (external)`

### Function `addShort(struct MarginVault.Vault _vault, address _shortOtoken, uint256 _amount, uint256 _index) external`

increase the short oToken balance in a vault when a new oToken is minted

#### Parameters:

- `_vault`: vault to add or increase the short position in

- `_shortOtoken`: address of the _shortOtoken being minted from the user's vault

- `_amount`: number of _shortOtoken being minted from the user's vault

- `_index`: index of _shortOtoken in the user's vault.shortOtokens array

### Function `removeShort(struct MarginVault.Vault _vault, address _shortOtoken, uint256 _amount, uint256 _index) external`

decrease the short oToken balance in a vault when an oToken is burned

#### Parameters:

- `_vault`: vault to decrease short position in

- `_shortOtoken`: address of the _shortOtoken being reduced in the user's vault

- `_amount`: number of _shortOtoken being reduced in the user's vault

- `_index`: index of _shortOtoken in the user's vault.shortOtokens array

### Function `addLong(struct MarginVault.Vault _vault, address _longOtoken, uint256 _amount, uint256 _index) external`

increase the long oToken balance in a vault when an oToken is deposited

#### Parameters:

- `_vault`: vault to add a long position to

- `_longOtoken`: address of the _longOtoken being added to the user's vault

- `_amount`: number of _longOtoken the protocol is adding to the user's vault

- `_index`: index of _longOtoken in the user's vault.longOtokens array

### Function `removeLong(struct MarginVault.Vault _vault, address _longOtoken, uint256 _amount, uint256 _index) external`

decrease the long oToken balance in a vault when an oToken is withdrawn

#### Parameters:

- `_vault`: vault to remove a long position from

- `_longOtoken`: address of the _longOtoken being removed from the user's vault

- `_amount`: number of _longOtoken the protocol is removing from the user's vault

- `_index`: index of _longOtoken in the user's vault.longOtokens array

### Function `addCollateral(struct MarginVault.Vault _vault, address _collateralAsset, uint256 _amount, uint256 _index) external`

increase the collateral balance in a vault

#### Parameters:

- `_vault`: vault to add collateral to

- `_collateralAsset`: address of the _collateralAsset being added to the user's vault

- `_amount`: number of _collateralAsset being added to the user's vault

- `_index`: index of _collateralAsset in the user's vault.collateralAssets array

### Function `removeCollateral(struct MarginVault.Vault _vault, address _collateralAsset, uint256 _amount, uint256 _index) external`

decrease the collateral balance in a vault

#### Parameters:

- `_vault`: vault to remove collateral from

- `_collateralAsset`: address of the _collateralAsset being removed from the user's vault

- `_amount`: number of _collateralAsset being removed from the user's vault

- `_index`: index of _collateralAsset in the user's vault.collateralAssets array
