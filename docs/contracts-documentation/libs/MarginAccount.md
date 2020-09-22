## `MarginAccount`

The MarginAccount is a library that provides Controller with an Account of Vault structs, and

the functions that manipulate vaults. Vaults describe positions that users have.

### `addShort(struct MarginAccount.Vault _vault, address _shortOtoken, uint256 _amount, uint256 _index)` (external)

increase the short oToken balance in a vault when a new oToken is minted.

### `removeShort(struct MarginAccount.Vault _vault, address _shortOtoken, uint256 _amount, uint256 _index)` (external)

decrease the short oToken balance in a vault when an oToken is burned.

### `addLong(struct MarginAccount.Vault _vault, address _longOtoken, uint256 _amount, uint256 _index)` (external)

increase the long oToken balance in a vault when an oToken is deposited

### `removeLong(struct MarginAccount.Vault _vault, address _longOtoken, uint256 _amount, uint256 _index)` (external)

decrease the long oToken balance in a vault when an oToken is withdrawn

### `addCollateral(struct MarginAccount.Vault _vault, address _collateralAsset, uint256 _amount, uint256 _index)` (external)

increase the collateral balance in a vault

### `removeCollateral(struct MarginAccount.Vault _vault, address _collateralAsset, uint256 _amount, uint256 _index)` (external)

decrease the collateral balance in a vault
