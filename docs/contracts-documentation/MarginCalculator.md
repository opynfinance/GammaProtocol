# Functions:

- [`constructor(address _addressBook)`]

- [`getExpiredPayoutRate(address _otoken)`]

- [`getExcessCollateral(struct MarginAccount.Vault _vault)`]

# Function `constructor(address _addressBook)`

No description

# Function `getExpiredPayoutRate(address _otoken) → uint256`

No description

## Parameters:

- `_otoken`: otoken address

## Return Values:

- the exchange rate that shows how much collateral unit can be take out by 1 otoken unit, scaled by 1e18

# Function `getExcessCollateral(struct MarginAccount.Vault _vault) → uint256, bool`

No description

## Parameters:

- `_vault`: the theoretical vault that needs to be checked

## Return Values:

- excessCollateral the amount by which the margin is above or below the required amount.

- isExcess true if there's excess margin in the vault. In this case, collateral can be taken out from the vault. False if there is insufficient margin and additional collateral needs to be added to the vault to create the position.
