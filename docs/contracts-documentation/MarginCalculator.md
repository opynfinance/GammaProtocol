# `MarginCalculator`

Calculator module that checks if a given vault is valid, calculates margin requirements, and settlement proceeds

## Functions:

- `constructor(address _addressBook) (public)`

- `getExpiredPayoutRate(address _otoken) (external)`

- `getExcessCollateral(struct MarginVault.Vault _vault) (public)`

- `_getExpiredCashValue(address _otoken) (internal)`

- `_getMarginRequired(struct MarginVault.Vault _vault) (internal)`

- `_getPutSpreadMarginRequired(struct FixedPointInt256.FixedPointInt _shortAmount, struct FixedPointInt256.FixedPointInt _longAmount, struct FixedPointInt256.FixedPointInt _shortStrike, struct FixedPointInt256.FixedPointInt _longStrike) (internal)`

- `_getCallSpreadMarginRequired(struct FixedPointInt256.FixedPointInt _shortAmount, struct FixedPointInt256.FixedPointInt _longAmount, struct FixedPointInt256.FixedPointInt _shortStrike, struct FixedPointInt256.FixedPointInt _longStrike) (internal)`

- `_getExpiredSpreadCashValue(struct FixedPointInt256.FixedPointInt _shortAmount, struct FixedPointInt256.FixedPointInt _longAmount, struct FixedPointInt256.FixedPointInt _shortCashValue, struct FixedPointInt256.FixedPointInt _longCashValue) (internal)`

- `_checkIsValidVault(struct MarginVault.Vault _vault) (internal)`

- `_isMarginableLong(struct MarginVault.Vault _vault) (internal)`

- `_isMarginableCollateral(struct MarginVault.Vault _vault) (internal)`

- `_convertAmountOnLivePrice(struct FixedPointInt256.FixedPointInt _amount, address _assetA, address _assetB) (internal)`

- `_convertAmountOnExpiryPrice(struct FixedPointInt256.FixedPointInt _amount, address _assetA, address _assetB, uint256 _expiry) (internal)`

- `_isNotEmpty(address[] _assets) (internal)`

### Function `constructor(address _addressBook) public`

### Function `getExpiredPayoutRate(address _otoken) → uint256 external`

return the cash value of an expired oToken, denominated in collateral

#### Parameters:

- `_otoken`: oToken address

#### Return Values:

- how much collateral can be taken out by 1 otoken unit, scaled by 1e8,

or how much collateral can be taken out for 1 (1e8) oToken

### Function `getExcessCollateral(struct MarginVault.Vault _vault) → uint256, bool public`

returns the amount of collateral that can be removed from an actual or a theoretical vault

return amount is denominated in the collateral asset for the oToken in the vault, or the collateral asset in the vault

#### Parameters:

- `_vault`: theoretical vault that needs to be checked

#### Return Values:

- excessCollateral the amount by which the margin is above or below the required amount

- isExcess True if there is excess margin in the vault, False if there is a deficit of margin in the vault

if True, collateral can be taken out from the vault, if False, additional collateral needs to be added to vault

### Function `_getExpiredCashValue(address _otoken) → struct FixedPointInt256.FixedPointInt internal`

return the cash value of an expired oToken, denominated in strike asset

for a call, return Max (0, underlyingPriceInStrike - otoken.strikePrice)

for a put, return Max(0, otoken.strikePrice - underlyingPriceInStrike)

#### Parameters:

- `_otoken`: oToken address

#### Return Values:

- cash value of an expired otoken, denominated in the strike asset

### Function `_getMarginRequired(struct MarginVault.Vault _vault) → struct FixedPointInt256.FixedPointInt internal`

calculate the amount of collateral needed for a vault

vault passed in has already passed the checkIsValidVault function

#### Parameters:

- `_vault`: theoretical vault that needs to be checked

#### Return Values:

- marginRequired the minimal amount of collateral needed in a vault, denominated in collateral

