# Functions:

- `constructor(address _addressBook) (public)`

- `getExpiredPayoutRate(address _otoken) (external)`

- `getExcessCollateral(struct MarginAccount.Vault _vault) (public)`

- `_getExpiredCashValue(address _otoken) (internal)`

- `_getMarginRequired(struct MarginAccount.Vault _vault) (internal)`

- `_getPutSpreadMarginRequired(struct FixedPointInt256.FixedPointInt _shortAmount, struct FixedPointInt256.FixedPointInt _longAmount, struct FixedPointInt256.FixedPointInt _shortStrike, struct FixedPointInt256.FixedPointInt _longStrike) (internal)`

- `_getCallSpreadMarginRequired(struct FixedPointInt256.FixedPointInt _shortAmount, struct FixedPointInt256.FixedPointInt _longAmount, struct FixedPointInt256.FixedPointInt _shortStrike, struct FixedPointInt256.FixedPointInt _longStrike) (internal)`

- `_getExpiredPutSpreadCashValue(struct FixedPointInt256.FixedPointInt _shortAmount, struct FixedPointInt256.FixedPointInt _longAmount, struct FixedPointInt256.FixedPointInt _shortCashValue, struct FixedPointInt256.FixedPointInt _longCashValue) (internal)`

- `_getExpiredCallSpreadCashValue(struct FixedPointInt256.FixedPointInt _shortAmount, struct FixedPointInt256.FixedPointInt _longAmount, struct FixedPointInt256.FixedPointInt _shortCashValue, struct FixedPointInt256.FixedPointInt _longCashValue, struct FixedPointInt256.FixedPointInt _underlyingPriceInt) (internal)`

- `_checkIsValidSpread(struct MarginAccount.Vault _vault) (internal)`

- `_isMarginableLong(struct MarginAccount.Vault _vault) (internal)`

- `_isMarginableCollateral(struct MarginAccount.Vault _vault) (internal)`

- `_getAssetPrice(address _asset, uint256 _expiry) (internal)`

- `_getToCollateralRate(address _short) (internal)`

- `_uint256ToFPI(uint256 _num) (internal)`

- `_isEmptyAssetArray(address[] _assets) (internal)`

- `_tokenAmountToInternalAmount(uint256 _amount, address _token) (internal)`

- `_internalAmountToTokenAmount(uint256 _amount, address _token) (internal)`

# Function `constructor(address _addressBook)` (public)

# Function `getExpiredPayoutRate(address _otoken) → uint256` (external)

Return the net worth of an expired oToken in collateral.

## Parameters:

- `_otoken`: otoken address

## Return Values:

- the exchange rate that shows how much collateral unit can be take out by 1 otoken unit, scaled by 1e18

# Function `getExcessCollateral(struct MarginAccount.Vault _vault) → uint256, bool` (public)

returns the net value of a vault in the valid collateral asset for that vault i.e. USDC for puts/ ETH for calls

## Parameters:

- `_vault`: the theoretical vault that needs to be checked

## Return Values:

- excessCollateral the amount by which the margin is above or below the required amount.

- isExcess true if there's excess margin in the vault. In this case, collateral can be taken out from the vault. False if there is insufficient margin and additional collateral needs to be added to the vault to create the position.

# Function `_getExpiredCashValue(address _otoken) → uint256` (internal)

Return the cash value of an expired oToken.

For call return = Max (0, ETH Price - oToken.strike)

For put return Max(0, oToken.strike - ETH Price)

## Parameters:

- `_otoken`: otoken address

## Return Values:

- the cash value of an expired otoken, denominated in strike asset. scaled by 1e18

# Function `_getMarginRequired(struct MarginAccount.Vault _vault) → struct FixedPointInt256.FixedPointInt` (internal)

Calculate the amount of collateral needed for a spread vault.

The vault passed in already pass amount array length = asset array length check.

## Parameters:

- `_vault`: the theoretical vault that needs to be checked

## Return Values:

- marginRequired the minimal amount of collateral needed in a vault.

# Function `_getPutSpreadMarginRequired(struct FixedPointInt256.FixedPointInt _shortAmount, struct FixedPointInt256.FixedPointInt _longAmount, struct FixedPointInt256.FixedPointInt _shortStrike, struct FixedPointInt256.FixedPointInt _longStrike) → struct FixedPointInt256.FixedPointInt` (internal)

calculate put spread margin requirement.

this value is used

marginRequired = max( (short amount * short strike) - (long strike * min (short amount, long amount)) , 0 )

## Return Values:

- margin requirement denominated in strike asset.

