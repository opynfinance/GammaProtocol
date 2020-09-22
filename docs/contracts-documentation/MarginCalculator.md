## `MarginCalculator`

Calculator module that check if a given vault is valid.

### `constructor(address _addressBook)` (public)

### `getExpiredPayoutRate(address _otoken) → uint256` (external)

Return the net worth of an expired oToken in collateral.

### `getExcessCollateral(struct MarginAccount.Vault _vault) → uint256, bool` (public)

returns the net value of a vault in the valid collateral asset for that vault i.e. USDC for puts/ ETH for calls

### `_getExpiredCashValue(address _otoken) → uint256` (internal)

Return the cash value of an expired oToken.

For call return = Max (0, ETH Price - oToken.strike)

For put return Max(0, oToken.strike - ETH Price)

### `_getMarginRequired(struct MarginAccount.Vault _vault) → struct FixedPointInt256.FixedPointInt` (internal)

Calculate the amount of collateral needed for a spread vault.

The vault passed in already pass amount array length = asset array length check.

### `_getPutSpreadMarginRequired(struct FixedPointInt256.FixedPointInt _shortAmount, struct FixedPointInt256.FixedPointInt _longAmount, struct FixedPointInt256.FixedPointInt _shortStrike, struct FixedPointInt256.FixedPointInt _longStrike) → struct FixedPointInt256.FixedPointInt` (internal)

calculate put spread margin requirement.

this value is used

marginRequired = max( (short amount * short strike) - (long strike * min (short amount, long amount)) , 0 )

### `_getCallSpreadMarginRequired(struct FixedPointInt256.FixedPointInt _shortAmount, struct FixedPointInt256.FixedPointInt _longAmount, struct FixedPointInt256.FixedPointInt _shortStrike, struct FixedPointInt256.FixedPointInt _longStrike) → struct FixedPointInt256.FixedPointInt` (internal)

calculate call spread marigin requirement.

(long strike - short strike) * short amount

marginRequired =  max( ------------------------------------------------- , max ( short amount - long amount , 0) )

long strike

if long strike = 0 (no long token), then return net = short amount.

### `_getExpiredPutSpreadCashValue(struct FixedPointInt256.FixedPointInt _shortAmount, struct FixedPointInt256.FixedPointInt _longAmount, struct FixedPointInt256.FixedPointInt _shortCashValue, struct FixedPointInt256.FixedPointInt _longCashValue) → struct FixedPointInt256.FixedPointInt` (internal)

calculate cash value for an expired put spread vault.

Formula: net = (short cash value * short amount) - ( long cash value * long Amount )

### `_getExpiredCallSpreadCashValue(struct FixedPointInt256.FixedPointInt _shortAmount, struct FixedPointInt256.FixedPointInt _longAmount, struct FixedPointInt256.FixedPointInt _shortCashValue, struct FixedPointInt256.FixedPointInt _longCashValue, struct FixedPointInt256.FixedPointInt _underlyingPriceInt) → struct FixedPointInt256.FixedPointInt` (internal)

calculate cash value for an expired call spread vault.

(short cash value * short amount) - ( long cash value * long Amount )

Formula: net =   -------------------------------------------------------------------------

Underlying price

### `_checkIsValidSpread(struct MarginAccount.Vault _vault)` (internal)

ensure that the vault contains

a) at most 1 asset type used as collateral,

b) at most 1 series of option used as the long option and

c) at most 1 series of option used as the short option.

### `_isMarginableLong(struct MarginAccount.Vault _vault) → bool` (internal)

if there is a short option in the vault, ensure that the long option series being used is a valid margin.

### `_isMarginableCollateral(struct MarginAccount.Vault _vault) → bool` (internal)

if there is a short option in the vault, ensure that the collateral asset being used is a valid margin.

### `_getAssetPrice(address _asset, uint256 _expiry) → uint256 price, bool isFinalized` (internal)

internal function to get price of an asset

### `_getToCollateralRate(address _short) → struct FixedPointInt256.FixedPointInt` (internal)

internal function to calculate strike / underlying to collateral exchange rate.

for call, returns collateral / underlying rate

for put, returns collateral / strike rate

### `_uint256ToFPI(uint256 _num) → struct FixedPointInt256.FixedPointInt` (internal)

convert uint256 to FixedPointInt, no scaling invloved

### `_isEmptyAssetArray(address[] _assets) → bool` (internal)

check if array is empty or only have address(0)

### `_tokenAmountToInternalAmount(uint256 _amount, address _token) → uint256` (internal)

convert a uint256 amount

Examples:

(1)  USDC    decimals = 6

Input:  8000000 USDC =>     Output: 8 * 1e18 (8.0 USDC)

(2)  cUSDC   decimals = 8

Input:  8000000 cUSDC =>    Output: 8 * 1e16 (0.08 cUSDC)

(3)  rUSD    decimals = 20 (random USD)

Input:  15                    =>   Output:  0       rUSDC

### `_internalAmountToTokenAmount(uint256 _amount, address _token) → uint256` (internal)

convert an internal amount (1e18) to native token amount

Examples:

(1)  USDC    decimals = 6

Input:  8 * 1e18 (8.0 USDC)   =>   Output:  8000000 USDC

(2)  cUSDC   decimals = 8

Input:  8 * 1e16 (0.08 cUSDC) =>   Output:  8000000 cUSDC

(3)  rUSD    decimals = 20 (random USD)

Input:  1                    =>    Output:  100     rUSDC