### Function `_getPutSpreadMarginRequired(struct FixedPointInt256.FixedPointInt _shortAmount, struct FixedPointInt256.FixedPointInt _longAmount, struct FixedPointInt256.FixedPointInt _shortStrike, struct FixedPointInt256.FixedPointInt _longStrike) → struct FixedPointInt256.FixedPointInt internal`

returns the strike asset amount of margin required for a put or put spread with the given short oTokens, long oTokens and amounts

marginRequired = max( (short amount * short strike) - (long strike * min (short amount, long amount)) , 0 )

#### Return Values:

- margin requirement denominated in the strike asset

### Function `_getCallSpreadMarginRequired(struct FixedPointInt256.FixedPointInt _shortAmount, struct FixedPointInt256.FixedPointInt _longAmount, struct FixedPointInt256.FixedPointInt _shortStrike, struct FixedPointInt256.FixedPointInt _longStrike) → struct FixedPointInt256.FixedPointInt internal`

returns the underlying asset amount required for a call or call spread with the given short oTokens, long oTokens, and amounts

(long strike - short strike) * short amount

marginRequired =  max( ------------------------------------------------- , max (short amount - long amount, 0) )

long strike

if long strike = 0, return max( short amount - long amount, 0)

#### Return Values:

- margin requirement denominated in the underlying asset

### Function `_getExpiredSpreadCashValue(struct FixedPointInt256.FixedPointInt _shortAmount, struct FixedPointInt256.FixedPointInt _longAmount, struct FixedPointInt256.FixedPointInt _shortCashValue, struct FixedPointInt256.FixedPointInt _longCashValue) → struct FixedPointInt256.FixedPointInt internal`

calculate the cash value obligation for an expired vault, where a positive number is an obligation

Formula: net = (short cash value * short amount) - ( long cash value * long Amount )

#### Return Values:

- cash value obligation denominated in the strike asset

### Function `_checkIsValidVault(struct MarginVault.Vault _vault) internal`

ensure that:

a) at most 1 asset type used as collateral

b) at most 1 series of option used as the long option

c) at most 1 series of option used as the short option

d) asset array lengths match for long, short and collateral

e) long option and collateral asset is acceptable for margin with short asset

#### Parameters:

- `_vault`: the vault to check

### Function `_isMarginableLong(struct MarginVault.Vault _vault) → bool internal`

if there is a short option and a long option in the vault, ensure that the long option is able to be used as collateral for the short option

#### Parameters:

- `_vault`: the vault to check.

### Function `_isMarginableCollateral(struct MarginVault.Vault _vault) → bool internal`

if there is short option and collateral asset in the vault, ensure that the collateral asset is valid for the short option

#### Parameters:

- `_vault`: the vault to check.

### Function `_convertAmountOnLivePrice(struct FixedPointInt256.FixedPointInt _amount, address _assetA, address _assetB) → struct FixedPointInt256.FixedPointInt internal`

convert an amount in asset A to equivalent amount of asset B, based on a live price

function includes the amount and applies .mul() first to increase the accuracy

#### Parameters:

- `_amount`: amount in asset A

- `_assetA`: asset A

- `_assetB`: asset B

#### Return Values:

- _amount in asset B

### Function `_convertAmountOnExpiryPrice(struct FixedPointInt256.FixedPointInt _amount, address _assetA, address _assetB, uint256 _expiry) → struct FixedPointInt256.FixedPointInt internal`

convert an amount in asset A to equivalent amount of asset B, based on an expiry price

function includes the amount and apply .mul() first to increase the accuracy

#### Parameters:

- `_amount`: amount in asset A

- `_assetA`: asset A

- `_assetB`: asset B

#### Return Values:

- _amount in asset B

### Function `_isNotEmpty(address[] _assets) → bool internal`

check if asset array contain a token address

#### Return Values:

- True if the array is not empty