# Function `_getCallSpreadMarginRequired(struct FixedPointInt256.FixedPointInt _shortAmount, struct FixedPointInt256.FixedPointInt _longAmount, struct FixedPointInt256.FixedPointInt _shortStrike, struct FixedPointInt256.FixedPointInt _longStrike) → struct FixedPointInt256.FixedPointInt` (internal)

calculate call spread marigin requirement.

(long strike - short strike) * short amount

marginRequired =  max( ------------------------------------------------- , max ( short amount - long amount , 0) )

long strike

if long strike = 0 (no long token), then return net = short amount.

## Return Values:

- margin requirement denominated in underlying asset.

# Function `_getExpiredPutSpreadCashValue(struct FixedPointInt256.FixedPointInt _shortAmount, struct FixedPointInt256.FixedPointInt _longAmount, struct FixedPointInt256.FixedPointInt _shortCashValue, struct FixedPointInt256.FixedPointInt _longCashValue) → struct FixedPointInt256.FixedPointInt` (internal)

calculate cash value for an expired put spread vault.

Formula: net = (short cash value * short amount) - ( long cash value * long Amount )

## Return Values:

- cash value denominated in strike asset.

# Function `_getExpiredCallSpreadCashValue(struct FixedPointInt256.FixedPointInt _shortAmount, struct FixedPointInt256.FixedPointInt _longAmount, struct FixedPointInt256.FixedPointInt _shortCashValue, struct FixedPointInt256.FixedPointInt _longCashValue, struct FixedPointInt256.FixedPointInt _underlyingPriceInt) → struct FixedPointInt256.FixedPointInt` (internal)

calculate cash value for an expired call spread vault.

(short cash value * short amount) - ( long cash value * long Amount )

Formula: net =   -------------------------------------------------------------------------

Underlying price

## Return Values:

- cash value denominated in underlying asset.

# Function `_checkIsValidSpread(struct MarginAccount.Vault _vault)` (internal)

ensure that the vault contains

a) at most 1 asset type used as collateral,

b) at most 1 series of option used as the long option and

c) at most 1 series of option used as the short option.

## Parameters:

- `_vault`: the vault to check.

# Function `_isMarginableLong(struct MarginAccount.Vault _vault) → bool` (internal)

if there is a short option in the vault, ensure that the long option series being used is a valid margin.

## Parameters:

- `_vault`: the vault to check.

# Function `_isMarginableCollateral(struct MarginAccount.Vault _vault) → bool` (internal)

if there is a short option in the vault, ensure that the collateral asset being used is a valid margin.

## Parameters:

- `_vault`: the vault to check.

# Function `_getAssetPrice(address _asset, uint256 _expiry) → uint256 price, bool isFinalized` (internal)

internal function to get price of an asset

## Parameters:

- `_asset`: asset address

## Return Values:

- price the underlying asset price with 18 decimals

- isFinalized the price is finalized by the oracle and can't be changed

# Function `_getToCollateralRate(address _short) → struct FixedPointInt256.FixedPointInt` (internal)

internal function to calculate strike / underlying to collateral exchange rate.

for call, returns collateral / underlying rate

for put, returns collateral / strike rate

## Return Values:

- the exchange rate to convert amount in strike or underlying to equivilent value of collateral.

# Function `_uint256ToFPI(uint256 _num) → struct FixedPointInt256.FixedPointInt` (internal)

convert uint256 to FixedPointInt, no scaling invloved

## Return Values:

- the FixedPointInt format of input

# Function `_isEmptyAssetArray(address[] _assets) → bool` (internal)

check if array is empty or only have address(0)

## Return Values:

- isEmpty or not

# Function `_tokenAmountToInternalAmount(uint256 _amount, address _token) → uint256` (internal)

convert a uint256 amount

Examples:

(1)  USDC    decimals = 6

Input:  8000000 USDC =>     Output: 8 * 1e18 (8.0 USDC)

(2)  cUSDC   decimals = 8

Input:  8000000 cUSDC =>    Output: 8 * 1e16 (0.08 cUSDC)

(3)  rUSD    decimals = 20 (random USD)

Input:  15                    =>   Output:  0       rUSDC

## Return Values:

- internal amount that is sacled by 1e18.

# Function `_internalAmountToTokenAmount(uint256 _amount, address _token) → uint256` (internal)

convert an internal amount (1e18) to native token amount

Examples:

(1)  USDC    decimals = 6

Input:  8 * 1e18 (8.0 USDC)   =>   Output:  8000000 USDC

(2)  cUSDC   decimals = 8

Input:  8 * 1e16 (0.08 cUSDC) =>   Output:  8000000 cUSDC

(3)  rUSD    decimals = 20 (random USD)

Input:  1                    =>    Output:  100     rUSDC

## Return Values:

- token amount in its native form.
