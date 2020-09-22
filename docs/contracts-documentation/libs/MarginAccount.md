# Functions:

- [`addShort(struct MarginAccount.Vault _vault, address _shortOtoken, uint256 _amount, uint256 _index)`]

- [`removeShort(struct MarginAccount.Vault _vault, address _shortOtoken, uint256 _amount, uint256 _index)`]

- [`addLong(struct MarginAccount.Vault _vault, address _longOtoken, uint256 _amount, uint256 _index)`]

- [`removeLong(struct MarginAccount.Vault _vault, address _longOtoken, uint256 _amount, uint256 _index)`]

- [`addCollateral(struct MarginAccount.Vault _vault, address _collateralAsset, uint256 _amount, uint256 _index)`]

- [`removeCollateral(struct MarginAccount.Vault _vault, address _collateralAsset, uint256 _amount, uint256 _index)`]

# Function `addShort(struct MarginAccount.Vault _vault, address _shortOtoken, uint256 _amount, uint256 _index)` {#MarginAccount-addShort-struct-MarginAccount-Vault-address-uint256-uint256-}

increase the short oToken balance in a vault when a new oToken is minted.

## Parameters:

- `_vault`: The vault the protocol is adding the short position to

- `_shortOtoken`: The address of the _shortOtoken the protocol is shorting from the user's vault

- `_amount`: The additional number of _shortOtoken the protocol is shorting from the user's vault

- `_index`: The index of _shortOtoken in the user's vault.shortOtokens array

# Function `removeShort(struct MarginAccount.Vault _vault, address _shortOtoken, uint256 _amount, uint256 _index)` {#MarginAccount-removeShort-struct-MarginAccount-Vault-address-uint256-uint256-}

decrease the short oToken balance in a vault when an oToken is burned.

## Parameters:

- `_vault`: The vault from which the protocol is decreasing the short position

- `_shortOtoken`: The address of the _shortOtoken of which the protocol is reducing the short position from the user's vault

- `_amount`: The number of _shortOtoken the protocol is reducing the user's position by from the user's vault

- `_index`: The index of _shortOtoken in the user's vault.shortOtokens array

# Function `addLong(struct MarginAccount.Vault _vault, address _longOtoken, uint256 _amount, uint256 _index)` {#MarginAccount-addLong-struct-MarginAccount-Vault-address-uint256-uint256-}

increase the long oToken balance in a vault when an oToken is deposited

## Parameters:

- `_vault`: The vault the protocol is adding the long position to

- `_longOtoken`: The address of the _longOtoken the protocol is adding to the user's vault

- `_amount`: The number of _longOtoken the protocol is adding to the user's vault

- `_index`: The index of _longOtoken in the user's vault.longOtokens array

# Function `removeLong(struct MarginAccount.Vault _vault, address _longOtoken, uint256 _amount, uint256 _index)` {#MarginAccount-removeLong-struct-MarginAccount-Vault-address-uint256-uint256-}

decrease the long oToken balance in a vault when an oToken is withdrawn

## Parameters:

- `_vault`: The vault from which the protocol is decreasing the short position

- `_longOtoken`: The address of the _longOtoken of which the protocol is reducing the long position from the user's vault

- `_amount`: The number of _longOtoken the protocol is reducing the user's long position by from the user's vault

- `_index`: The index of _longOtoken in the user's vault.longOtokens array

# Function `addCollateral(struct MarginAccount.Vault _vault, address _collateralAsset, uint256 _amount, uint256 _index)` {#MarginAccount-addCollateral-struct-MarginAccount-Vault-address-uint256-uint256-}

increase the collateral balance in a vault

## Parameters:

- `_vault`: The vault to which the protocol is adding the collateral

- `_collateralAsset`: The address of the _collateralAsset which the protocol is adding to the user's vault

- `_amount`: The number of _collateralAsset the protocol is adding to the user's collateral position in the user's vault

- `_index`: The index of _collateralAsset in the user's vault.collateralAssets array

# Function `removeCollateral(struct MarginAccount.Vault _vault, address _collateralAsset, uint256 _amount, uint256 _index)` {#MarginAccount-removeCollateral-struct-MarginAccount-Vault-address-uint256-uint256-}

decrease the collateral balance in a vault

## Parameters:

- `_vault`: The vault from which the protocol is removing the collateral

- `_collateralAsset`: The address of the _collateralAsset which the protocol is removing from the user's vault

- `_amount`: The number of _collateralAsset the protocol is removing from the user's collateral position in the user's vault

- `_index`: The index of _collateralAsset in the user's vault.collateralAssets array
