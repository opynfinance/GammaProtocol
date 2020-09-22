# Functions:

- [`getPrice(address _asset)`](#Oracle-getPrice-address-)

- [`getExpiryPrice(address _asset, uint256 _expiryTimestamp)`](#Oracle-getExpiryPrice-address-uint256-)

- [`getPricer(address _asset)`](#Oracle-getPricer-address-)

- [`getDisputer()`](#Oracle-getDisputer--)

- [`getPricerLockingPeriod(address _pricer)`](#Oracle-getPricerLockingPeriod-address-)

- [`getPricerDisputePeriod(address _pricer)`](#Oracle-getPricerDisputePeriod-address-)

- [`isLockingPeriodOver(address _asset, uint256 _expiryTimestamp)`](#Oracle-isLockingPeriodOver-address-uint256-)

- [`isDisputePeriodOver(address _asset, uint256 _expiryTimestamp)`](#Oracle-isDisputePeriodOver-address-uint256-)

- [`setAssetPricer(address _asset, address _pricer)`](#Oracle-setAssetPricer-address-address-)

- [`setLockingPeriod(address _pricer, uint256 _lockingPeriod)`](#Oracle-setLockingPeriod-address-uint256-)

- [`setDisputePeriod(address _pricer, uint256 _disputePeriod)`](#Oracle-setDisputePeriod-address-uint256-)

- [`setDisputer(address _disputer)`](#Oracle-setDisputer-address-)

- [`disputeExpiryPrice(address _asset, uint256 _expiryTimestamp, uint256 _price)`](#Oracle-disputeExpiryPrice-address-uint256-uint256-)

- [`setExpiryPrice(address _asset, uint256 _expiryTimestamp, uint256 _price)`](#Oracle-setExpiryPrice-address-uint256-uint256-)

# Events:

- [`DisputerUpdated(address newDisputer)`](#Oracle-DisputerUpdated-address-)

- [`PricerUpdated(address asset, address pricer)`](#Oracle-PricerUpdated-address-address-)

- [`PricerLockingPeriodUpdated(address pricer, uint256 lockingPeriod)`](#Oracle-PricerLockingPeriodUpdated-address-uint256-)

- [`PricerDisputePeriodUpdated(address pricer, uint256 disputePeriod)`](#Oracle-PricerDisputePeriodUpdated-address-uint256-)

- [`ExpiryPriceUpdated(address asset, uint256 expirtyTimestamp, uint256 price, uint256 onchainTimestamp)`](#Oracle-ExpiryPriceUpdated-address-uint256-uint256-uint256-)

- [`ExpiryPriceDisputed(address asset, uint256 expiryTimestamp, uint256 disputedPrice, uint256 newPrice, uint256 disputeTimestamp)`](#Oracle-ExpiryPriceDisputed-address-uint256-uint256-uint256-uint256-)

# Function `getPrice(address _asset) → uint256` {#Oracle-getPrice-address-}

No description

## Parameters:

- `_asset`: the asset address

## Return Values:

- price scaled in 1e18, denominated in USD

e.g. 173689000000000000000 => 175.689 USD

# Function `getExpiryPrice(address _asset, uint256 _expiryTimestamp) → uint256, bool` {#Oracle-getExpiryPrice-address-uint256-}

No description

## Parameters:

- `_asset`: the asset want to get price at.

- `_expiryTimestamp`: expiry timestamp

## Return Values:

- price denominated in USD, scaled 10e18

- isFinalized if the price is finalized or not.

# Function `getPricer(address _asset) → address` {#Oracle-getPricer-address-}

No description

## Parameters:

- `_asset`: get the pricer for a specific asset.

## Return Values:

- pricer address

# Function `getDisputer() → address` {#Oracle-getDisputer--}

No description

## Return Values:

- pricer address

# Function `getPricerLockingPeriod(address _pricer) → uint256` {#Oracle-getPricerLockingPeriod-address-}

during locking period, price can not be submitted to this contract

## Parameters:

- `_pricer`: pricer address

## Return Values:

- locking period

# Function `getPricerDisputePeriod(address _pricer) → uint256` {#Oracle-getPricerDisputePeriod-address-}

during dispute period, the owner of this contract can dispute the submitted price and modify it.

The dispute period start after submitting a price on-chain

## Parameters:

- `_pricer`: oracle address

## Return Values:

- dispute period

# Function `isLockingPeriodOver(address _asset, uint256 _expiryTimestamp) → bool` {#Oracle-isLockingPeriodOver-address-uint256-}

No description

## Parameters:

- `_asset`: asset address

- `_expiryTimestamp`: expiry timestamp

## Return Values:

- True if locking period is over, otherwise false

# Function `isDisputePeriodOver(address _asset, uint256 _expiryTimestamp) → bool` {#Oracle-isDisputePeriodOver-address-uint256-}

No description

## Parameters:

- `_asset`: assets to query

- `_expiryTimestamp`: expiry timestamp of otoken

## Return Values:

- True if dispute period is over, otherwise false

# Function `setAssetPricer(address _asset, address _pricer)` {#Oracle-setAssetPricer-address-address-}

can only be called by owner

## Parameters:

- `_asset`: asset

- `_pricer`: pricer address

# Function `setLockingPeriod(address _pricer, uint256 _lockingPeriod)` {#Oracle-setLockingPeriod-address-uint256-}

this function can only be called by owner

## Parameters:

- `_pricer`: pricer address

- `_lockingPeriod`: locking period

# Function `setDisputePeriod(address _pricer, uint256 _disputePeriod)` {#Oracle-setDisputePeriod-address-uint256-}

can only be called by owner

## Parameters:

- `_pricer`: oracle address

- `_disputePeriod`: dispute period

# Function `setDisputer(address _disputer)` {#Oracle-setDisputer-address-}

can only be called by owner

## Parameters:

- `_disputer`: oracle address

# Function `disputeExpiryPrice(address _asset, uint256 _expiryTimestamp, uint256 _price)` {#Oracle-disputeExpiryPrice-address-uint256-uint256-}

only owner can dispute a price during the dispute period, by setting a new one.

## Parameters:

- `_asset`: asset address

- `_expiryTimestamp`: expiry timestamp

- `_price`: the correct price

# Function `setExpiryPrice(address _asset, uint256 _expiryTimestamp, uint256 _price)` {#Oracle-setExpiryPrice-address-uint256-uint256-}

asset price can only be set after locking period is over and before starting dispute period

## Parameters:

- `_asset`: asset address

- `_expiryTimestamp`: expiry timestamp

- `_price`: the asset price at expiry

# Event `DisputerUpdated(address newDisputer)` {#Oracle-DisputerUpdated-address-}

No description

# Event `PricerUpdated(address asset, address pricer)` {#Oracle-PricerUpdated-address-address-}

No description

# Event `PricerLockingPeriodUpdated(address pricer, uint256 lockingPeriod)` {#Oracle-PricerLockingPeriodUpdated-address-uint256-}

No description

# Event `PricerDisputePeriodUpdated(address pricer, uint256 disputePeriod)` {#Oracle-PricerDisputePeriodUpdated-address-uint256-}

No description

# Event `ExpiryPriceUpdated(address asset, uint256 expirtyTimestamp, uint256 price, uint256 onchainTimestamp)` {#Oracle-ExpiryPriceUpdated-address-uint256-uint256-uint256-}

No description

# Event `ExpiryPriceDisputed(address asset, uint256 expiryTimestamp, uint256 disputedPrice, uint256 newPrice, uint256 disputeTimestamp)` {#Oracle-ExpiryPriceDisputed-address-uint256-uint256-uint256-uint256-}

No description
