# `MarginCalculatorInterface`

## Functions:

- `addressBook() (external)`

- `getExpiredPayoutRate(address _otoken) (external)`

- `getExcessCollateral(struct MarginVault.Vault _vault, uint256 _vaultType) (external)`

- `isLiquidatable(struct MarginVault.Vault _vault, uint256 _vaultType, uint256 _vaultLatestUpdate, uint256 _roundId) (external)`

### Function `addressBook() → address external`

### Function `getExpiredPayoutRate(address _otoken) → uint256 external`

### Function `getExcessCollateral(struct MarginVault.Vault _vault, uint256 _vaultType) → uint256 netValue, bool isExcess external`

### Function `isLiquidatable(struct MarginVault.Vault _vault, uint256 _vaultType, uint256 _vaultLatestUpdate, uint256 _roundId) → bool, uint256, uint256 external`
